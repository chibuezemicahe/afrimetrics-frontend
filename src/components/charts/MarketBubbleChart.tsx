"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useMarket } from "@/context/MarketContext";

Chart.register(...registerables);

// Define the data structure for bubble chart
interface BubbleData {
  market: string;
  marketCap: number; // For bubble size
  percentChange: number; // For color
  volume: number; // Additional data
}

interface MarketBubbleChartProps {
  data?: BubbleData[];
}

// Mock data - this would come from your backend later
const MOCK_BUBBLE_DATA: BubbleData[] = [
  {
    market: "NGX",
    marketCap: 12345678901234,
    percentChange: 0.36,
    volume: 234567890
  },
  {
    market: "GSE",
    marketCap: 5678901234567,
    percentChange: -0.43,
    volume: 123456789
  },
  {
    market: "JSE",
    marketCap: 23456789012345,
    percentChange: 0.69,
    volume: 345678901
  }
];

export default function MarketBubbleChart({ data = MOCK_BUBBLE_DATA }: MarketBubbleChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { timeFilter } = useMarket();

  // Function to get color based on percent change
  const getColor = (percentChange: number) => {
    if (percentChange > 0) return "rgba(255, 165, 0, 0.7)"; // Orange for gainers
    if (percentChange < 0) return "rgba(215, 38, 61, 0.7)"; // Red for losers
    return "rgba(30, 144, 255, 0.7)"; // Blue for neutral
  };

  // Function to get border color (slightly darker)
  const getBorderColor = (percentChange: number) => {
    if (percentChange > 0) return "rgb(255, 165, 0)"; // Orange for gainers
    if (percentChange < 0) return "rgb(215, 38, 61)"; // Red for losers
    return "rgb(30, 144, 255)"; // Blue for neutral
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Prepare data for the bubble chart
    const bubbleData = data.map(item => ({
      x: Math.random() * 100, // Random x position for visualization
      y: Math.random() * 100, // Random y position for visualization
      r: Math.sqrt(item.marketCap) / 10000000, // Scale bubble size based on market cap
      market: item.market,
      percentChange: item.percentChange,
      volume: item.volume
    }));

    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [{
          data: bubbleData,
          backgroundColor: bubbleData.map(item => getColor(item.percentChange)),
          borderColor: bubbleData.map(item => getBorderColor(item.percentChange)),
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const item = bubbleData[context.dataIndex];
                return [
                  `Market: ${item.market}`,
                  `Change: ${item.percentChange > 0 ? '+' : ''}${item.percentChange.toFixed(2)}%`,
                  `Volume: ${item.volume.toLocaleString()}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            display: false,
            min: 0,
            max: 100
          },
          y: {
            display: false,
            min: 0,
            max: 100
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, timeFilter]);

  return (
    <div className="w-full h-48 relative">
      <canvas ref={chartRef} />
    </div>
  );
}