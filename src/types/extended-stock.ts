import { MarketType } from "./stock";

export interface StockData {
  id?: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  percentChange?: number;
  volume: number;
  value: number;
  trades: number;
  sector: string;
  market: string;
  logo?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}