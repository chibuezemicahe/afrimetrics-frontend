import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockData } from "@/types/extended-stock";

type PerformanceFilter = 'gainers' | 'losers' | 'active' | 'traded' | 'unchanged';
type TimeframeFilter = 'hour' | 'day' | 'week' | 'month' | 'ytd' | 'yoy';

// Define extended stock type with size property
type StockWithSize = StockData & { size: number };

interface CustomBubbleChartProps {
  width?: number;
  height?: number;
  timeframe?: string;
  metric?: string;
}

const CustomBubbleChart: React.FC<CustomBubbleChartProps> = ({
  height = 500,
  timeframe = 'day',
  metric = 'value'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceFilter>('gainers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('day');
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data based on selected performance filter
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let endpoint = '/api/stocks/ngx';
        
        switch (selectedPerformance) {
          case 'gainers':
            endpoint = '/api/stocks/ngx/top-gainers?limit=100';
            break;
          case 'losers':
            endpoint = '/api/stocks/ngx/top-losers?limit=100';
            break;
          case 'active':
            endpoint = '/api/stocks/ngx/most-active?limit=100';
            break;
          case 'traded':
            endpoint = '/api/stocks/ngx?sortBy=value&order=desc&limit=100';
            break;
          case 'unchanged':
            endpoint = '/api/stocks/ngx?limit=100';
            break;
          default:
            endpoint = '/api/stocks/ngx?limit=100';
        }
        
        console.log('Fetching from endpoint:', endpoint); // Debug log
        const response = await fetch(endpoint);
        const result = await response.json();
        
        console.log('API Response:', result); // Debug log
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (result.success) {
          setData(result.data || []);
          console.log('Data set:', result.data?.length || 0, 'stocks'); // Debug log
        } else {
          setError(result.error || 'Failed to fetch stock data');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching stock data';
        setError(errorMessage);
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPerformance]);
  
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1 1v5a1 1 0 01-1 1H5a1 1 0 01-1 1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
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
        {/* Performance Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'gainers' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('gainers')}
          >
            Top Gainers
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'losers' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('losers')}
          >
            Top Losers
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPerformance === 'active' ? 'bg-[#1e293b] text-white font-medium' : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-400'}`}
            onClick={() => setSelectedPerformance('active')}
          >
            Most Active
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
        </div>
      </div>
      
      {/* Heatmap Grid Container */}
      <div className="relative w-full bg-[#0f172a] rounded-lg p-5" style={{ minHeight: `${height}px` }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ade80]"></div>
              <p className="text-white mt-4">Loading {getPerformanceLabel()}...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 text-lg font-medium mb-2">Error Loading Data</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#4ade80] text-black rounded-lg hover:bg-[#22c55e] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium mb-2">No Data Available</p>
              <p className="text-gray-500 text-sm">No {getPerformanceLabel().toLowerCase()} found for the selected criteria.</p>
            </div>
          </div>
        ) : (
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
                        height: `${stock.size * 0.75}px`,
                        backgroundColor,
                        border: `2px solid ${borderColor}`,
                      }}
                      className="relative flex flex-col items-center justify-center rounded-lg overflow-hidden cursor-pointer"
                      onMouseEnter={() => setHoveredStock(stock.id || '')}
                      onMouseLeave={() => setHoveredStock(null)}
                    >
                      {/* ... existing stock tile content ... */}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomBubbleChart;