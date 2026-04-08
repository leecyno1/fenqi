import Link from "next/link";

import { formatCompactNumber, formatDateLabel, formatPercent, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MiniChart } from "@/components/mini-chart";
import { ProbabilityBar } from "@/components/probability-bar";

type MarketCardProps = {
  market: {
    slug: string;
    href?: string;
    chartSlug?: string;
    contentOrigin: "external_live" | "local_curated" | "seed_demo";
    freshnessStatus: "fresh" | "stale" | "missing";
    lastUpdatedAt: string | Date | null;
    categoryLabel: string;
    topicLabel: string;
    question: string;
    brief: string;
    statusLabel: string;
    trendDirection: "up" | "down" | "flat";
    closingSoon: boolean;
    closesAt: string | Date;
    volumePoints: number;
    activeTraders: number;
    probability: {
      yes: number;
      no: number;
    };
    sampleOrder: {
      averagePrice: number;
      cost: number;
    };
  };
  className?: string;
};

export function MarketCard({ market, className }: MarketCardProps) {
  const leadingSide = market.probability.yes >= market.probability.no ? "YES" : "NO";
  const edge = Math.abs(market.probability.yes - market.probability.no);
  const href = market.href ?? `/markets/${market.slug}`;
  const chartSlug = market.chartSlug ?? market.slug;
  const sourceLabel =
    market.contentOrigin === "external_live"
      ? "外部动态"
      : market.contentOrigin === "local_curated"
        ? "本地策展"
        : "演示样例";
  const trendLabel =
    market.trendDirection === "up"
      ? "YES 动能更强"
      : market.trendDirection === "down"
        ? "NO 动能更强"
        : "分歧仍在拉扯";

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-[1.2rem] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[0_12px_26px_rgba(11,31,77,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(11,31,77,0.14)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">
            <span className="rounded-full border border-[rgba(29,78,216,0.25)] bg-[rgba(29,78,216,0.1)] px-2.5 py-1 text-[var(--color-accent-deep)]">{market.topicLabel}</span>
            <span className="rounded-full border border-[rgba(198,40,40,0.28)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">{market.categoryLabel}</span>
            <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">{market.statusLabel}</span>
            {market.closingSoon ? <span className="rounded-full border border-[rgba(198,40,40,0.32)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">即将锁盘</span> : null}
            <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">{sourceLabel}</span>
            {market.freshnessStatus !== "fresh" ? (
              <span className="rounded-full border border-[rgba(198,40,40,0.32)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">数据较旧</span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 max-w-xl text-[0.96rem] leading-[1.18] font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
            {market.question}
          </h3>
          <p className="line-clamp-2 max-w-xl text-[0.76rem] leading-[1.35] text-[color:var(--color-muted-ink)]">{market.brief}</p>
        </div>
        <div className="min-w-[5.4rem] rounded-[0.95rem] border border-[rgba(29,78,216,0.3)] bg-[var(--color-accent)] px-2.5 py-2 text-right text-white shadow-[0_10px_20px_rgba(11,31,77,0.16)]">
          <p className="font-display text-[0.58rem] uppercase tracking-[0.26em] text-white/72">主流</p>
          <p className="mt-1.5 font-display text-[1.4rem] leading-none tracking-tight">
            {leadingSide === "YES"
              ? formatPercent(market.probability.yes)
              : formatPercent(market.probability.no)}
          </p>
          <p className="mt-1 text-[0.58rem] leading-4 text-white/78">{leadingSide} / 差值 {formatPercent(edge)}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[0.68rem] text-[color:var(--color-muted-ink)]">
        <span className="truncate">
          {market.lastUpdatedAt ? `更新 ${formatDateLabel(market.lastUpdatedAt)}` : trendLabel}
        </span>
        <span className="shrink-0 font-medium">{leadingSide} 领先 {formatPercent(edge)}</span>
      </div>

      <div className="mt-2 h-10">
        <MiniChart slug={chartSlug} />
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.25em] text-[color:var(--color-muted-ink)]">
          <span>YES</span>
          <span>NO</span>
        </div>
        <ProbabilityBar yes={market.probability.yes} no={market.probability.no} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[0.74rem] text-[color:var(--color-muted-ink)]">
        <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-2.5 py-2">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">收盘</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</p>
        </div>
        <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-2.5 py-2">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">成交积分</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatCompactNumber(market.volumePoints)}</p>
        </div>
        <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-2.5 py-2">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">活跃分析者</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatPoints(market.activeTraders)}</p>
        </div>
      </div>
    </Link>
  );
}
