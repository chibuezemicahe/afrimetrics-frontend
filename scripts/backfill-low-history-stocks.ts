import { PrismaClient } from '../src/generated/prisma';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const targetSymbols = args.filter(arg => !arg.startsWith('--'));
const minHistoryThreshold = parseInt(args.find(arg => arg.startsWith('--min='))?.substring(6) || '100');
const maxHistoryThreshold = parseInt(args.find(arg => arg.startsWith('--max='))?.substring(6) || '500');

// Statistics tracking
let historiesAdded = 0;
let historiesSkipped = 0;
let failedRequests = 0;

// Source identifiers
const SOURCE_GTI = 'gti-research';
const SOURCE_APT = 'apt-securities';

// Date ranges for each source (matching the original scripts)
const APT_START_DATE = new Date('2020-01-06');
const APT_END_DATE = new Date('2022-08-31');
const GTI_START_DATE = new Date('2022-09-01');
const GTI_END_DATE = new Date(); // Today

// Overall date range for backfilling (derived from source ranges)
const startDate = new Date(Math.min(APT_START_DATE.getTime(), GTI_START_DATE.getTime()));
const endDate = new Date(Math.max(APT_END_DATE.getTime(), GTI_END_DATE.getTime()));

// Set of active NGX symbols
const activeNgxSymbols = new Set<string>();

// Enhanced symbol normalization function
function normalizeSymbol(symbol: string): string {
  return symbol
    .replace(/\[.*?\]/g, '') // Remove tags like [DIP], [BLS], etc.
    .replace(/\s+/g, '')      // Remove all whitespace
    .replace(/-/g, '')        // Remove hyphens (e.g., UAC-PROP → UACPROP)
    .trim()
    .toUpperCase();
}

// Symbol mapping for known renamed stocks
const symbolMappings: Record<string, string> = {
// Old symbol -> New symbol
'FBNH': 'FIRSTHOLDCO',
'ACCESS': 'ACCESSCORP',
'BOCGAS': 'IMG',
'UACPROP': 'UPDC',
'GUARANTY': 'GTCO',
'JAPAULOIL': 'JAPAULGOLD',
'STERLNBANK': 'STERLINGNG',
// Removed self-mappings for inactive symbols
};


// Reverse mapping for lookup in both directions
const reverseSymbolMappings: Record<string, string> = {};
Object.entries(symbolMappings).forEach(([oldSymbol, newSymbol]) => {
  reverseSymbolMappings[newSymbol] = oldSymbol;
});

// Cache for stock lookups to reduce database queries
interface StockInfo {
  id: string;
  symbol: string;
  normalizedSymbol: string;
  sector: string;
  historyCount: number;
  isActive: boolean; // New field to track if stock is in active NGX list
}

const stockCache = new Map<string, StockInfo>();
let allStocksLoaded = false;

// Function to load active NGX symbols from file
async function loadActiveNgxSymbols(): Promise<void> {
  const filePath = path.join(__dirname, 'active_ngx_symbols.txt');
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Active NGX symbols file not found at ${filePath}`);
      console.log('Please create this file with the list of currently listed NGX companies.');
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const symbols = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    symbols.forEach(symbol => {
      const normalizedSymbol = normalizeSymbol(symbol);
      activeNgxSymbols.add(normalizedSymbol);
    });
    
    console.log(`📋 Loaded ${activeNgxSymbols.size} active NGX symbols from file`);
  } catch (error) {
    console.error(`❌ Error loading active NGX symbols:`, error);
  }
}

// Function to load all stocks into cache
async function loadAllStocksToCache(): Promise<void> {
  if (allStocksLoaded) return;
  
  console.log('📊 Loading all NGX stocks into cache...');
  
  const stocks = await prisma.stock.findMany({
    where: { market: 'NGX' },
    select: { id: true, symbol: true, sector: true }
  });
  
  // For each stock, calculate history count
  for (const stock of stocks) {
    const historyCount = await prisma.stockHistory.count({
      where: { stockId: stock.id }
    });
    
    const normalizedSymbol = normalizeSymbol(stock.symbol);
    const isActive = activeNgxSymbols.has(normalizedSymbol);
    
    stockCache.set(stock.symbol, {
      id: stock.id,
      symbol: stock.symbol,
      normalizedSymbol,
      sector: stock.sector,
      historyCount,
      isActive
    });
    
    // Also cache by normalized symbol
    stockCache.set(normalizedSymbol, {
      id: stock.id,
      symbol: stock.symbol,
      normalizedSymbol,
      sector: stock.sector,
      historyCount,
      isActive
    });
  }
  
  console.log(`📊 Cached ${stocks.length} stocks`);
  allStocksLoaded = true;
}

// Function to find the correct stock ID for a symbol
async function findStockInfo(symbol: string): Promise<StockInfo | null> {
  await loadAllStocksToCache();
  
  // Step 1: Try exact match first
  if (stockCache.has(symbol)) {
    return stockCache.get(symbol) || null;
  }
  
  // Step 2: Try normalized match
  const normalizedSymbol = normalizeSymbol(symbol);
  if (stockCache.has(normalizedSymbol)) {
    return stockCache.get(normalizedSymbol) || null;
  }
  
  // Step 3: Check if this is a known renamed stock
  if (symbolMappings[normalizedSymbol]) {
    const mappedSymbol = symbolMappings[normalizedSymbol];
    if (stockCache.has(mappedSymbol)) {
      return stockCache.get(mappedSymbol) || null;
    }
  }
  
  // Step 4: Check reverse mappings
  if (reverseSymbolMappings[normalizedSymbol]) {
    const originalSymbol = reverseSymbolMappings[normalizedSymbol];
    if (stockCache.has(originalSymbol)) {
      return stockCache.get(originalSymbol) || null;
    }
  }
  
  return null;
}

// Cache for date checks to avoid repeated database queries
const dateCheckCache = new Map<string, Set<string>>();

// Function to check if a history record already exists for a stock on a specific date
async function historyExists(stockId: string, date: Date): Promise<boolean> {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const dateStr = normalizedDate.toISOString().split('T')[0];
  
  // Check cache first
  const cacheKey = stockId;
  if (!dateCheckCache.has(cacheKey)) {
    // Load all dates for this stock into cache
    const histories = await prisma.stockHistory.findMany({
      where: { stockId },
      select: { date: true }
    });
    
    const dateSet = new Set<string>();
    histories.forEach(h => dateSet.add(h.date.toISOString().split('T')[0]));
    dateCheckCache.set(cacheKey, dateSet);
  }
  
  const exists = dateCheckCache.get(cacheKey)?.has(dateStr) || false;
  
  // Add more detailed logging when history exists - only in dry run mode
  if (exists && isDryRun) {
    // Find the stock symbol for better logging
    let stockSymbol = "Unknown";
    for (const [symbol, info] of stockCache.entries()) {
      if (info.id === stockId) {
        stockSymbol = info.symbol;
        break;
      }
    }
    
    console.log(`🔄 [EXISTING RECORD] Found existing history for ${stockSymbol} on ${dateStr}`);
  }
  
  return exists;
}

// Function to process and save stock data to the database
async function processStockData(stockData: any, date: Date, source: string): Promise<boolean> {
  try {
    // Skip invalid data
    if (!stockData.closePrice || stockData.closePrice <= 0) {
      return false;
    }
    
    // Find the correct stock info
    const stockInfo = await findStockInfo(stockData.symbol);
    
    if (!stockInfo) {
      console.log(`⚠️ No matching stock found for symbol: ${stockData.symbol}`);
      return false;
    }
    
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // Check if history already exists for this date
    const exists = await historyExists(stockInfo.id, normalizedDate);
    
    if (exists) {
      console.log(`⏭️ Skipping: History already exists for ${stockData.symbol} on ${normalizedDate.toISOString().split('T')[0]}`);
      historiesSkipped++;
      return false;
    }
    
    // Create a new history record
    if (!isDryRun) {
      await prisma.stockHistory.create({
        data: {
          stockId: stockInfo.id,
          date: normalizedDate,
          price: stockData.closePrice,
          change: stockData.change || 0,
          percentChange: stockData.percentChange || 0,
          volume: stockData.volume || 0,
          value: stockData.value || 0,
          trades: stockData.trades || 0,
          source: source,
          sector: stockInfo.sector,
        },
      });
    }
    
    historiesAdded++;
    console.log(`✅ Added history for ${stockData.symbol} on ${normalizedDate.toISOString().split('T')[0]}`);
    
    // Update cache
    const cacheKey = stockInfo.id;
    const dateStr = normalizedDate.toISOString().split('T')[0];
    if (dateCheckCache.has(cacheKey)) {
      dateCheckCache.get(cacheKey)?.add(dateStr);
    }
    
    return true;
  } catch (error) {
    const dateStr = date.toISOString().split('T')[0];
    console.error(`❌ Error processing stock ${stockData.symbol} on ${dateStr}:`, error);
    return false;
  }
}

// Function to scrape stock data from APT Securities

async function retryRequest<T>(requestFn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: unknown) {
      lastError = error;
      console.log(`🔄 Attempt ${attempt}/${maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`);
      
      if (attempt < maxRetries) {
        // Add exponential backoff
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        console.log(`⏱️ Waiting ${backoffDelay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError; // All retries failed
}

// Then modify the axios calls in scrapeAptSecurities
async function scrapeAptSecurities(dateStr: string): Promise<any[]> {
  try {
    const url = `https://www.aptsecurities.com/nse-daily-price.php?date=${dateStr}`;
    console.log(`🔍 Fetching APT Securities data from: ${url}`);
    
    const response = await retryRequest(
      () => axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      }),
      3, // Max retries
      2000 // Base delay in ms
    );
    
    const $ = cheerio.load(response.data);
    const stockData: any[] = [];
    
    // Find the table with stock data - match the structure from scrape-historical-apt.ts
    $('table.table-bordered tbody tr').each((index, element) => {
      const columns = $(element).find('td');
      const symbol = $(element).find('th').text().trim();
      
      // Skip if no symbol or not enough columns
      if (!symbol || columns.length < 8) return;
      
      // Parse data from columns
      const openPrice = parseFloat($(columns[0]).text().trim()) || 0;
      const closePrice = parseFloat($(columns[1]).text().trim()) || 0;
      const highPrice = parseFloat($(columns[2]).text().trim()) || 0;
      const lowPrice = parseFloat($(columns[3]).text().trim()) || 0;
      
      // Calculate change as the difference between close and open
      const change = closePrice - openPrice;
      
      const trades = parseInt($(columns[5]).text().trim().replace(/,/g, '')) || 0;
      const volume = parseInt($(columns[6]).text().trim().replace(/,/g, '')) || 0;
      const value = parseFloat($(columns[7]).text().trim().replace(/,/g, '')) || 0;
      
      stockData.push({
        symbol,
        closePrice,
        change,
        volume,
        value,
        trades
      });
    });
    
    console.log(`📊 Found ${stockData.length} stocks from APT Securities for ${dateStr}`);
    return stockData;
  } catch (error) {
    console.error(`❌ Error scraping APT Securities for ${dateStr} after all retry attempts:`, error.message);
    failedRequests++;
    return [];
  }
}

// Function to generate various URL formats for GTI Research
function generateGtiUrlFormats(date: Date): string[] {
  const dayOfWeek = date.getDay();
  const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek].toLowerCase();
  const day = date.getDate();
  const dayStr = day.toString().padStart(2, '0'); // 01, 02, ..., 31
  const dayStrUnpadded = day.toString(); // 1, 2, ..., 31
  const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][date.getMonth()].toLowerCase();
  const year = date.getFullYear();
  
  // Get ordinal suffix
  let ordinalSuffix = 'th';
  if (day > 3 && day < 21) ordinalSuffix = 'th';
  else if (day % 10 === 1) ordinalSuffix = 'st';
  else if (day % 10 === 2) ordinalSuffix = 'nd';
  else if (day % 10 === 3) ordinalSuffix = 'rd';
  else ordinalSuffix = 'th';
  
  // Base URL
  const baseUrl = 'https://research.gti.com.ng/';
  
  // Different path patterns
  const pathPatterns = [
    // Format variations with "for"
    `ngx-price-list-for-${weekday}-${dayStr}-${month}-${year}/`,
    `ngx-price-list-for-${weekday}-${dayStrUnpadded}-${month}-${year}/`,
    `ngx-price-list-for-${weekday}-${dayStr}${ordinalSuffix}-${month}-${year}/`,
    `ngx-price-list-for-${weekday}-${dayStrUnpadded}${ordinalSuffix}-${month}-${year}/`,
    
    // Format variations without "for"
    `ngx-price-list-${weekday}-${dayStr}-${month}-${year}/`,
    `ngx-price-list-${weekday}-${dayStrUnpadded}-${month}-${year}/`,
    `ngx-price-list-${weekday}-${dayStr}${ordinalSuffix}-${month}-${year}/`,
    `ngx-price-list-${weekday}-${dayStrUnpadded}${ordinalSuffix}-${month}-${year}/`,
    
    // Additional potential formats
    `ngx-price-list-${dayStr}-${month}-${year}/`,
    `ngx-price-list-${dayStr}${ordinalSuffix}-${month}-${year}/`,
    `ngx-daily-price-list-${weekday}-${dayStr}-${month}-${year}/`,
    `ngx-daily-price-list-${weekday}-${dayStr}${ordinalSuffix}-${month}-${year}/`
  ];
  
  // Generate full URLs
  return pathPatterns.map(path => baseUrl + path);
}

// Function to scrape stock data from GTI Research
async function scrapeGtiResearch(date: Date): Promise<any[]> {
  const urls = generateGtiUrlFormats(date);
  const dateStr = date.toISOString().split('T')[0];
  
  for (const url of urls) {
    try {
      console.log(`🔍 Trying GTI Research URL: ${url}`);
      
      const response = await retryRequest(
        () => axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        }),
        3, // Max retries
        2000 // Base delay in ms
      );
      
      const $ = cheerio.load(response.data);
      const stockData: any[] = [];
      
      // Try different table selectors
      const tableSelectors = [
        'table[id^="tablepress-"]', // Tables with ID starting with tablepress-
        '.tablepress',               // Tables with class tablepress
        'table.dataTable',           // Tables with class dataTable
        'table'                      // Fallback to any table
      ];
      
      let foundTable = false;
      
      for (const selector of tableSelectors) {
        const tables = $(selector);
        
        if (tables.length > 0) {
          console.log(`📊 Found ${tables.length} tables with selector: ${selector}`);
          
          tables.each((tableIndex, tableElement) => {
            // Check if this table has the expected structure
            const headerRow = $(tableElement).find('tr').first();
            const headerCells = $(headerRow).find('th');
            
            // Log the header cells to help debug
            const headerTexts: string[] = [];
            headerCells.each((i, el) => {
              headerTexts.push($(el).text().trim());
            });
            
            // Check if this looks like a stock table
            if (headerTexts.some(text => 
                text.includes('COMPANY') || 
                text.includes('SYMBOL') || 
                text.includes('CLOSE') || 
                text.includes('CHANGE'))) {
              
              foundTable = true;
              
              // Find column indices based on headers
              const symbolIndex = headerTexts.findIndex(text => 
                text.includes('COMPANY') || text.includes('SYMBOL'));
              const closeIndex = headerTexts.findIndex(text => text.includes('CLOSE'));
              const changeIndex = headerTexts.findIndex(text => text.includes('CHANGE') && !text.includes('%'));
              const volumeIndex = headerTexts.findIndex(text => text.includes('VOLUME'));
              const valueIndex = headerTexts.findIndex(text => text.includes('VALUE'));
              const tradesIndex = headerTexts.findIndex(text => text.includes('TRADES'));
              
              // Process data rows
              $(tableElement).find('tr').each((rowIndex, rowElement) => {
                // Skip header row
                if (rowIndex === 0) return;
                
                const columns = $(rowElement).find('td');
                
                // Check if this is a valid data row
                if (columns.length < Math.max(symbolIndex, closeIndex, volumeIndex) + 1) return;
                
                // Get symbol from the appropriate column
                const symbol = symbolIndex >= 0 ? $(columns[symbolIndex]).text().trim() : '';
                
                // Skip empty rows or summary rows
                if (!symbol || symbol === 'TOTAL TRANSACTION' || symbol.includes('TOTAL')) return;
                
                // Parse numeric values
                const parseNumeric = (index: number, defaultValue = 0): number => {
                  if (index < 0 || index >= columns.length) return defaultValue;
                  const text = $(columns[index]).text().trim();
                  const cleanedText = text.replace(/,/g, '').replace(/[^0-9.-]/g, '');
                  const value = parseFloat(cleanedText);
                  return isNaN(value) ? defaultValue : value;
                };
                
                const close = parseNumeric(closeIndex);
                const change = changeIndex >= 0 ? parseNumeric(changeIndex) : 0;
                const volume = parseNumeric(volumeIndex);
                const value = parseNumeric(valueIndex);
                const trades = parseNumeric(tradesIndex);
                
                stockData.push({
                  symbol,
                  closePrice: close,
                  change,
                  volume,
                  value,
                  trades
                });
              });
            }
          });
        }
        
        // If we found and processed a table, break the loop
        if (foundTable && stockData.length > 0) break;
      }
      
      if (stockData.length > 0) {
        console.log(`✅ Successfully scraped ${stockData.length} stocks from GTI Research for ${dateStr}`);
        return stockData;
      }
      
      console.log(`⚠️ No stock data found in tables for URL: ${url}`);
    } catch (error) {
      console.log(`⚠️ Failed to fetch GTI Research URL: ${url} - ${error.message}`);
    }
  }
  
  console.error(`❌ All GTI Research URL attempts failed for ${dateStr}`);
  failedRequests++;
  return [];
}

// Function to get stocks with low history counts that are also active
async function getStocksWithLowHistoryCounts(): Promise<StockInfo[]> {
  await loadAllStocksToCache();
  
  return Array.from(stockCache.values())
    .filter(stock => {
      // Remove duplicates (same stock with different cache keys)
      return stock.symbol === stock.normalizedSymbol || 
             !stockCache.has(stock.normalizedSymbol) || 
             stockCache.get(stock.normalizedSymbol)?.id === stock.id;
    })
    .filter(stock => {
      // Only include active stocks
      return stock.isActive;
    })
    .filter(stock => stock.historyCount >= minHistoryThreshold && stock.historyCount <= maxHistoryThreshold)
    .sort((a, b) => a.historyCount - b.historyCount);
}

// Main function
async function main() {
  console.log(`🚀 Starting historical data backfill (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);  
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no database changes)' : '💾 LIVE RUN (updating database)'}`); 
  console.log(`Target: Active NGX stocks with history count between ${minHistoryThreshold} and ${maxHistoryThreshold}`);
  
  // Load active NGX symbols first
  await loadActiveNgxSymbols();
  
  let stocksToProcess: StockInfo[] = [];
  
  if (targetSymbols.length > 0) {
    // Process specific stocks if provided
    for (const symbol of targetSymbols) {
      const stockInfo = await findStockInfo(symbol);
      if (!stockInfo) {
        console.error(`❌ No stock found with symbol: ${symbol}`);
        continue;
      }
      
      // Check if the targeted symbol is in the active list
      if (!stockInfo.isActive) {
        console.warn(`⚠️ Explicitly targeted symbol '${symbol}' is not in the active NGX symbols list. Skipping.`);
        continue;
      }
      
      stocksToProcess.push(stockInfo);
    }
  } else {
    // Otherwise, get active stocks with low history counts
    stocksToProcess = await getStocksWithLowHistoryCounts();
  }
  
  console.log(`🎯 Found ${stocksToProcess.length} stocks to process`);
   
  // Create a map of stock IDs to stock info for quick lookup
  const stockMap = new Map<string, StockInfo>();
  stocksToProcess.forEach(stock => stockMap.set(stock.id, stock));
  
  // Current date pointer
  const currentDate = new Date(startDate);
  
  // Loop through each day in the date range
  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Format date for URL: YYYY-MM-DD
    const dateStr = currentDate.toISOString().split('T')[0];
    console.log(`\n📅 Processing date: ${dateStr}`);
    
    try {
      // Determine which source to use based on date
      if (currentDate >= APT_START_DATE && currentDate <= APT_END_DATE) {
        // Use APT Securities for dates in its range
        try {
          const aptData = await scrapeAptSecurities(dateStr);
          if (aptData && aptData.length > 0) {
            console.log(`📊 Processing ${aptData.length} stocks from APT Securities for ${dateStr}`);
            
            // Process all stocks from this date's data
            for (const data of aptData) {
              const dataStockInfo = await findStockInfo(data.symbol);
              if (dataStockInfo && stockMap.has(dataStockInfo.id)) {
                await processStockData(data, currentDate, SOURCE_APT);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ APT Securities source failed for ${dateStr}`);
        }
      }
      
      // Use GTI Research for dates in its range
      if (currentDate >= GTI_START_DATE && currentDate <= GTI_END_DATE) {
        try {
          const gtiData = await scrapeGtiResearch(currentDate);
          if (gtiData && gtiData.length > 0) {
            console.log(`📊 Processing ${gtiData.length} stocks from GTI Research for ${dateStr}`);
            
            // Process all stocks from this date's data
            for (const data of gtiData) {
              const dataStockInfo = await findStockInfo(data.symbol);
              if (dataStockInfo && stockMap.has(dataStockInfo.id)) {
                await processStockData(data, currentDate, SOURCE_GTI);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ GTI Research source failed for ${dateStr}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing date ${dateStr}:`, error);
      failedRequests++;
    }
    
    // Add 1 day to the current date
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Add delay between dates
    await delay(500);
  } // Close the while loop
  
  // Print summary
  console.log('\n📊 Backfill Summary:');
  console.log(`📝 History entries added: ${historiesAdded}`);
  console.log(`⏭️ History entries skipped (already exist): ${historiesSkipped}`);
  console.log(`❌ Failed requests: ${failedRequests}`);
  
  await prisma.$disconnect();
}

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute the main function
main()
  .catch((error) => {
    console.error('Error in main function:', error);
    process.exit(1);
  });
