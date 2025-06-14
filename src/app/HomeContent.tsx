"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import MarketSelector from "@/components/market/MarketSelector";
import MarketBubbleChart from "@/components/charts/MarketBubbleChart";
import MarketSnapshot from "@/components/market/MarketSnapshot";
import TopStocks from "@/components/stock/TopStocks";
import MarketNews from "@/components/market/MarketNews";
import ResearchCorner from "@/components/market/ResearchCorner";
import { useMarket } from "@/context/MarketContext";
import { MARKET_DATA } from "@/constants/market";
import StockBubbleChart from "@/components/charts/StockBubbleChart";
import { NGX_INDICES, NGX_STOCKS } from "@/constants/ngx";
import Card from "@/components/ui/Card";

export default function HomeContent() {
  const { selectedMarket, getMarketIndices } = useMarket();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get market data for selected market
  const marketIndices = getMarketIndices();
  
  // Check if NGX is selected
  const isNGXSelected = selectedMarket === "NGX";
  
  // Sync URL with selected market
  useEffect(() => {
    // Don't update URL if we're already on the correct path
    const currentPath = pathname;
    const expectedPath = selectedMarket === "ALL" 
      ? "/" 
      : `/markets/${selectedMarket.toLowerCase()}`;
      
    if (currentPath !== expectedPath) {
      router.push(expectedPath, { scroll: false });
    }
  }, [selectedMarket, router, pathname]);

  // Rest of your component remains the same
  return (
    <main className="p-4 max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
      {/* Your existing JSX */}
    </main>
  );
}