"use client";

import { useState } from "react";
import { useMarket } from "@/context/MarketContext";
import { Stock } from "@/types/stock";
import Card from "../ui/Card";

type StockFilterTab = "gainers" | "weekly" | "monthly";

export default function StockList() {
  const { selectedMarket, getTopStocks } = useMarket();
  const [activeTab, setActiveTab] = useState<StockFilterTab>("gainers");

  const stocks = getTopStocks(activeTab, selectedMarket);

  return (
    <Card className="mb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Top Performing Stocks</h3>
        <div className="flex space-x-2 border-b">
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === "gainers" ? "text-[#007B3B] border-b-2 border-[#007B3B]" : "text-gray-500"}`}
            onClick={() => setActiveTab("gainers")}
          >
            Today
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === "weekly" ? "text-[#007B3B] border-b-2 border-[#007B3B]" : "text-gray-500"}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === "monthly" ? "text-[#007B3B] border-b-2 border-[#007B3B]" : "text-gray-500"}`}
            onClick={() => setActiveTab("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {stocks.map((stock) => (
          <StockCard key={stock.id} stock={stock} />
        ))}
      </div>
    </Card>
  );
}

function StockCard({ stock }: { stock: Stock }) {
  const { symbol, name, price, percentChange, volume, sector, market } = stock;
  
  // Determine color based on performance
  const changeColor = percentChange > 0 ? "text-[#FFA500]" : "text-[#D7263D]";

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className="font-medium">{symbol}</span>
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">{market}</span>
          </div>
          <p className="text-sm text-gray-600">{name}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{price.toFixed(2)}</p>
          <p className={`text-sm ${changeColor}`}>
            {percentChange > 0 ? "+" : ""}{percentChange.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Vol: {volume.toLocaleString()}</span>
        <span>{sector}</span>
      </div>
    </div>
  );
}