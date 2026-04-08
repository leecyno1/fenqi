"use client";

import { useEffect, useState } from "react";

import { buildMiniChartPath, toMiniChartPoints } from "./mini-chart-path";

type PriceHistoryPoint = {
  timestamp: string;
  yesProbability: number;
  noProbability: number;
};

type MiniChartProps = {
  slug: string;
};

export function MiniChart({ slug }: MiniChartProps) {
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/markets/${slug}/history?period=7d`);
        if (response.status === 404) {
          setData([]);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch price history");
        }

        const result = await response.json();
        setData(result.data || []);
      } catch {
        // Silently fail for mini chart
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [slug]);

  if (loading || data.length === 0) {
    return null;
  }

  const chartData = data.map((point) => ({
    timestamp: point.timestamp,
    yesProbability: point.yesProbability,
    noProbability: point.noProbability,
  }));
  const points = toMiniChartPoints(chartData);
  const path = buildMiniChartPath(points);

  if (!path) {
    return null;
  }

  return (
    <div className="h-16 w-full" aria-hidden="true">
      <svg
        viewBox="0 0 112 48"
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
