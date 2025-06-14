import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { StockData } from "@/types/extended-stock";

// Remove the local StockData interface

type PerformanceFilter = 'gainers' | 'losers' | 'active' | 'traded' | 'unchanged';
type TimeframeFilter = 'hour' | 'day' | 'week' | 'month' | 'ytd' | 'yoy';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceFilter>('gainers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('day');
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [simulationNodes, setSimulationNodes] = useState<d3.SimulationNodeDatum[]>([]);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  
  // Filter and sort data based on the selected filters
  const getFilteredData = () => {
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
  const getColor = (percentChange: number) => {
    if (percentChange > 0) return '#4caf50';
    if (percentChange < 0) return '#f44336';
    return '#2196f3'; // Blue for unchanged
  };

  // Get bubble size based on metric
  const getBubbleSize = (stock: StockData) => {
    switch (selectedPerformance) {
      case 'gainers':
      case 'losers':
        return Math.abs(stock.percentChange || 0) * 2 + 30;
      case 'active':
        return Math.sqrt(stock.trades) * 1.5 + 20;
      case 'traded':
        return Math.sqrt(stock.value) / 5000 + 20;
      case 'unchanged':
        return 40;
      default:
        return 40;
    }
  };

  // Format display value based on the metric
  const getDisplayValue = (stock: StockData) => {
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
  const getPerformanceLabel = () => {
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

  // Create and update the bubble chart
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const filteredData = getFilteredData();
    
    // Create force simulation
    const simulation = d3.forceSimulation(filteredData as d3.SimulationNodeDatum[])
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('charge', d3.forceManyBody().strength(5))
      .force('collide', d3.forceCollide().radius((d: any) => getBubbleSize(d) + 5).iterations(2))
      .on('tick', ticked)
      .on('end', () => {
        // When simulation ends, update state with final node positions
        setSimulationNodes([...simulation.nodes()]);
      });

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
      .style('z-index', '10');

    function ticked() {
      // Update nodes during simulation
      setSimulationNodes([...simulation.nodes()]);
    }

    return () => {
      simulation.stop();
    };
  }, [dimensions, selectedPerformance, selectedTimeframe, data]);

  return (
    <div className="w-full h-full" ref={containerRef}>
      {/* Header with title and search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">STOCK BUBBLES</h2>
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
      
      {/* Chart Container */}
      <div className="relative w-full bg-[#0f172a] rounded-lg" style={{ height: `${height}px` }}>
        <svg ref={svgRef} width="100%" height="100%" className="absolute" />
        
        {/* Render bubbles with Framer Motion */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {simulationNodes.map((node: any) => {
              const stock = node as StockData;
              const bubbleSize = getBubbleSize(stock);
              const color = getColor(stock.percentChange || 0);
              const isHovered = hoveredStock === stock.id;
              
              return (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: (stock.x ?? 0) - bubbleSize, 
                    y: (stock.y ?? 0) - bubbleSize,
                    transition: { 
                      type: 'spring',
                      damping: 15,
                      stiffness: 200
                    }
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  style={{ 
                    position: 'absolute',
                    width: bubbleSize * 2,
                    height: bubbleSize * 2,
                  }}
                  onMouseEnter={() => setHoveredStock(stock.id || '')}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <motion.div 
                    className="relative w-full h-full flex flex-col items-center justify-center rounded-full overflow-hidden"
                    whileHover={{ 
                      scale: 1.1,
                      boxShadow: `0 0 15px ${color}`,
                      transition: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    style={{ 
                      backgroundColor: `${color}80`, // Semi-transparent
                      border: `2px solid ${color}`
                    }}
                  >
                    {/* Logo or Symbol */}
                    {stock.logo ? (
                      <img 
                        src={stock.logo} 
                        alt={stock.symbol} 
                        className="w-1/2 h-1/2 object-contain mb-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const span = document.createElement('span');
                            span.className = 'text-white font-bold text-xs';
                            span.textContent = stock.symbol.substring(0, 3);
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">{stock.symbol.substring(0, 3)}</span>
                    )}
                    
                    {/* Symbol and Change */}
                    <span className="text-white font-bold text-xs">{stock.symbol}</span>
                    <span className="text-white text-xs">{getDisplayValue(stock)}</span>
                    
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <motion.div 
                        className="absolute top-0 left-0 transform -translate-y-full -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg z-10 w-48"
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
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        <div ref={tooltipRef} className="tooltip" />
      </div>
    </div>
  );
};

export default CustomBubbleChart;