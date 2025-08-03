import { PrismaClient } from '../src/generated/prisma';

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Statistics tracking
let updatedRecords = 0;
let skippedRecords = 0;
let errorRecords = 0;

// Main function
async function main() {
  console.log('🚀 Starting percentChange recalculation');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no database changes)' : '💾 LIVE RUN (updating database)'}`); 
  
  try {
    // Get all stocks
    const stocks = await prisma.stock.findMany();
    console.log(`Found ${stocks.length} stocks to process`);
    
    // Process each stock
    for (const stock of stocks) {
      await processStock(stock.id, stock.symbol);
      
      // Add a small delay to avoid overwhelming the database
      await delay(100);
    }
    
    // Print summary
    console.log('\n📊 Processing Summary:');
    console.log(`✅ Updated records: ${updatedRecords}`);
    console.log(`⏭️ Skipped records: ${skippedRecords}`);
    console.log(`❌ Error records: ${errorRecords}`);
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Process a single stock
async function processStock(stockId: string, symbol: string) {
  try {
    // Get all history records for this stock, ordered by date
    const historyRecords = await prisma.stockHistory.findMany({
      where: { stockId },
      orderBy: { date: 'asc' },
    });
    
    if (historyRecords.length <= 1) {
      // Skip stocks with 0 or 1 history records (need at least 2 for calculation)
      console.log(`[${symbol}] Skipping - insufficient history records (${historyRecords.length})`);
      return;
    }
    
    console.log(`Processing ${historyRecords.length} history records for stock ${symbol} (${stockId})`);
    
    // Process each history record except the first one
    for (let i = 1; i < historyRecords.length; i++) {
      const currentRecord = historyRecords[i];
      const previousRecord = historyRecords[i - 1];
      
      // Skip if previous record has invalid price
      if (previousRecord.price <= 0) {
        console.log(`[${symbol}] Skipping record ${currentRecord.date.toISOString()} - previous price invalid (${previousRecord.price})`);
        skippedRecords++;
        continue;
      }
      
      // Conditional processing based on source
      // For apt-securities: always recalculate
      // For other sources: only recalculate if percentChange is null or undefined
      if (currentRecord.source !== 'apt-securities' && currentRecord.percentChange !== null && currentRecord.percentChange !== undefined) {
        skippedRecords++;
        continue;
      }
      
      // Calculate percentChange using today's close and previous day's close
      const percentChange = ((currentRecord.price - previousRecord.price) / previousRecord.price) * 100;
      
      // Debug log
      console.log(`[${symbol}] ${previousRecord.date.toISOString()} -> ${currentRecord.date.toISOString()} | prev: ${previousRecord.price}, curr: ${currentRecord.price}, %: ${percentChange.toFixed(2)}% | source: ${currentRecord.source}`);
      
      // Update the record if not in dry run mode
      if (!isDryRun) {
        await prisma.stockHistory.update({
          where: { id: currentRecord.id },
          data: { percentChange },
        });
      }
      
      updatedRecords++;
      
      if (updatedRecords % 100 === 0) {
        console.log(`Progress: ${updatedRecords} records updated`);
      }
    }
  } catch (error) {
    console.error(`Error processing stock ${stockId}:`, error);
    errorRecords++;
  }
}

// Add delay function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute the main function
main()
  .catch((error) => {
    console.error('Error in main function:', error);
    process.exit(1);
  });