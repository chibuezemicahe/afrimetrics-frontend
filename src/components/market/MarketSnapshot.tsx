import Card from "../ui/Card";
import Sparkline from "../charts/Sparkline";
import { MarketData } from "@/types/stock";

interface MarketSnapshotProps {
  marketData: MarketData;
}

export default function MarketSnapshot({ marketData }: MarketSnapshotProps) {
  const { index, totalVolume, valueTraded, advancing, declining, historicalData } = marketData;
  
  // Determine color based on index performance
  const indexColor = index.percentChange > 0 ? "text-[var(--gain)]" : index.percentChange < 0 ? "text-[var(--loss)]" : "text-[var(--highlight)]";
  const sparklineColor = index.percentChange > 0 ? "var(--gain)" : index.percentChange < 0 ? "var(--loss)" : "var(--highlight)";
  const bgColor = index.percentChange > 0 ? "bg-[var(--gain)] bg-opacity-10" : index.percentChange < 0 ? "bg-[var(--loss)] bg-opacity-10" : "bg-[var(--highlight)] bg-opacity-10";
  
  // Extract market name and index name for display
  const marketName = index.name.split(' ')[0]; // Assuming format like "NGX ASI"
  const indexName = index.name.split(' ').slice(1).join(' '); // Get the rest of the name

  return (
    <Card className="mb-4">
      <div className="flex flex-col">
        {/* Market Index with Logo */}
        <div className="flex items-center mb-4">
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
          <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{marketName}</h3>
          <div className="ml-2 px-2 py-0.5 bg-[var(--primary)] bg-opacity-10 rounded-full">
            <span className="text-xs font-medium text-[var(--primary)]">{indexName}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">{index.value.toLocaleString()}</span>
              <span className={`ml-2 ${indexColor} font-medium px-2 py-0.5 ${bgColor} rounded-lg text-sm`}>
                {index.change > 0 ? "+" : ""}{index.change.toFixed(2)} ({index.percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="w-24">
            <Sparkline data={historicalData} color={sparklineColor} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-muted)] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-[var(--text-muted)]">Volume</p>
            </div>
            <p className="font-medium">{totalVolume.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-muted)] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[var(--text-muted)]">Value</p>
            </div>
            <p className="font-medium">{valueTraded.toLocaleString()}</p>
          </div>
          
          {/* Advancing - Enhanced with better contrast and responsiveness */}
          <div className="p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--gain)] border-opacity-20 shadow-sm hover:border-opacity-30 transition-all">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-shrink overflow-hidden">
                <div className="bg-[var(--gain)] bg-opacity-10 p-1.5 rounded-full mr-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[var(--gain)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)] truncate text-sm">Advancing</p>
              </div>
              <div className="ml-2 flex-shrink-0">
                <span className="font-medium text-[var(--gain)] bg-[var(--gain)] bg-opacity-10 rounded-full px-3 py-1 text-xs inline-block min-w-[32px] text-center">{advancing}</span>
              </div>
            </div>
          </div>
          
          {/* Declining - Enhanced with better contrast and responsiveness */}
          <div className="p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--loss)] border-opacity-20 shadow-sm hover:border-opacity-30 transition-all">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-shrink overflow-hidden">
                <div className="bg-[var(--loss)] bg-opacity-10 p-1.5 rounded-full mr-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[var(--loss)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)] truncate text-sm">Declining</p>
              </div>
              <div className="ml-2 flex-shrink-0">
                <span className="font-medium text-[var(--loss)] bg-[var(--loss)] bg-opacity-10 rounded-full px-3 py-1 text-xs inline-block min-w-[32px] text-center">{declining}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}