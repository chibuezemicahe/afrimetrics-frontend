"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { MarketIndex } from "@/types/stock";


Chart.register(...registerables);

interface BubbleChartProps {
  markets: MarketIndex[];
  marketCaps: number[];
}

export default function BubbleChart({ markets, marketCaps }: BubbleChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Prepare data
    const data = markets.map((market, index) => ({
      x: index + 1,
      y: market.percentChange,
      r: Math.sqrt(marketCaps[index]) / 10000, // Scale bubble size based on market cap
      market: market.market,
      value: market.value,
      change: market.percentChange,
    }));

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "Market Performance",
            data,
            backgroundColor: data.map(item => {
              // Color based on performance
              if (item.change > 0) return "rgba(255, 165, 0, 0.7)"; // Orange for gainers
              if (item.change < 0) return "rgba(215, 38, 61, 0.7)"; // Red for losers
              return "rgba(30, 144, 255, 0.7)"; // Blue for neutral
            }),
            borderColor: data.map(item => {
              if (item.change > 0) return "#FFA500"; // Orange
              if (item.change < 0) return "#D7263D"; // Red
              return "#1E90FF"; // Blue
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false,
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "% Change",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const item = data[context.dataIndex];
                return [
                  `Market: ${item.market}`,
                  `Value: ${item.value.toLocaleString()}`,
                  `Change: ${item.change.toFixed(2)}%`,
                ];
              },
            },
          },
          legend: {
            display: false,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [markets, marketCaps]);

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  );
}