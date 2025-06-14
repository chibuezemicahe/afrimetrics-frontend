"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface SparklineProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
}

export default function Sparkline({ 
  data, 
  color = "#1E90FF", 
  height = 40 
}: SparklineProps) {
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

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(item => item.date),
        datasets: [
          {
            data: data.map(item => item.value),
            borderColor: color,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
            fill: false,
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
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, color]);

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      <canvas ref={chartRef} />
    </div>
  );
}