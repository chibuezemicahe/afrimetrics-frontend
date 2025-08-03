import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '../src/generated/prisma';

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Date range for scraping (2022-09-01 to today)
const startDate = new Date('2022-09-01');
const endDate = new Date(); // Today

// const startDate = new Date('2022-08-22');
// const endDate = new Date('2022-08-22');

// Statistics tracking
let newStocks = 0;
let updatedStocks = 0;
let historiesAdded = 0;
let failedDates: string[] = [];

// Source identifier
const SOURCE = 'gti-research';

// Weekday names for URL formatting
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// Function to get ordinal suffix for a day number (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Function to generate all possible URL formats for a given date
function generateUrlFormats(date: Date): string[] {
  const dayOfWeek = date.getDay();
  const weekday = weekdays[dayOfWeek].toLowerCase();
  const day = date.getDate();
  const dayStr = day.toString().padStart(2, '0'); // 01, 02, ..., 31
  const dayStrUnpadded = day.toString(); // 1, 2, ..., 31
  const month = months[date.getMonth()].toLowerCase();
  const year = date.getFullYear();
  const ordinalSuffix = getOrdinalSuffix(day);
  
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

// Main function
async function main() {
  console.log(`🚀 Starting GTI Research historical data scraper (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`); 
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no database changes)' : '💾 LIVE RUN (updating database)'}`); 
  
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
    
    try {
      // Generate all possible URL formats for this date
      const urlFormats = generateUrlFormats(currentDate);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      let stocksData: any[] = [];
      let successfulUrl = '';
      
      // Try each URL format until we get data
      for (const url of urlFormats) {
        console.log(`📅 Trying URL: ${url}`);
        try {
          const data = await scrapeGtiResearch(url);
          if (data.length > 0) {
            stocksData = data;
            successfulUrl = url;
            console.log(`✅ Successfully retrieved data from: ${url}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Failed with URL: ${url}`);
          // Continue to next URL format
        }
      }
      
      if (stocksData.length === 0) {
        console.log(`⚠️ No data found for ${dateStr} after trying ${urlFormats.length} URL formats (possibly a holiday or no trading day)`);
        failedDates.push(dateStr);
      } else {
        console.log(`✅ Found ${stocksData.length} stocks for ${dateStr} using URL: ${successfulUrl}`);
        
        // Process the scraped data
        if (!isDryRun) {
          await processStocksData(stocksData, currentDate);
        } else {
          console.log(`🔍 [DRY RUN] Would process ${stocksData.length} stocks for ${dateStr}`);
        }
      }
    } catch (error) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.error(`❌ Error processing ${dateStr}:`, error);
      failedDates.push(dateStr);
    }
    
    // Add 1 day to the current date
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Add delay between requests to avoid overwhelming the server
    await delay(1000); // 1 second delay
  }
  
  // Print summary
  console.log('\n📊 Scraping Summary:');
  console.log(`📈 New stocks added: ${newStocks}`);
  console.log(`🔄 Stocks updated: ${updatedStocks}`);
  console.log(`📝 History entries added: ${historiesAdded}`);
  
  if (failedDates.length > 0) {
    console.log(`\n⚠️ Failed dates (${failedDates.length}):`);
    console.log(failedDates.join('\n'));
  }
  
  await prisma.$disconnect();
}

// Function to scrape GTI Research data for a specific date
async function scrapeGtiResearch(url: string) {
  try {
    console.log(`🌐 Fetching ${url}`);
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse HTML using cheerio
    const $ = cheerio.load(html);
    
    // Extract stock data from the table
    const stocksData: any[] = [];
    
    // Find the table with stock data - use more specific selector based on the HTML structure
    // Try multiple possible table selectors
    const tableSelectors = [
      'table[id^="tablepress-"]', // Tables with ID starting with tablepress-
      '.tablepress',               // Tables with class tablepress
      'table.dataTable',           // Tables with class dataTable
      'table'                      // Fallback to any table
    ];
    
    let tableFound = false;
    
    for (const selector of tableSelectors) {
      const tables = $(selector);
      if (tables.length > 0) {
        console.log(`📋 Found ${tables.length} tables with selector: ${selector}`);
        
        tables.each((tableIndex, tableElement) => {
          // Check if this table has the expected structure
          const headerRow = $(tableElement).find('tr').first();
          const headerCells = $(headerRow).find('th');
          
          // Log the header cells to help debug
          const headerTexts: string[] = [];
          headerCells.each((i, el) => {
            headerTexts.push($(el).text().trim());
            return true; // Explicitly return true to match the expected return type
          });
          console.log(`📋 Table ${tableIndex} headers: ${headerTexts.join(' | ')}`);
          
          // Check if this looks like a stock table (has COMPANY, CLOSE, etc.)
          if (headerTexts.some(text => 
              text.includes('COMPANY') || 
              text.includes('SYMBOL') || 
              text.includes('CLOSE') || 
              text.includes('CHANGE'))) {
            
            console.log(`📋 Found stock table with headers: ${headerTexts.join(' | ')}`);
            tableFound = true;
            
            // Find column indices based on headers
            const symbolIndex = headerTexts.findIndex(text => 
              text.includes('COMPANY') || text.includes('SYMBOL'));
            const pCloseIndex = headerTexts.findIndex(text => text.includes('PCLOSE'));
            const openIndex = headerTexts.findIndex(text => text.includes('OPEN'));
            const highIndex = headerTexts.findIndex(text => text.includes('HIGH'));
            const lowIndex = headerTexts.findIndex(text => text.includes('LOW'));
            const closeIndex = headerTexts.findIndex(text => text.includes('CLOSE'));
            const changeIndex = headerTexts.findIndex(text => text.includes('CHANGE') && !text.includes('%'));
            const percentChangeIndex = headerTexts.findIndex(text => text.includes('%CHANGE'));
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
              
              // Parse numeric values with better error handling
              const parseNumeric = (index: number, defaultValue = 0): number => {
                if (index < 0 || index >= columns.length) return defaultValue;
                const text = $(columns[index]).text().trim();
                // Remove commas and any non-numeric characters except decimal point
                const cleanedText = text.replace(/,/g, '').replace(/[^0-9.-]/g, '');
                const value = parseFloat(cleanedText);
                return isNaN(value) ? defaultValue : value;
              };
              
              const pClose = parseNumeric(pCloseIndex);
              const open = parseNumeric(openIndex);
              const high = parseNumeric(highIndex);
              const low = parseNumeric(lowIndex);
              const close = parseNumeric(closeIndex);
              
              // Calculate change and percentChange if not available directly
              let change = changeIndex >= 0 ? parseNumeric(changeIndex) : (close - pClose);
              let percentChange = percentChangeIndex >= 0 ? 
                parseNumeric(percentChangeIndex) : 
                (pClose > 0 ? ((close - pClose) / pClose) * 100 : 0);
              
              // Extract volume, value, and trades
              const volume = parseNumeric(volumeIndex);
              const value = parseNumeric(valueIndex);
              const trades = parseNumeric(tradesIndex);
              
              stocksData.push({
                symbol,
                name: symbol, // Use symbol as name if actual name is not available
                closePrice: close,
                change,
                percentChange,
                volume,
                value,
                trades,
              });
            });
          }
        });
      }
      
      // If we found and processed a table, break the loop
      if (tableFound && stocksData.length > 0) break;
    }
    
    if (!tableFound) {
      console.log('⚠️ No suitable table found on the page');
    }
    
    return stocksData;
  } catch (error) {
    console.error(`Error fetching data from GTI Research:`, error);
    throw error; // Rethrow to try alternative URLs
  }
}

// Function to process and save stock data to the database
async function processStocksData(stocksData: any[], date: Date) {
  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 20;
  for (let i = 0; i < stocksData.length; i += batchSize) {
    const batch = stocksData.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (stockData) => {
        try {
          // Skip invalid data
          if (!stockData.closePrice || stockData.closePrice <= 0) {
            return;
          }
          
          // Use upsert to avoid duplicate inserts
          const existingStock = await prisma.stock.findUnique({
            where: {
              symbol_market: {
                symbol: stockData.symbol.trim(),
                market: 'NGX',
              },
            },
          });
          
          const upsertedStock = await prisma.stock.upsert({
            where: {
              symbol_market: {
                symbol: stockData.symbol.trim(),
                market: 'NGX',
              },
            },
            update: {
              price: stockData.closePrice,
              change: stockData.change || 0,
              percentChange: stockData.percentChange,
              volume: stockData.volume || 0,
              value: stockData.value || 0,
              trades: stockData.trades || 0,
              source: SOURCE,
              updatedAt: new Date(),
            },
            create: {
              symbol: stockData.symbol,
              name: stockData.name || 'Unknown',
              price: stockData.closePrice,
              change: stockData.change || 0,
              percentChange: stockData.percentChange,
              volume: stockData.volume || 0,
              value: stockData.value || 0,
              trades: stockData.trades || 0,
              sector: 'Unknown', // Required field
              market: 'NGX', // Required field
              source: SOURCE,
            },
          });
          
          if (!existingStock) {
            newStocks++;
          } else {
            updatedStocks++;
          }
          
          // Create a new history record
          await prisma.stockHistory.create({
            data: {
              stockId: upsertedStock.id,
              date: normalizedDate,
              price: stockData.closePrice,
              change: stockData.change || 0,
              percentChange: stockData.percentChange,
              volume: stockData.volume || 0,
              value: stockData.value || 0,
              trades: stockData.trades || 0,
              source: SOURCE,
              sector: upsertedStock.sector, // Add the sector from the stock record
            },
          });
          
          historiesAdded++;
        } catch (error) {
          console.error(`❌ Error processing stock ${stockData.symbol}:`, error);
        }
      })
    );
  }
  
  console.log(`✅ Processed stocks: ${newStocks} new, ${updatedStocks} updated, ${historiesAdded} histories added`);
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