import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '../src/generated/prisma';

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Date range for scraping (2020-01-06 to 2022-08-31)
const startDate = new Date('2020-01-06');
const endDate = new Date('2022-08-31');

// Statistics tracking
let newStocks = 0;
let updatedStocks = 0;
let historiesAdded = 0;
let failedDates: string[] = [];

// Source identifier
const SOURCE = 'apt-securities';

// Main function
async function main() {
  console.log(`🚀 Starting APT Securities historical data scraper (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`); 
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
    
    // Format date for URL: YYYY-MM-DD
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      // Scrape data for the current date
      console.log(`📅 Processing date: ${dateStr}`);
      const stocksData = await scrapeAptSecurities(dateStr);
      
      if (stocksData.length === 0) {
        console.log(`⚠️ No data found for ${dateStr} (possibly a holiday or no trading day)`);
      } else {
        console.log(`✅ Found ${stocksData.length} stocks for ${dateStr}`);
        
        // Process the scraped data
        if (!isDryRun) {
          await processStocksData(stocksData, currentDate);
        } else {
          console.log(`🔍 [DRY RUN] Would process ${stocksData.length} stocks for ${dateStr}`);
        }
      }
    } catch (error) {
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

// Function to scrape APT Securities data for a specific date
async function scrapeAptSecurities(dateStr: string) {
  const url = `https://www.aptsecurities.com/nse-daily-price.php?date=${dateStr}`;
  
  try {
    console.log(`🌐 Fetching ${url}`);
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse HTML using cheerio
    const $ = cheerio.load(html);
    
    // Extract stock data from the table
    const stocksData: any[] = [];
    
    // Find the table with stock data
    $('table.table-bordered tbody tr').each((index, element) => {
      const columns = $(element).find('td');
      const symbol = $(element).find('th').text().trim();
      
      // Skip if no symbol or not enough columns
      if (!symbol || columns.length < 8) return;
      
      // Parse data from columns
      // Parse data from columns
      const openPrice = parseFloat($(columns[0]).text().trim()) || 0;
      const closePrice = parseFloat($(columns[1]).text().trim()) || 0;
      const highPrice = parseFloat($(columns[2]).text().trim()) || 0;
      const lowPrice = parseFloat($(columns[3]).text().trim()) || 0;
      
      // The "Change" column might not be the price change but some other value
      // For now, calculate change as the difference between close and open
      const rawChange = parseFloat($(columns[4]).text().trim().replace(/,/g, '')) || 0;
      const change = closePrice - openPrice; // Use this instead of the raw change value
      
      const trades = parseInt($(columns[5]).text().trim().replace(/,/g, '')) || 0;
      const volume = parseInt($(columns[6]).text().trim().replace(/,/g, '')) || 0;
      const value = parseFloat($(columns[7]).text().trim().replace(/,/g, '')) || 0;
      
      // Calculate percentChange based on open and close prices
      // If openPrice is 0, set percentChange to 0 to avoid division by zero
      const percentChange = openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0;
      
      stocksData.push({
        symbol,
        name: symbol, // Use symbol as name if actual name is not available
        closePrice,
        change,
        percentChange,
        volume,
        value,
        trades,
      });
    });
    
    if (stocksData.length === 0) {
      console.log('No stock data found in the table');
    } else {
      console.log(`Found ${stocksData.length} stocks in the table`);
    }
    
    return stocksData;
  } catch (error) {
    console.error(`Error fetching data from APT Securities for ${dateStr}:`, error);
    return [];
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
