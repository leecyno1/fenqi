"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PriceHistoryPoint = {
  timestamp: string;
  yesProbability: number;
  noProbability: number;
};

type Period = "24h" | "7d" | "30d" | "all";

type ProbabilityChartProps = {
  slug: string;
  status?: "draft" | "live" | "locked" | "review" | "resolved" | "voided";
};

export function ProbabilityChart({ slug, status = "live" }: ProbabilityChartProps) {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/markets/${slug}/history?period=${period}`);
        if (response.status === 404) {
          setData([]);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch price history");
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [slug, period]);

  const chartData = data.map((point) => ({
    timestamp: new Date(point.timestamp).getTime(),
    yes: point.yesProbability * 100,
    no: point.noProbability * 100,
  }));

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === "24h") {
      return format(date, "HH:mm", { locale: zhCN });
    } else if (period === "7d") {
      return format(date, "MM/dd", { locale: zhCN });
    } else {
      return format(date, "MM/dd", { locale: zhCN });
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-[var(--color-paper)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-medium text-[var(--color-ink)]">概率历史</h3>
          <p className="mt-1 text-xs text-[color:var(--color-muted-ink)]">
            {status === "resolved" || status === "voided"
              ? "终态市场会保留结算尾点。"
              : "快照不足时会补齐历史曲线。"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["24h", "7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-black/5 text-[var(--color-muted-ink)] hover:bg-black/10"
              }`}
            >
              {p === "24h" ? "24小时" : p === "7d" ? "7天" : p === "30d" ? "30天" : "全部"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex h-[300px] items-center justify-center text-[var(--color-muted-ink)]">
          加载中...
        </div>
      )}

      {error && (
        <div className="flex h-[300px] items-center justify-center text-[var(--color-secondary)]">
          {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex h-[300px] items-center justify-center text-[var(--color-muted-ink)]">
          当前暂无历史数据
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="var(--color-muted-ink)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="var(--color-muted-ink)"
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-paper)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              labelFormatter={(timestamp) =>
                format(new Date(timestamp as number), "yyyy-MM-dd HH:mm", {
                  locale: zhCN,
                })
              }
              formatter={(value) => {
                if (typeof value !== "number") return ["", ""];
                return [`${value.toFixed(2)}%`, ""];
              }}
            />
            <Line
              type="monotone"
              dataKey="yes"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              name="YES"
            />
            <Line
              type="monotone"
              dataKey="no"
              stroke="var(--color-secondary)"
              strokeWidth={2}
              dot={false}
              name="NO"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[var(--color-accent)]" />
          <span className="text-[var(--color-muted-ink)]">YES 概率</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[var(--color-secondary)]" />
          <span className="text-[var(--color-muted-ink)]">NO 概率</span>
        </div>
      </div>
    </div>
  );
}
