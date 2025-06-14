"use client";

import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Card from "../ui/Card";

// Define the stock data structure
interface StockData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number;
  value: number;
  trades: number;
  sector: string;
  market: string;
  logo?: string;
}

type TimeframeFilter = "day" | "week" | "month" | "ytd" | "yoy";
type MetricFilter = "gainers" | "losers" | "active" | "traded";

interface StockBubbleChartProps {
  stocks: StockData[];
}

export default function StockBubbleChart({ stocks }: StockBubbleChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("day");
  const [metric, setMetric] = useState<MetricFilter>("gainers");

  // Filter and sort stocks based on selected filters
  const getFilteredStocks = () => {
    let filteredStocks = [...stocks];
    
    // Apply metric filter
    switch (metric) {
      case "gainers":
        return filteredStocks.sort((a, b) => b.percentChange - a.percentChange);
      case "losers":
        return filteredStocks.sort((a, b) => a.percentChange - b.percentChange);
      case "active":
        return filteredStocks.sort((a, b) => b.trades - a.trades);
      case "traded":
        return filteredStocks.sort((a, b) => b.value - a.value);
      default:
        return filteredStocks;
    }
  };

  // Get the display value based on the selected metric
  const getDisplayValue = (stock: StockData) => {
    switch (metric) {
      case "gainers":
      case "losers":
        return stock.percentChange;
      case "active":
        return stock.trades;
      case "traded":
        return stock.value;
      default:
        return stock.percentChange;
    }
  };

  // Get color based on percent change
  const getColor = (percentChange: number) => {
    if (percentChange > 0) return "var(--gain)";
    if (percentChange < 0) return "var(--loss)";
    return "var(--highlight)";
  };

  // Format the display value based on the metric
  const formatDisplayValue = (value: number, metricType: MetricFilter) => {
    switch (metricType) {
      case "gainers":
      case "losers":
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
      case "active":
        return value.toLocaleString();
      case "traded":
        return `₦${(value / 1000000).toFixed(1)}M`;
      default:
        return value.toString();
    }
  };

  // Get the label for the metric
  const getMetricLabel = () => {
    switch (metric) {
      case "gainers":
        return "Top Gainers";
      case "losers":
        return "Top Losers";
      case "active":
        return "Most Active";
      case "traded":
        return "Most Traded";
      default:
        return "";
    }
  };

  // Custom tooltip for the bubble chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const stock = payload[0].payload;
      return (
        <div className="bg-[var(--card-bg)] p-3 border border-[var(--card-border)] rounded-lg shadow-lg">
          <div className="flex items-center mb-2">
            {stock.logo ? (
              <img 
                src={stock.logo} 
                alt={stock.name} 
                className="w-6 h-6 rounded-full mr-2"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder-logo.svg";
                }}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--primary)] bg-opacity-20 flex items-center justify-center mr-2">
                <span className="text-xs font-bold text-[var(--primary)]">{stock.symbol.substring(0, 2)}</span>
              </div>
            )}
            <p className="font-medium">{stock.name}</p>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{stock.symbol}</p>
          <div className="mt-2 pt-2 border-t border-[var(--card-border)]">
            <p className="flex justify-between">
              <span className="text-[var(--text-muted)]">Price:</span>
              <span className="font-medium">₦{stock.price.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--text-muted)]">Change:</span>
              <span className={stock.percentChange > 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}>  
                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange > 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%)
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--text-muted)]">Volume:</span>
              <span className="font-medium">{stock.volume.toLocaleString()}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--text-muted)]">Value:</span>
              <span className="font-medium">₦{(stock.value / 1000000).toFixed(1)}M</span>
            </p>
            <p className="flex justify-between">
              <span className="text-[var(--text-muted)]">Trades:</span>
              <span className="font-medium">{stock.trades}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredStocks = getFilteredStocks();

  return (
    <Card className="mb-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[var(--text-secondary)]">{getMetricLabel()}</h3>
          <div className="flex space-x-2">
            {/* Timeframe filters */}
            <div className="flex space-x-1 text-xs bg-[var(--card-bg)] rounded-lg p-1">
              <button 
                className={`px-2 py-1 rounded-md transition-all ${timeframe === 'day' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
                onClick={() => setTimeframe('day')}
              >
                Day
              </button>
              <button 
                className={`px-2 py-1 rounded-md transition-all ${timeframe === 'week' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
                onClick={() => setTimeframe('week')}
              >
                Week
              </button>
              <button 
                className={`px-2 py-1 rounded-md transition-all ${timeframe === 'month' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
                onClick={() => setTimeframe('month')}
              >
                Month
              </button>
              <button 
                className={`px-2 py-1 rounded-md transition-all ${timeframe === 'ytd' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
                onClick={() => setTimeframe('ytd')}
              >
                YTD
              </button>
              <button 
                className={`px-2 py-1 rounded-md transition-all ${timeframe === 'yoy' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
                onClick={() => setTimeframe('yoy')}
              >
                YoY
              </button>
            </div>
          </div>
        </div>
        
        {/* Metric filters */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${metric === 'gainers' ? 'bg-[var(--gain)] bg-opacity-20 text-[var(--gain)] font-medium' : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
            onClick={() => setMetric('gainers')}
          >
            Top Gainers
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${metric === 'losers' ? 'bg-[var(--loss)] bg-opacity-20 text-[var(--loss)] font-medium' : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
            onClick={() => setMetric('losers')}
          >
            Top Losers
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${metric === 'active' ? 'bg-[var(--highlight)] bg-opacity-20 text-[var(--highlight)] font-medium' : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
            onClick={() => setMetric('active')}
          >
            Most Active
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${metric === 'traded' ? 'bg-[var(--primary)] bg-opacity-20 text-[var(--primary)] font-medium' : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}
            onClick={() => setMetric('traded')}
          >
            Most Traded
          </button>
        </div>
      </div>
      
      {/* Bubble Chart */}
      <div className="h-[400px] overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis type="number" dataKey="index" name="index" hide />
            <YAxis type="number" dataKey="value" name="value" hide />
            <ZAxis type="number" dataKey="size" range={[50, 400]} name="size" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Stocks"
              data={filteredStocks.map((stock, index) => ({
                ...stock,
                index: index + 1,
                value: getDisplayValue(stock),
                size: metric === 'traded' ? Math.sqrt(stock.value) / 100 : 
                       metric === 'active' ? Math.sqrt(stock.trades) * 2 : 
                       Math.abs(stock.percentChange) * 10 + 50
              }))}
            >
              {filteredStocks.map((stock, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(stock.percentChange)}
                  fillOpacity={0.7}
                  stroke={getColor(stock.percentChange)}
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stock Bubbles Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 overflow-x-auto">
        {filteredStocks.slice(0, 10).map((stock, index) => (
          <div 
            key={stock.id} 
            className="flex items-center p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] transition-all"
          >
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-2" 
                style={{ backgroundColor: `${getColor(stock.percentChange)}20` }}
              >
                {stock.logo ? (
                  <img 
                    src={stock.logo} 
                    alt={stock.name} 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder-logo.svg";
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold" style={{ color: getColor(stock.percentChange) }}>
                    {stock.symbol.substring(0, 2)}
                  </span>
                )}
              </div>
              <div 
                className="absolute -top-1 -right-1 rounded-full px-1.5 text-xs font-medium" 
                style={{ 
                  backgroundColor: getColor(stock.percentChange),
                  color: 'white'
                }}
              >
                {formatDisplayValue(getDisplayValue(stock), metric)}
              </div>
            </div>
            <div className="ml-1 min-w-0">
              <p className="text-xs font-medium truncate">{stock.symbol}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{stock.name}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}