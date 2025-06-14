import { Metadata } from 'next';
import { MARKETS, MARKET_DATA } from '@/constants/market';
import HomePage from '@/app/page';
import { MarketType } from '@/types/stock';

// Generate static paths for all markets
export async function generateStaticParams() {
  return MARKETS.map((market) => ({
    marketId: market.id.toLowerCase(),
  }));
}

// Generate metadata for each market page
export async function generateMetadata({ params }: { params: { marketId: string } }): Promise<Metadata> {
  const marketId = params.marketId.toUpperCase();
  const market = MARKETS.find(m => m.id === marketId);
  
  if (!market) {
    return {
      title: 'Market Not Found | Afrimetrics',
      description: 'The requested market could not be found.',
    };
  }
  
  return {
    title: `${market.name} Market Overview | Afrimetrics`,
    description: `Track and analyze ${market.name} stock market in real-time with visual analytics and performance data.`,
    // Add more metadata as needed
  };
}

// Reuse the HomePage component but pass the marketId as a prop
export default function MarketPage({ params }: { params: { marketId: string } }) {
    const upperMarketId = params.marketId.toUpperCase();
    // Validate that it's a valid MarketType
    const isValidMarket = ["NGX", "GSE", "JSE", "ALL"].includes(upperMarketId);
    const marketId = isValidMarket ? upperMarketId as MarketType : "ALL";
    
    return <HomePage initialMarket={marketId} />;
  }[{
	"resource": "/Users/mac/Desktop/My-Projects/afrimetrics-frontend/src/app/page.tsx",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type 'string' is not assignable to parameter of type 'TimeFilter'.",
	"source": "ts",
	"startLineNumber": 253,
	"startColumn": 50,
	"endLineNumber": 253,
	"endColumn": 52,
	"extensionID": "vscode.typescript-language-features"
}]