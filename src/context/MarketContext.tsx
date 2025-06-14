"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { MarketData, MarketIndex, MarketNews, MarketType, Stock } from "../types/stock";
import { MARKET_DATA, MARKET_INDICES, MARKET_NEWS, TOP_STOCKS } from "../constants/market";


// To this
export type TimeFilter = "day" | "week" | "month" | "year";
type StockFilter = "gainers" | "losers" | "active" | "weekly" | "monthly";

interface MarketContextType {
  selectedMarket: MarketType;
  setSelectedMarket: (market: MarketType) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  getMarketData: (market: MarketType) => MarketData | undefined;
  getMarketIndices: () => MarketIndex[];
  getTopStocks: (filter: StockFilter, market: MarketType) => Stock[];
  getMarketNews: (market: MarketType) => MarketNews[];
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children, initialMarket = "ALL" }: { children: ReactNode, initialMarket?: MarketType }) {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>(initialMarket as MarketType);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("day");
  const [stockFilter, setStockFilter] = useState<StockFilter>("gainers");

  const getMarketData = (market: MarketType) => {
    if (market === "ALL") return undefined;
    return MARKET_DATA[market];
  };

  const getMarketIndices = () => {
    return MARKET_INDICES;
  };

  const getTopStocks = (filter: StockFilter, market: MarketType) => {
    let filteredStocks = TOP_STOCKS;
    
    // Filter by market if not ALL
    if (market !== "ALL") {
      filteredStocks = filteredStocks.filter(stock => stock.market === market);
    }
    
    // Apply filter
    switch (filter) {
      case "gainers":
        return filteredStocks.sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
      case "losers":
        return filteredStocks.sort((a, b) => a.percentChange - b.percentChange).slice(0, 5);
      case "active":
        return filteredStocks.sort((a, b) => b.volume - a.volume).slice(0, 5);
      case "weekly":
      case "monthly":
        // In a real app, this would use actual weekly/monthly data
        return filteredStocks.sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
      default:
        return filteredStocks.slice(0, 5);
    }
  };

  const getMarketNews = (market: MarketType) => {
    if (market === "ALL") return MARKET_NEWS;
    return MARKET_NEWS.filter(news => news.market === market);
  };

  return (
    <MarketContext.Provider
      value={{
        selectedMarket,
        setSelectedMarket,
        timeFilter,
        setTimeFilter,
        stockFilter,
        setStockFilter,
        getMarketData,
        getMarketIndices,
        getTopStocks,
        getMarketNews,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}