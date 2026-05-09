import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MiniChart } from "@/components/mini-chart";
import { ProbabilityBar } from "@/components/probability-bar";
import { formatCompactNumber, formatDateLabel, formatPercent, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

type MarketCardProps = {
  market: {
    slug: string;
    href?: string;
    chartSlug?: string;
    contentOrigin: "external_live" | "backoffice_candidate" | "local_curated" | "seed_demo";
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
      : market.contentOrigin === "backoffice_candidate"
        ? "后台候选"
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
        "group block rounded-[1.55rem] border border-[var(--color-glass-line)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-card)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-surface-raised)] hover:shadow-[0_22px_42px_rgba(31,39,55,0.12)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
            <span className="rounded-full border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2.5 py-1 text-[var(--color-accent-deep)] shadow-[0_6px_12px_rgba(31,39,55,0.04)]">
              {market.topicLabel}
            </span>
            <span className="rounded-full border border-[rgba(230,76,46,0.18)] bg-[rgba(230,76,46,0.08)] px-2.5 py-1 text-[var(--color-accent)]">
              {market.categoryLabel}
            </span>
            <span className="rounded-full border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2.5 py-1">{market.statusLabel}</span>
            {market.closingSoon ? (
              <span className="rounded-full border border-[rgba(198,40,40,0.32)] bg-[var(--color-surface-raised)] px-2.5 py-1 text-[var(--color-secondary-deep)]">
                即将锁盘
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 max-w-xl text-[1rem] leading-[1.18] font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
            {market.question}
          </h3>
          <p className="line-clamp-2 max-w-xl text-[0.78rem] leading-6 text-[color:var(--color-muted-ink)]">
            {market.brief}
          </p>
        </div>
        <div className="min-w-[6rem] rounded-[1.15rem] bg-[var(--color-accent-deep)] px-3 py-2.5 text-right text-white shadow-[0_14px_28px_rgba(35,45,67,0.2)]">
          <p className="font-display text-[0.58rem] uppercase tracking-[0.26em] text-white/72">主流</p>
          <p className="mt-1.5 font-display text-[1.45rem] leading-none tracking-tight">
            {leadingSide === "YES" ? formatPercent(market.probability.yes) : formatPercent(market.probability.no)}
          </p>
          <p className="mt-1 text-[0.58rem] leading-4 text-white/78">{leadingSide} / 差值 {formatPercent(edge)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[0.68rem] text-[color:var(--color-muted-ink)]">
        <span className="truncate">{market.lastUpdatedAt ? `更新 ${formatDateLabel(market.lastUpdatedAt)}` : trendLabel}</span>
        <span className="shrink-0 rounded-full border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2 py-1 font-medium text-[var(--color-ink)]">
          {sourceLabel}
        </span>
      </div>

      <div className="mt-3 rounded-[1.15rem] border border-[var(--color-glass-line)] bg-[var(--color-panel-muted)] px-3 py-2.5">
        <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.25em] text-[color:var(--color-muted-ink)]">
          <span>YES</span>
          <span>NO</span>
        </div>
        <ProbabilityBar className="mt-2" yes={market.probability.yes} no={market.probability.no} />
        <div className="mt-2.5 h-10">
          <MiniChart slug={chartSlug} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[0.74rem] text-[color:var(--color-muted-ink)]">
        <div className="rounded-[1rem] border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2.5 py-2.5">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">锁盘</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</p>
        </div>
        <div className="rounded-[1rem] border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2.5 py-2.5">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">成交积分</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatCompactNumber(market.volumePoints)}</p>
        </div>
        <div className="rounded-[1rem] border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-2.5 py-2.5">
          <p className="text-[0.56rem] uppercase tracking-[0.24em]">参与者</p>
          <p className="mt-1 text-[0.82rem] font-medium text-[var(--color-ink)]">{formatPoints(market.activeTraders)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[1.1rem] border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-3 py-2.5 text-[0.76rem]">
        <span className="text-[color:var(--color-muted-ink)]">
          {market.freshnessStatus !== "fresh" ? "数据较旧，请先核对时间与来源" : "进入详情查看规则与子市场"}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent-deep)] transition group-hover:text-[var(--color-accent)]">
          进入详情 <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
