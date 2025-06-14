export type MarketType = "NGX" | "GSE" | "JSE" | "ALL";

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number;
  sector: string;
  market: MarketType;
}

export interface MarketIndex {
  id: string;
  name: string;
  value: number;
  change: number;
  percentChange: number;
  market: MarketType;
}

export interface MarketData {
  index: MarketIndex;
  totalVolume: number;
  valueTraded: number;
  advancing: number;
  declining: number;
  marketCap: number;
  historicalData: {
    date: string;
    value: number;
  }[];
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  date: string;
  source: string;
  market: MarketType;
}