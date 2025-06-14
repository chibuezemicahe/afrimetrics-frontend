import Card from "../ui/Card";

export default function ResearchCorner() {
  return (
    <Card className="mb-4 relative overflow-hidden" variant="highlight">
      <div className="p-4 bg-gradient-to-br from-[#007B3B] to-[#005624]">
        <div className="flex items-center mb-3">
          <div className="bg-white bg-opacity-20 p-1.5 rounded-full mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Afrimetrics Research Corner</h3>
        </div>
        
        <p className="text-white text-opacity-90 text-sm mb-4">
          Access exclusive market insights, analysis reports, and investment recommendations from our expert research team.
        </p>
        
        <div className="flex justify-between items-center">
          <a 
            href="/research" 
            className="px-4 py-2 bg-white text-[#005624] text-sm font-medium rounded-lg hover:bg-opacity-90 transition-all inline-flex items-center"
          >
            Explore
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          
          <div className="flex items-center">
            <span className="text-xs text-white text-opacity-75">Premium</span>
            <div className="ml-1 bg-yellow-400 rounded-full p-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#005624]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#005624] to-transparent opacity-30"></div>
    </Card>
  );
}