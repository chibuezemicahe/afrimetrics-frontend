// import { StockData } from "../types/extended-stock";



// // Extended mock data for NGX stocks (200+ companies)
// export const NGX_EXTENDED_STOCKS: StockData[] = [
//   // Existing stocks from ngx.ts
//   {
//     id: "ngx-dangcem",
//     name: "Dangote Cement",
//     symbol: "DANGCEM",
//     price: 280.50,
//     change: 12.50,
//     percentChange: 4.66,
//     volume: 1234567,
//     value: 346345743.5,
//     trades: 234,
//     sector: "Industrial",
//     market: "NGX",
//     logo: "/logos/dangcem.png"
//   },
//   {
//     id: "ngx-mtnn",
//     name: "MTN Nigeria",
//     symbol: "MTNN",
//     price: 178.20,
//     change: 5.30,
//     percentChange: 3.06,
//     volume: 987654,
//     value: 175999826.8,
//     trades: 312,
//     sector: "Telecommunications",
//     market: "NGX",
//     logo: "/logos/mtnn.png"
//   },
//   // Financial Services Sector
//   {
//     id: "ngx-accesscorp",
//     name: "Access Holdings",
//     symbol: "ACCESSCORP",
//     price: 18.65,
//     change: 0.45,
//     percentChange: 2.47,
//     volume: 3245678,
//     value: 60531594.7,
//     trades: 478,
//     sector: "Financial Services",
//     market: "NGX"
//   },
//   {
//     id: "ngx-ubaplc",
//     name: "United Bank for Africa",
//     symbol: "UBA",
//     price: 21.30,
//     change: 0.75,
//     percentChange: 3.65,
//     volume: 2876543,
//     value: 61270365.9,
//     trades: 412,
//     sector: "Financial Services",
//     market: "NGX"
//   },
//   {
//     id: "ngx-fidelitybk",
//     name: "Fidelity Bank",
//     symbol: "FIDELITYBK",
//     price: 7.85,
//     change: 0.25,
//     percentChange: 3.29,
//     volume: 4567890,
//     value: 35857836.5,
//     trades: 356,
//     sector: "Financial Services",
//     market: "NGX"
//   },
//   {
//     id: "ngx-stanbic",
//     name: "Stanbic IBTC Holdings",
//     symbol: "STANBIC",
//     price: 54.20,
//     change: -1.30,
//     percentChange: -2.34,
//     volume: 876543,
//     value: 47508630.6,
//     trades: 245,
//     sector: "Financial Services",
//     market: "NGX"
//   },
//   {
//     id: "ngx-wemabank",
//     name: "Wema Bank",
//     symbol: "WEMABANK",
//     price: 5.45,
//     change: 0.15,
//     percentChange: 2.83,
//     volume: 3456789,
//     value: 18839500.05,
//     trades: 289,
//     sector: "Financial Services",
//     market: "NGX"
//   },
//   // Oil & Gas Sector
//   {
//     id: "ngx-seplat",
//     name: "Seplat Energy",
//     symbol: "SEPLAT",
//     price: 1875.40,
//     change: 45.60,
//     percentChange: 2.49,
//     volume: 234567,
//     value: 439893289.8,
//     trades: 187,
//     sector: "Oil & Gas",
//     market: "NGX"
//   },
//   {
//     id: "ngx-totalenergies",
//     name: "TotalEnergies Marketing",
//     symbol: "TOTAL",
//     price: 320.50,
//     change: -8.70,
//     percentChange: -2.64,
//     volume: 156789,
//     value: 50251624.5,
//     trades: 134,
//     sector: "Oil & Gas",
//     market: "NGX"
//   },
//   {
//     id: "ngx-conoil",
//     name: "Conoil",
//     symbol: "CONOIL",
//     price: 87.30,
//     change: 2.10,
//     percentChange: 2.47,
//     volume: 345678,
//     value: 30178541.4,
//     trades: 156,
//     sector: "Oil & Gas",
//     market: "NGX"
//   },
//   // Consumer Goods Sector
//   {
//     id: "ngx-flourmill",
//     name: "Flour Mills of Nigeria",
//     symbol: "FLOURMILL",
//     price: 32.80,
//     change: 0.90,
//     percentChange: 2.82,
//     volume: 1234567,
//     value: 40494197.6,
//     trades: 267,
//     sector: "Consumer Goods",
//     market: "NGX"
//   },
//   {
//     id: "ngx-dangsugar",
//     name: "Dangote Sugar Refinery",
//     symbol: "DANGSUGAR",
//     price: 45.60,
//     change: 1.20,
//     percentChange: 2.70,
//     volume: 987654,
//     value: 45037022.4,
//     trades: 198,
//     sector: "Consumer Goods",
//     market: "NGX"
//   },
//   {
//     id: "ngx-guinness",
//     name: "Guinness Nigeria",
//     symbol: "GUINNESS",
//     price: 65.30,
//     change: -2.40,
//     percentChange: -3.54,
//     volume: 567890,
//     value: 37083217,
//     trades: 176,
//     sector: "Consumer Goods",
//     market: "NGX"
//   },
//   // Industrial Sector
//   {
//     id: "ngx-wapco",
//     name: "Lafarge Africa",
//     symbol: "WAPCO",
//     price: 28.90,
//     change: 0.70,
//     percentChange: 2.48,
//     volume: 1456789,
//     value: 42101302.1,
//     trades: 234,
//     sector: "Industrial",
//     market: "NGX"
//   },
//   {
//     id: "ngx-buafoods",
//     name: "BUA Foods",
//     symbol: "BUAFOODS",
//     price: 156.80,
//     change: 4.30,
//     percentChange: 2.82,
//     volume: 876543,
//     value: 137442342.4,
//     trades: 245,
//     sector: "Consumer Goods",
//     market: "NGX"
//   },
//   // Continue with more companies...
// ];

// // Generate additional mock companies to reach 200+
// const sectors = [
//   "Financial Services", 
//   "Oil & Gas", 
//   "Consumer Goods", 
//   "Industrial", 
//   "Telecommunications", 
//   "Healthcare", 
//   "Agriculture", 
//   "ICT", 
//   "Construction", 
//   "Insurance", 
//   "Conglomerate"
// ];

// const generateAdditionalStocks = (count: number): StockData[] => {
//   const additionalStocks: StockData[] = [];
  
//   for (let i = 1; i <= count; i++) {
//     // Generate random values within realistic ranges
//     const sector = sectors[Math.floor(Math.random() * sectors.length)];
//     const price = parseFloat((Math.random() * 500 + 1).toFixed(2));
//     const percentChange = parseFloat((Math.random() * 10 - 5).toFixed(2)); // -5% to +5%
//     const change = parseFloat((price * percentChange / 100).toFixed(2));
//     const volume = Math.floor(Math.random() * 5000000) + 50000;
//     const trades = Math.floor(Math.random() * 500) + 50;
//     const value = price * volume;
    
//     // Create company name and symbol based on sector and index
//     const companyName = `Nigerian ${sector.split(' ')[0]} Corp ${i}`;
//     const symbol = `N${sector.substring(0, 3).toUpperCase()}${i}`;
    
//     additionalStocks.push({
//       id: `ngx-${symbol.toLowerCase()}`,
//       name: companyName,
//       symbol: symbol,
//       price: price,
//       change: change,
//       percentChange: percentChange,
//       volume: volume,
//       value: value,
//       trades: trades,
//       sector: sector,
//       market: "NGX"
//     });
//   }
  
//   return additionalStocks;
// };

// // Generate additional stocks to reach 200+ total
// const additionalStocks = generateAdditionalStocks(185); // Adjust number as needed

// // Combine existing and generated stocks
// export const COMPLETE_NGX_STOCKS: StockData[] = [
//   ...NGX_EXTENDED_STOCKS,
//   ...additionalStocks
// ];