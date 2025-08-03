import axios from 'axios';
import { PrismaClient, Stock } from '../src/generated/prisma';

async function testNgxSeedEndpoint() {
  try {
    console.log('Testing NGX seed endpoint...');
    
    // Get the base URL from environment or use localhost
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
    // With this line to call your local API endpoint
    const endpoint = `${baseUrl}/api/seed/ngx-daily`;
    
    console.log(`Making POST request to: ${endpoint}`);
    
    const response = await axios.post(endpoint);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Create a new Prisma client instance
    const prisma = new PrismaClient();

    console.log('Checking database for recently updated stocks...');
    const recentStocks = await prisma.stock.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      take: 5
    });

    console.log(`Found ${recentStocks.length} recently updated stocks:`);
    recentStocks.forEach((stock: Stock) => {
      console.log(`- ${stock.symbol}: ${stock.price} (updated at ${stock.updatedAt})`);
    });
    
    // Close the Prisma client connection
    await prisma.$disconnect();
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error testing NGX seed endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

// Execute the function
testNgxSeedEndpoint()
  .then(() => console.log('Test completed successfully'))
  .catch(() => console.log('Test failed'));