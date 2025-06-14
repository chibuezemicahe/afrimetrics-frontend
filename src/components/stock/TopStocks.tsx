"use client";

import { useState } from "react";
import { useMarket } from "@/context/MarketContext";
import { Stock } from "@/types/stock";

type StockFilter = "gainers" | "losers" | "active" | "weekly" | "monthly";

export default function TopStocks() {
  const { selectedMarket, getTopStocks } = useMarket();
  const [activeFilter, setActiveFilter] = useState<StockFilter>("gainers");

  // Get stocks based on the active filter
  const stocks = getTopStocks(activeFilter, selectedMarket);

  // Function to determine text color based on percent change
  const getChangeColor = (percentChange: number) => {
    if (percentChange > 0) return "text-[var(--gain)]";
    if (percentChange < 0) return "text-[var(--loss)]";
    return "text-[var(--highlight)]";
  };

  // Function to get appropriate icon based on filter
  const getFilterIcon = (filter: StockFilter) => {
    switch (filter) {
      case "gainers":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "losers":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case "active":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl shadow-lg overflow-hidden border border-[var(--card-border)]">
      {/* Filter tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-[var(--card-border)]">
        {[
          { id: "gainers", label: "Top Gainers" },
          { id: "weekly", label: "Weekly Top" },
          { id: "monthly", label: "Monthly Movers" },
          { id: "losers", label: "Top Losers" },
          { id: "active", label: "Most Active" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as StockFilter)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center tab-transition ${activeFilter === filter.id 
              ? "border-b-2 border-[var(--primary)] bg-[var(--primary)] bg-opacity-5" 
              : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"}`}
          >
            <span className={`mr-1.5 ${activeFilter === filter.id ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
              {getFilterIcon(filter.id as StockFilter)}
            </span>
            <span className={activeFilter === filter.id ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}>
              {filter.label}
            </span>
          </button>
        ))}
      </div>

      {/* Stocks list */}
      <div className="divide-y divide-[var(--card-border)]">
        {stocks.length > 0 ? (
          stocks.map((stock) => (
            <div key={stock.id} className="p-4 hover:bg-[var(--hover-bg)] transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${stock.percentChange > 0 ? "bg-[var(--gain)] bg-opacity-10" : stock.percentChange < 0 ? "bg-[var(--loss)] bg-opacity-10" : "bg-[var(--highlight)] bg-opacity-10"}`}>
                      {stock.percentChange > 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--gain)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : stock.percentChange < 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--loss)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--highlight)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-[var(--text-secondary)]">{stock.symbol}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-[var(--text-muted)]">{stock.market}</span>
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">{stock.name}</div>
                  <div className="text-xs mt-1 px-2 py-0.5 bg-[var(--primary)] bg-opacity-10 rounded-full inline-block text-[var(--primary)]">{stock.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-[var(--text-secondary)]">{stock.price.toLocaleString()}</div>
                  <div className={`text-sm ${getChangeColor(stock.percentChange)} font-medium px-2 py-0.5 rounded-lg ${stock.percentChange > 0 ? "bg-[var(--gain)] bg-opacity-10" : stock.percentChange < 0 ? "bg-[var(--loss)] bg-opacity-10" : "bg-[var(--highlight)] bg-opacity-10"}`}>
                    {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center justify-end">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Vol: {stock.volume.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[var(--text-muted)] font-medium">No stocks found</p>
          </div>
        )}
      </div>
    </div>
  );
}