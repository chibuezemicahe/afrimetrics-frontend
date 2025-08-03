import { PrismaClient } from '../src/generated/prisma';

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

async function clearNgxDailyStockData() {
  try {
    console.log('Starting cleanup of NGX-daily stocks...');
    
    // Find all stocks with source "ngx-daily"
    const ngxDailyStocks = await prisma.stock.findMany({
      where: {
        source: "ngx-daily"
      },
      select: {
        id: true,
        symbol: true
      }
    });
    
    console.log(`Found ${ngxDailyStocks.length} stocks with source "ngx-daily"`);
    
    // Get the IDs of these stocks
    const stockIds = ngxDailyStocks.map(stock => stock.id);
    
    // Delete all StockHistory records for these stocks first (because of the foreign key constraint)
    console.log('Deleting StockHistory records for NGX-daily stocks...');
    const deletedHistories = await prisma.stockHistory.deleteMany({
      where: {
        stockId: {
          in: stockIds
        }
      }
    });
    console.log(`✅ Successfully deleted ${deletedHistories.count} StockHistory records`);
    
    // Then delete the Stock records
    console.log('Deleting NGX-daily Stock records...');
    const deletedStocks = await prisma.stock.deleteMany({
      where: {
        source: "ngx-daily"
      }
    });
    console.log(`✅ Successfully deleted ${deletedStocks.count} Stock records`);
    
    console.log('NGX-daily stocks cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
clearNgxDailyStockData();