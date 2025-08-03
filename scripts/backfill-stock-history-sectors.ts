import { PrismaClient } from '../src/generated/prisma';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSize = 200;

let totalStockUpdated = 0;
let totalHistoryProcessed = 0;
let totalHistoryUpdated = 0;
let totalHistorySkipped = 0;
let totalFailed = 0;

// Utility to normalize symbols
function normalizeSymbol(symbol: string): string {
    return symbol.replace(/\[.*?\]/g, '')  // remove tags like [DIP]
                 .replace(/\s+/g, '')      // remove all whitespace
                 .trim()
                 .toUpperCase();
  }
// Step 1: Update Stock table sector fields from NGX API
// Add these interfaces at the top of your file
interface NgxStockEntry {
  Symbol: string;
  Sector: string;
  // Add other properties as needed
}

type NgxApiResponse = NgxStockEntry[] | { data: NgxStockEntry[] };

// Then in your function
async function updateStockSectorsFromNgxApi() {
    console.log('🌐 Fetching NGX sector data...');
    const res = await fetch('https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0');
    const data = await res.json() as NgxApiResponse;
  
    const entries = Array.isArray(data) ? data : data?.data;
    
    if (!Array.isArray(entries)) {
      console.error('❌ Invalid NGX API response');
      return;
    }
  
    // Fetch all NGX stocks from DB to match against
    const existingStocks = await prisma.stock.findMany({
      where: { market: 'NGX' },
      select: { id: true, symbol: true, sector: true },
    });
  
    const stockMap = new Map<string, { id: string, sector: string | null }>(); 
    for (const s of existingStocks) {
      const normalized = normalizeSymbol(s.symbol);
      stockMap.set(normalized, { id: s.id, sector: s.sector });
    }
  
    let matchCount = 0;
  
    for (const entry of entries) {
      const rawSymbol = entry?.Symbol;
      const sector = entry?.Sector?.trim();
      if (!rawSymbol || !sector || sector === 'Unknown') continue;
  
      const normalizedSymbol = normalizeSymbol(rawSymbol);
      const stock = stockMap.get(normalizedSymbol);
      if (!stock) {
        console.log(`❌ No match in DB for NGX symbol: ${normalizedSymbol}`);
        continue;
      }
      
  
      const needsUpdate = !stock.sector || stock.sector === 'Unknown' || stock.sector.trim() === '';
  
      if (needsUpdate && !isDryRun) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: { sector },
        });
        totalStockUpdated++;
      }
  
      matchCount++;
    }
  
    console.log(`✅ Processed ${matchCount} matched NGX stocks`);
    console.log(`✅ Stock sector update complete. ${isDryRun ? 'Would have updated' : 'Updated'} ${totalStockUpdated} records.`);
  }
  

// Step 2: Backfill StockHistory.sector using updated Stock.sector
async function backfillStockHistorySectors() {
  console.log(`\n🔄 Starting StockHistory sector backfill ${isDryRun ? '(DRY RUN)' : ''}...`);

  const totalRecords = await prisma.stockHistory.count({
    where: {
      sector: 'Unknown',
      source: {
        in: ['gti-research', 'apt-securities'],
      },
    },
  });

  console.log(`Found ${totalRecords} StockHistory records that need updating`);

  if (totalRecords === 0) return;

  const batchCount = Math.ceil(totalRecords / batchSize);

  for (let batchNum = 0; batchNum < batchCount; batchNum++) {
    console.log(`📦 Processing batch ${batchNum + 1} of ${batchCount}`);

    const historyRecords = await prisma.stockHistory.findMany({
      where: {
        sector: 'Unknown',
        source: {
          in: ['gti-research', 'apt-securities'],
        },
      },
      select: {
        id: true,
        stockId: true,
      },
      take: batchSize,
      skip: batchNum * batchSize,
    });

    for (const record of historyRecords) {
      totalHistoryProcessed++;

      try {
        const stock = await prisma.stock.findUnique({
          where: { id: record.stockId },
          select: { sector: true, symbol: true },
        });

        if (!stock || !stock.sector || stock.sector === 'Unknown') {
            console.log(`⏭️ Skipping: Stock ID ${record.stockId} — Sector still unknown`);
            totalHistorySkipped++;
            continue;
          }
          
          

        if (!isDryRun) {
          await prisma.stockHistory.update({
            where: { id: record.id },
            data: { sector: stock.sector },
          });
        }

        totalHistoryUpdated++;
      } catch (err) {
        console.error(`❌ Error updating StockHistory ${record.id}:`, err);
        totalFailed++;
      }
    }
  }

  console.log('\n📊 Final Summary:');
  console.log(`✅ Stock records updated: ${isDryRun ? '0 (dry run)' : totalStockUpdated}`);
  console.log(`📄 StockHistory processed: ${totalHistoryProcessed}`);
  console.log(`✅ History updated: ${isDryRun ? '0 (dry run)' : totalHistoryUpdated}`);
  console.log(`⏭️ Skipped: ${totalHistorySkipped}`);
  console.log(`❌ Failed: ${totalFailed}`);
}

async function run() {
  await updateStockSectorsFromNgxApi();
  await backfillStockHistorySectors();
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
