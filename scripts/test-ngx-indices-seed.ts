import axios from 'axios';

async function testNgxIndicesSeedEndpoint() {
  try {
    console.log('Testing NGX indices seed endpoint...');
    
    // Get the base URL from environment or use localhost
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/seed/ngx-indices`;
    
    console.log(`Making POST request to: ${endpoint}`);
    
    const response = await axios.post(endpoint);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error testing NGX indices seed endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

testNgxIndicesSeedEndpoint();