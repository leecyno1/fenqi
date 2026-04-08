"use client";

import { useMemo, useState } from "react";

import { ProbabilityChart } from "@/components/probability-chart";
import { TradeForm } from "@/components/trade-form";
import { getContentOriginLabel, type EventDetailView } from "@/lib/data/views";
import { formatDateLabel, formatPercent, formatPoints } from "@/lib/format";

type EventDetailPanelProps = {
  event: EventDetailView;
  userBalance: number | null;
  isAuthenticated: boolean;
};

export function EventDetailPanel({
  event,
  userBalance,
  isAuthenticated,
}: EventDetailPanelProps) {
  const [selectedSlug, setSelectedSlug] = useState(event.selectedChildMarket.slug);

  const selectedChild = useMemo(
    () =>
      event.childMarkets.find((child) => child.slug === selectedSlug) ??
      event.selectedChildMarket,
    [event.childMarkets, event.selectedChildMarket, selectedSlug],
  );
  const availableShares =
    event.holdings.positionsByMarketSlug[selectedChild.slug] ?? { YES: 0, NO: 0 };
  const isTradingOpen =
    selectedChild.status === "live" && new Date(selectedChild.closesAt) > new Date();
  const selectedShares = event.holdings.byMarketSlug[selectedChild.slug] ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_22rem]">
      <section className="space-y-4">
        <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-accent-deep)]">
              {event.topicLabel}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
              {event.activeChildCount} 个子市场
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
              总成交 {formatPoints(event.totalVolumePoints)}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
              {getContentOriginLabel(event.contentOrigin)}
            </span>
            {event.lastUpdatedAt ? (
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
                更新 {formatDateLabel(event.lastUpdatedAt)}
              </span>
            ) : null}
            {event.freshnessStatus !== "fresh" ? (
              <span className="rounded-full border border-[rgba(198,40,40,0.28)] bg-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-secondary-deep)]">
                数据较旧
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-[1.6rem] leading-[1.15] font-semibold tracking-tight text-[var(--color-ink)] md:text-[2.15rem]">
            {event.question}
          </h1>
          <p className="mt-3 text-[0.88rem] leading-6 text-[color:var(--color-muted-ink)]">
            {event.brief}
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                多答案统计
              </p>
              <p className="mt-1 text-[0.82rem] text-[color:var(--color-muted-ink)]">
                选择任一时间边界，右侧交易面板和下方曲线会同步切换。
              </p>
            </div>
            <div className="text-right text-[0.76rem] text-[color:var(--color-muted-ink)]">
              当前选中 <span className="font-medium text-[var(--color-ink)]">{selectedChild.answerLabel}</span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-black/8 bg-white">
            <div className="hidden grid-cols-[7rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_6rem_7rem] gap-3 border-b border-black/8 bg-[rgba(11,31,77,0.04)] px-4 py-3 text-[0.66rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)] md:grid">
              <span>答案</span>
              <span>题面</span>
              <span>成交</span>
              <span>YES</span>
              <span>买 YES</span>
              <span>买 NO</span>
              <span>锁盘</span>
            </div>
            <div className="divide-y divide-black/8">
              {event.childMarkets.map((child) => {
                const active = child.slug === selectedChild.slug;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedSlug(child.slug)}
                    className={`grid w-full gap-2 px-4 py-3 text-left transition md:grid-cols-[7rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_6rem_7rem] md:items-center md:gap-3 ${
                      active ? "bg-[rgba(29,78,216,0.08)]" : "bg-white hover:bg-[rgba(11,31,77,0.03)]"
                    }`}
                  >
                    <div>
                      <p className="text-[0.9rem] font-semibold text-[var(--color-ink)]">{child.answerLabel}</p>
                      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
                        {child.statusLabel}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-[0.84rem] leading-5 text-[var(--color-ink)]">{child.question}</p>
                    <p className="text-[0.82rem] font-medium text-[var(--color-ink)]">{formatPoints(child.volumePoints)}</p>
                    <p className="text-[0.96rem] font-semibold text-[var(--color-accent-deep)]">{formatPercent(child.probability.yes)}</p>
                    <p className="text-[0.82rem] text-[var(--color-ink)]">{child.buyPrices.yes.toFixed(2)}</p>
                    <p className="text-[0.82rem] text-[var(--color-ink)]">{child.buyPrices.no.toFixed(2)}</p>
                    <div className="text-[0.78rem] text-[color:var(--color-muted-ink)]">
                      <p>{formatDateLabel(child.closesAt)}</p>
                      {child.freshnessStatus !== "fresh" ? (
                        <p className="mt-1 text-[0.68rem] text-[var(--color-secondary-deep)]">数据较旧</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ProbabilityChart slug={selectedChild.slug} status={selectedChild.status} />
      </section>

      <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
        <TradeForm
          slug={selectedChild.slug}
          userBalance={userBalance}
          isAuthenticated={isAuthenticated}
          isTradingOpen={isTradingOpen}
          yesProbability={selectedChild.probability.yes}
          noProbability={selectedChild.probability.no}
          availableShares={availableShares}
          resolution={
            selectedChild.resolution
              ? {
                  outcome: selectedChild.resolution.outcome,
                  sourceLabel: selectedChild.resolution.sourceLabel,
                  sourceUrl: selectedChild.resolution.sourceUrl,
                  rationale: selectedChild.resolution.rationale,
                }
              : null
          }
        />

        <div className="rounded-[1.45rem] border border-black/10 bg-[var(--color-paper)] p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">
            事件持仓摘要
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <div className="rounded-[0.95rem] border border-black/8 bg-white px-3 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">事件总持仓</p>
              <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(event.holdings.totalShares)}</p>
            </div>
            <div className="rounded-[0.95rem] border border-black/8 bg-white px-3 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">当前子市场</p>
              <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(selectedShares)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-[1rem] border border-black/8 bg-white px-3 py-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
            <div className="flex items-center justify-between">
              <span>YES 可卖</span>
              <span className="font-medium text-[var(--color-ink)]">{formatPoints(availableShares.YES)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>NO 可卖</span>
              <span className="font-medium text-[var(--color-ink)]">{formatPoints(availableShares.NO)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
