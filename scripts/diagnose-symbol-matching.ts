import { PrismaClient } from '../src/generated/prisma';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Current normalization function
function normalizeSymbol(symbol: string): string {
  return symbol.replace(/\[.*?\]/g, '')  // remove tags like [DIP]
               .replace(/\s+/g, '')      // remove all whitespace
               .trim()
               .toUpperCase();
}

async function diagnoseSymbolMatching() {
  console.log('🔍 Starting symbol matching diagnosis...');
  
  // Fetch all NGX stocks from DB
  const dbStocks = await prisma.stock.findMany({
    where: { market: 'NGX' },
    select: { id: true, symbol: true, sector: true }
  });
  
  console.log(`📊 Found ${dbStocks.length} NGX stocks in database`);
  
  // Fetch symbols from NGX API
  console.log('🌐 Fetching NGX API data...');
  const res = await fetch('https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0');
  const data = await res.json() as { data?: any[] };
  
  if (!Array.isArray(data?.data)) {
    console.error('❌ Invalid NGX API response');
    return;
  }
  
  const apiSymbols = data.data
    .filter(entry => entry?.Symbol && entry?.Sector)
    .map(entry => ({
      rawSymbol: entry.Symbol,
      normalizedSymbol: normalizeSymbol(entry.Symbol),
      sector: entry.Sector.trim()
    }));
  
  console.log(`📊 Found ${apiSymbols.length} stocks in NGX API`);
  
  // Create maps for quick lookups
  const dbSymbolMap = new Map();
  const dbNormalizedMap = new Map();
  
  dbStocks.forEach(stock => {
    dbSymbolMap.set(stock.symbol, stock);
    dbNormalizedMap.set(normalizeSymbol(stock.symbol), stock);
  });
  
  // Track statistics
  let exactMatches = 0;
  let normalizedMatches = 0;
  let noMatches = 0;
  let sectorMismatches = 0;
  
  console.log('\n🔍 SYMBOL MATCHING ANALYSIS:\n');
  
  // Compare API symbols with DB symbols
  for (const apiSymbol of apiSymbols) {
    // Try exact match first
    const exactMatch = dbSymbolMap.get(apiSymbol.rawSymbol);
    
    if (exactMatch) {
      exactMatches++;
      if (exactMatch.sector !== apiSymbol.sector && apiSymbol.sector !== 'Unknown') {
        sectorMismatches++;
        console.log(`⚠️ SECTOR MISMATCH: "${apiSymbol.rawSymbol}" | DB: "${exactMatch.sector}" | API: "${apiSymbol.sector}"`);
      }
      continue;
    }
    
    // Try normalized match
    const normalizedMatch = dbNormalizedMap.get(apiSymbol.normalizedSymbol);
    
    if (normalizedMatch) {
      normalizedMatches++;
      console.log(`✓ NORMALIZED MATCH: API: "${apiSymbol.rawSymbol}" → DB: "${normalizedMatch.symbol}"`);
      
      if (normalizedMatch.sector !== apiSymbol.sector && apiSymbol.sector !== 'Unknown') {
        sectorMismatches++;
        console.log(`  ⚠️ SECTOR MISMATCH: DB: "${normalizedMatch.sector}" | API: "${apiSymbol.sector}"`);
      }
    } else {
      noMatches++;
      console.log(`❌ NO MATCH: API Symbol: "${apiSymbol.rawSymbol}" (Normalized: "${apiSymbol.normalizedSymbol}") | Sector: "${apiSymbol.sector}"`);
    }
  }
  
  // Check for DB symbols not in API
  console.log('\n🔍 DB SYMBOLS NOT FOUND IN API:\n');
  
  const apiNormalizedSet = new Set(apiSymbols.map(s => s.normalizedSymbol));
  
  for (const dbStock of dbStocks) {
    const normalizedDbSymbol = normalizeSymbol(dbStock.symbol);
    if (!apiNormalizedSet.has(normalizedDbSymbol)) {
      console.log(`❓ DB ONLY: "${dbStock.symbol}" | Normalized: "${normalizedDbSymbol}" | Sector: "${dbStock.sector}"`);
    }
  }
  
  // Print summary
  console.log('\n📊 MATCHING SUMMARY:');
  console.log(`Total DB Symbols: ${dbStocks.length}`);
  console.log(`Total API Symbols: ${apiSymbols.length}`);
  console.log(`Exact Matches: ${exactMatches}`);
  console.log(`Normalized Matches: ${normalizedMatches}`);
  console.log(`No Matches: ${noMatches}`);
  console.log(`Sector Mismatches: ${sectorMismatches}`);
  
  await prisma.$disconnect();
}

diagnoseSymbolMatching().catch(err => {
  console.error('Error in diagnosis:', err);
  process.exit(1);
});