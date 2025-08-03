"use client";

import { MarketProvider } from "@/context/MarketContext";
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
import CustomBubbleChart from '../components/charts/CustomBubbleChart';
import { MarketType } from "@/types/stock";
import { TimeFilter } from "../context/MarketContext";
// Remove the import of COMPLETE_NGX_STOCKS
// import { COMPLETE_NGX_STOCKS } from "../constants/ngx-extended";

function HomeContent() {
  const { selectedMarket, getMarketIndices, timeFilter, setTimeFilter, stockFilter } = useMarket();
  
  // Get market data for selected market
  const marketIndices = getMarketIndices();
  
  // Check if NGX is selected
  const isNGXSelected = selectedMarket === "NGX";
  
  return (
    <main className="p-4 max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
      {/* Top Navbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-md flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-transparent bg-clip-text">Afrimetrics</h1>
        </div>
        <MarketSelector />
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search African stocks..." 
            className="w-full pl-10 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
          />
        </div>
      </div>
      
      {/* Main Index Overview - Conditional rendering based on selected market */}
      <div className="mb-6">
        {isNGXSelected ? (
          // NGX ASI Index Overview
          <div>
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--text-secondary)]">NGX All Share Index</h2>
            </div>
            
            <Card className="mb-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="bg-[var(--card-bg)] p-1.5 rounded-full mr-2 border border-[var(--card-border)]">
                    <img 
                      src="/ngx-logo.svg" 
                      alt="NGX Logo" 
                      className="h-5 w-5" 
                      onError={(e) => {
                        // Fallback to a simple SVG icon if image fails to load
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                          svg.setAttribute('class', 'h-5 w-5 text-[var(--primary)]');
                          svg.setAttribute('viewBox', '0 0 24 24');
                          svg.setAttribute('fill', 'none');
                          svg.innerHTML = '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>';
                          parent.appendChild(svg);
                        }
                      }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">Overall index for the Nigerian stock market</span>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">{MARKET_DATA.NGX.index.value.toLocaleString()}</span>
                    <span className={`ml-3 ${MARKET_DATA.NGX.index.percentChange > 0 ? 'text-[var(--gain)] bg-[var(--gain)]' : 'text-[var(--loss)] bg-[var(--loss)]'} bg-opacity-20 px-2 py-1 rounded-lg text-sm font-medium`}>
                      {MARKET_DATA.NGX.index.percentChange > 0 ? '+' : ''}{MARKET_DATA.NGX.index.percentChange.toFixed(2)}% ({MARKET_DATA.NGX.index.change > 0 ? '+' : ''}{MARKET_DATA.NGX.index.change.toFixed(2)})
                    </span>
                  </div>
                </div>
                
                <div className="h-32 mt-4 bg-[var(--card-bg)] relative">
                  {/* This would be your actual chart component */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-[var(--card-border)] relative">
                      <div 
                        className="absolute top-0 left-0 h-full" 
                        style={{ 
                          width: '75%', 
                          backgroundColor: MARKET_DATA.NGX.index.percentChange > 0 ? 'var(--gain)' : 'var(--loss)' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[var(--text-muted)]">
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span>13:00</span>
                    <span>14:00</span>
                    <span>15:00</span>
                    <span>16:00</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          // Default AFX ASI Index Overview
          <div>
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--text-secondary)]">AFX ASI (African Stock Index)</h2>
            </div>
            
            <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-lg border border-[var(--card-border)] mb-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--secondary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-[var(--text-muted)]">Composite index of major African stock exchanges</span>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">15,685.42</span>
                    <span className="ml-3 text-[var(--gain)] bg-opacity-20 bg-[var(--gain)] px-2 py-1 rounded-lg text-sm font-medium">
                      +1.7% (+265.42)
                    </span>
                  </div>
                </div>
                
                <div className="h-32 mt-4 bg-[var(--card-bg)] relative">
                  {/* This would be your actual chart component */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-[var(--card-border)] relative">
                      <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[var(--text-muted)]">
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span>13:00</span>
                    <span>14:00</span>
                    <span>15:00</span>
                    <span>16:00</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--highlight)] p-5 rounded-2xl shadow-lg mb-6">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-white text-lg font-medium">Total Value Traded Today</h3>
                  </div>
                  <p className="text-3xl font-bold text-white mt-2">$5.65B</p>
                  <p className="text-sm text-white opacity-80">Across selected African markets</p>
                </div>
                
                <div className="flex space-x-3">
                  {/* Up Box */}
                  <div className="bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155] flex flex-col items-center">
                    <div className="bg-[#10B981] bg-opacity-20 p-1 rounded-full mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <p className="text-[#10B981] font-bold text-xl">284</p>
                    <p className="text-white text-xs opacity-80">Up</p>
                  </div>
                  
                  {/* Down Box */}
                  <div className="bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155] flex flex-col items-center">
                    <div className="bg-[#EF4444] bg-opacity-20 p-1 rounded-full mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <p className="text-[#EF4444] font-bold text-xl">156</p>
                    <p className="text-white text-xs opacity-80">Down</p>
                  </div>
                  
                  {/* Flat Box */}
                  <div className="bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155] flex flex-col items-center">
                    <div className="bg-[#94A3B8] bg-opacity-20 p-1 rounded-full mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    </div>
                    <p className="text-[#94A3B8] font-bold text-xl">45</p>
                    <p className="text-white text-xs opacity-80">Flat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
     
      
      {/* Market Snapshots */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Market Snapshots</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isNGXSelected ? (
            // NGX-specific indices
            NGX_INDICES.slice(1).map(index => (
              <Card key={index.id} className="mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold">{index.name}</h3>
                    <span 
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium ${index.percentChange > 0 ? 'bg-[var(--gain)] bg-opacity-20 text-[var(--gain)]' : 'bg-[var(--loss)] bg-opacity-20 text-[var(--loss)]'}`}
                    >
                      {index.percentChange > 0 ? '+' : ''}{index.percentChange.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{index.value.toLocaleString()}</span>
                    <span className={`ml-2 text-sm ${index.percentChange > 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                      {index.change > 0 ? '+' : ''}{index.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Default market indices
            marketIndices.map(index => (
              <MarketSnapshot 
                key={index.id} 
                marketData={MARKET_DATA[index.market]} 
              />
            ))
          )}
        </div>
      </div>
      
      {/* Stock Bubbles - Updated to not pass data prop */}
      {isNGXSelected && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Stock Bubbles</h2>
          </div>
          <CustomBubbleChart 
            height={600}
            timeframe={timeFilter} 
            metric={stockFilter}
          />
        </div>
      )}
      
      {/* Market Bubble Chart for non-NGX markets */}
      {!isNGXSelected && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Market Overview</h2>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              {['Day', 'Week', 'Month', 'Year'].map((tf) => (
                <button 
                  key={tf}
                  className={`px-3 py-1 text-sm rounded ${timeFilter === tf.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setTimeFilter(tf.toLowerCase() as TimeFilter)}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Performing Stocks - Only shown for non-NGX markets */}
      {!isNGXSelected && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Top Performing Stocks</h2>
          </div>
          <TopStocks />
        </div>
      )}
      
      {/* Weekly Market Highlights */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Weekly Market Highlights</h2>
        </div>
        <MarketNews />
      </div>
      
      {/* Research Corner */}
      <div className="mb-20">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Research Corner</h2>
        </div>
        <ResearchCorner />
      </div>
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--card-border)] shadow-lg">
        <div className="max-w-md mx-auto sm:max-w-2xl md:max-w-4xl flex justify-around">
          <button className="flex flex-col items-center py-3 px-5 text-[var(--primary)] font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs mt-1">Top Stocks</span>
          </button>
          <button className="flex flex-col items-center py-3 px-5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Indices</span>
          </button>
          <button className="flex flex-col items-center py-3 px-5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-xs mt-1">Watchlist</span>
          </button>
          <button className="flex flex-col items-center py-3 px-5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs mt-1">News</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function HomePage({ initialMarket = "ALL" }: { initialMarket?: MarketType }) {
  return (
    <MarketProvider initialMarket={initialMarket}>
      <HomeContent />
    </MarketProvider>
  );
}
