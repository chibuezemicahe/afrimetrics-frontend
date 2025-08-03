import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockData } from "@/types/extended-stock";

type PerformanceFilter = 'gainers' | 'losers' | 'active' | 'traded' | 'unchanged';
type TimeframeFilter = 'hour' | 'day' | 'week' | 'month' | 'ytd' | 'yoy';

// Define extended stock type with size property
type StockWithSize = StockData & { size: number };

interface CustomBubbleChartProps {
  data: StockData[];
  width?: number;
  height?: number;
  timeframe?: string;
  metric?: string;
}

const CustomBubbleChart: React.FC<CustomBubbleChartProps> = ({
  data,
  height = 500,
  timeframe = 'day',
  metric = 'value'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceFilter>('gainers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('day');
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  
  // Filter and sort data based on the selected filters
  const getFilteredData = (): StockData[] => {
    let filteredData = [...data];
    
    // Apply performance filter
    switch (selectedPerformance) {
      case 'gainers':
        return filteredData.sort((a, b) => (b.percentChange || 0) - (a.percentChange || 0));
      case 'losers':
        return filteredData.sort((a, b) => (a.percentChange || 0) - (b.percentChange || 0));
      case 'active':
        return filteredData.sort((a, b) => b.trades - a.trades);
      case 'traded':
        return filteredData.sort((a, b) => b.value - a.value);
      case 'unchanged':
        return filteredData.sort((a, b) => Math.abs(a.percentChange || 0) - Math.abs(b.percentChange || 0));
      default:
        return filteredData;
    }
  };

  // Get color based on percent change
  const getColor = (percentChange: number): string => {
    if (percentChange > 0) {
      // Green shades for positive changes
      const intensity = Math.min(Math.abs(percentChange) / 10, 1);
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`; // Green with varying opacity
    }
    if (percentChange < 0) {
      // Red shades for negative changes
      const intensity = Math.min(Math.abs(percentChange) / 10, 1);
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // Red with varying opacity
    }
    return 'rgba(156, 163, 175, 0.5)'; // Gray for unchanged
  };

  // Get border color for better contrast
  const getBorderColor = (percentChange: number): string => {
    if (percentChange > 0) return '#22c55e';
    if (percentChange < 0) return '#ef4444';
    return '#9ca3af';
  };

  // Calculate tile size based on value (similar to market cap in Finviz)
  const getTileSize = (stock: StockData, maxValue: number, minValue: number): number => {
    const normalizedValue = (stock.value - minValue) / (maxValue - minValue);
    const minSize = 80;
    const maxSize = 200;
    return minSize + (normalizedValue * (maxSize - minSize));
  };

  // Format display value based on the metric
  const getDisplayValue = (stock: StockData): string => {
    switch (selectedPerformance) {
      case 'gainers':
      case 'losers':
        return `${(stock.percentChange || 0) > 0 ? '+' : ''}${(stock.percentChange || 0).toFixed(2)}%`;
      case 'active':
        return stock.trades.toLocaleString();
      case 'traded':
        return (stock.value / 1000000).toFixed(1) + 'M';
      case 'unchanged':
        return (stock.percentChange || 0).toFixed(2) + '%';
      default:
        return stock.price.toLocaleString();
    }
  };

  // Get the label for the performance filter
  const getPerformanceLabel = (): string => {
    switch (selectedPerformance) {
      case 'gainers': return 'Top Gainers';
      case 'losers': return 'Top Losers';
      case 'active': return 'Most Active';
      case 'traded': return 'Most Traded';
      case 'unchanged': return 'Unchanged';
      default: return '';
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [height]);

  // Calculate grid layout
  const calculateGridLayout = (filteredData: StockData[]): StockWithSize[][] => {
    if (dimensions.width === 0) return [];
    
    const maxValue = Math.max(...filteredData.map(stock => stock.value));
    const minValue = Math.min(...filteredData.map(stock => stock.value));
    
    const tiles: StockWithSize[] = filteredData.map(stock => ({
      ...stock,
      size: getTileSize(stock, maxValue, minValue)
    }));
    
    // Simple grid packing algorithm
    const rows: StockWithSize[][] = [];
    let currentRow: StockWithSize[] = [];
    let currentRowWidth = 0;
    const padding = 4;
    const availableWidth = dimensions.width - 40; // Account for container padding
    
    tiles.forEach(tile => {
      if (currentRowWidth + tile.size + padding > availableWidth && currentRow.length > 0) {
        rows.push([...currentRow]);
        currentRow = [tile];
        currentRowWidth = tile.size;
      } else {
        currentRow.push(tile);
        currentRowWidth += tile.size + padding;
      }
    });
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows;
  };

  const filteredData = getFilteredData();
  const gridRows = calculateGridLayout(filteredData);

  return (
    <div className="w-full h-full" ref={containerRef}>
      {/* Header with title and search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">STOCK HEATMAP</h2>
        </div>
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search Security..." 
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4ade80]"
          />
        </div>
        <button className="px-3 py-1.5 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm">
          ALL SECTORS
        </button>
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
        {/* Timeframe Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'hour' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('hour')}
          >
            Hour
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'day' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('day')}
          >
            Day
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'week' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'month' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'yoy' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('yoy')}
          >
            YoY
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTimeframe === 'ytd' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedTimeframe('ytd')}
          >
            YTD
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'active' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('active')}
          >
            Top Active
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'traded' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('traded')}
          >
            Most Traded
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'unchanged' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('unchanged')}
          >
            Unchanged
          </button>
        </div>
      </div>
      
      {/* Heatmap Grid Container */}
      <div className="relative w-full bg-[#0f172a] rounded-lg p-5" style={{ minHeight: `${height}px` }}>
        <div className="space-y-1">
          {gridRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-1">
              {row.map((stock) => {
                const isHovered = hoveredStock === stock.id;
                const backgroundColor = getColor(stock.percentChange || 0);
                const borderColor = getBorderColor(stock.percentChange || 0);
                
                return (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        type: 'spring',
                        damping: 15,
                        stiffness: 200,
                        delay: rowIndex * 0.05
                      }
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      zIndex: 10,
                      transition: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    style={{ 
                      width: `${stock.size}px`,
                      height: `${stock.size * 0.75}px`, // Rectangular aspect ratio
                      backgroundColor,
                      border: `2px solid ${borderColor}`,
                    }}
                    className="relative flex flex-col items-center justify-center rounded-lg overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoveredStock(stock.id || '')}
                    onMouseLeave={() => setHoveredStock(null)}
                  >
                    {/* Logo or Symbol */}
                    <div className="flex flex-col items-center justify-center h-full p-2">
                      {stock.logo ? (
                        <img 
                          src={stock.logo} 
                          alt={stock.symbol} 
                          className="w-6 h-6 object-contain mb-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center mb-1">
                          <span className="text-white font-bold text-xs">{stock.symbol.substring(0, 2)}</span>
                        </div>
                      )}
                      
                      {/* Symbol */}
                      <span className="text-white font-bold text-xs text-center leading-tight">{stock.symbol}</span>
                      
                      {/* Performance Value */}
                      <span className="text-white text-xs font-medium">{getDisplayValue(stock)}</span>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div 
                          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white p-3 rounded-lg shadow-lg z-20 w-64 mb-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
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
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                <span className="text-xs font-bold text-gray-600">{stock.symbol.substring(0, 2)}</span>
                              </div>
                            )}
                            <p className="font-medium">{stock.name}</p>
                          </div>
                          <p className="text-sm text-gray-600">{stock.symbol}</p>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="flex justify-between">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-medium">{stock.price.toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-600">Change:</span>
                              <span className={stock.percentChange && stock.percentChange > 0 ? "text-green-600" : "text-red-600"}>
                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange && stock.percentChange > 0 ? '+' : ''}{(stock.percentChange || 0).toFixed(2)}%)
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-600">Volume:</span>
                              <span className="font-medium">{stock.volume.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-600">Value:</span>
                              <span className="font-medium">{(stock.value / 1000000).toFixed(1)}M</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-600">Trades:</span>
                              <span className="font-medium">{stock.trades}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-600">Sector:</span>
                              <span className="font-medium">{stock.sector}</span>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomBubbleChart;