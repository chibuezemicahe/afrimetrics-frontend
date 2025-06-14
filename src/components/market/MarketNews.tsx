import { useMarket } from "@/context/MarketContext";
import Card from "../ui/Card";

export default function MarketNews() {
  const { selectedMarket, getMarketNews } = useMarket();
  const news = getMarketNews(selectedMarket);

  return (
    <Card className="mb-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Weekly Market Highlights</h3>
        <div className="flex items-center bg-[var(--primary)] bg-opacity-10 px-2 py-1 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--primary)] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-medium text-[var(--primary)]">Afrimetrics Research</span>
        </div>
      </div>
      <div className="space-y-4">
        {news.map((item, index) => (
          <div key={index} className="p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] hover:border-[var(--primary)] hover:border-opacity-30 transition-all">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-[var(--text-secondary)] mb-2">{item.title}</h4>
              {item.source === "Afrimetrics Research" && (
                <div className="flex-shrink-0 ml-2 px-2 py-1 bg-[#007B3B] bg-opacity-20 rounded-md">
                  <span className="text-xs font-medium text-[#10B981]">Afrimetrics Research</span>
                </div>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{item.summary}</p>
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {item.date}
              </div>
              {item.source && item.source !== "Afrimetrics Research" && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  {item.source}
                </div>
              )}
            </div>
            {(item as { fullReportUrl?: string }).fullReportUrl && (
              <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
                <a 
                  href={(item as { fullReportUrl?: string }).fullReportUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center"
                >
                  See Full Report
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            )}
            {item.source === "Afrimetrics Research" && (
              <div className="absolute bottom-2 right-2 opacity-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <button className="w-full mt-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center">
        <span>See Full Report</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </Card>
  );
}