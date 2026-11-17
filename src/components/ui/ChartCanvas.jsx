"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

/** Wrapper do Chart.js: recria o gráfico quando `config` muda. */
export default function ChartCanvas({ config, className = "h-64" }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, config);
    return () => chartRef.current?.destroy();
  }, [config]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
