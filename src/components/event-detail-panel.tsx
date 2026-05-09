"use client";

import { useMemo, useState } from "react";

import { ProbabilityChart } from "@/components/probability-chart";
import { ShellPanel } from "@/components/shell-panel";
import { TradeForm } from "@/components/trade-form";
import { getContentOriginLabel, type EventDetailView } from "@/lib/data/views";
import { formatDateLabel, formatPercent, formatPoints } from "@/lib/format";

type EventDetailPanelProps = {
  event: EventDetailView;
  userBalance: number | null;
  isAuthenticated: boolean;
};

export function EventDetailPanel({ event, userBalance, isAuthenticated }: EventDetailPanelProps) {
  const [selectedSlug, setSelectedSlug] = useState(event.selectedChildMarket.slug);

  const selectedChild = useMemo(
    () => event.childMarkets.find((child) => child.slug === selectedSlug) ?? event.selectedChildMarket,
    [event.childMarkets, event.selectedChildMarket, selectedSlug],
  );
  const availableShares = event.holdings.positionsByMarketSlug[selectedChild.slug] ?? { YES: 0, NO: 0 };
  const isTradingOpen = selectedChild.status === "live" && new Date(selectedChild.closesAt) > new Date();
  const selectedShares = event.holdings.byMarketSlug[selectedChild.slug] ?? 0;
  const selectedLead = selectedChild.probability.yes >= selectedChild.probability.no ? "YES" : "NO";
  const spread = Math.abs(selectedChild.probability.yes - selectedChild.probability.no);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
        <ShellPanel className="p-5 md:p-6" tone="accent">
          <div className="flex flex-wrap items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/72">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-white">{event.topicLabel}</span>
            <span>{event.activeChildCount} 个子市场</span>
            <span className="h-1 w-1 rounded-full bg-white/28" />
            <span>总成交 {formatPoints(event.totalVolumePoints)}</span>
            <span className="h-1 w-1 rounded-full bg-white/28" />
            <span>{getContentOriginLabel(event.contentOrigin)}</span>
            {event.lastUpdatedAt ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/28" />
                <span>更新 {formatDateLabel(event.lastUpdatedAt)}</span>
              </>
            ) : null}
            {event.freshnessStatus !== "fresh" ? (
              <span className="rounded-full border border-white/16 bg-[rgba(198,40,40,0.22)] px-3 py-1 text-white">
                数据较旧
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-[2rem] leading-[0.96] tracking-[0.01em] text-white md:text-[3.1rem]">
            {event.question}
          </h1>
          <p className="mt-3 max-w-3xl text-[0.9rem] leading-7 text-white/78 md:text-[0.98rem]">{event.brief}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              ["当前子市场", selectedChild.answerLabel],
              ["主导方向", selectedLead],
              ["领先差值", formatPercent(spread)],
              ["交易状态", isTradingOpen ? "开放中" : "已停止"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.1rem] border border-white/14 bg-white/10 px-3.5 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.24em] text-white/58">{label}</p>
                <p className="mt-2 text-[1rem] font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </ShellPanel>

        <ShellPanel className="p-4 md:p-5" tone="secondary">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-secondary-deep)]">交易摘要</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1rem] border border-[rgba(198,40,40,0.14)] bg-white px-3.5 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">YES 概率</p>
              <p className="mt-1.5 text-[1.7rem] font-semibold leading-none text-[var(--color-accent-deep)]">
                {formatPercent(selectedChild.probability.yes)}
              </p>
            </div>
            <div className="rounded-[1rem] border border-[rgba(11,31,77,0.08)] bg-white px-3.5 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">锁盘时间</p>
              <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-ink)]">{formatDateLabel(selectedChild.closesAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[1rem] border border-[rgba(11,31,77,0.08)] bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">买 YES</p>
                <p className="mt-1.5 text-[1.1rem] font-semibold text-[var(--color-ink)]">{selectedChild.buyPrices.yes.toFixed(2)}</p>
              </div>
              <div className="rounded-[1rem] border border-[rgba(11,31,77,0.08)] bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">买 NO</p>
                <p className="mt-1.5 text-[1.1rem] font-semibold text-[var(--color-ink)]">{selectedChild.buyPrices.no.toFixed(2)}</p>
              </div>
            </div>
            <div className="rounded-[1rem] border border-[rgba(11,31,77,0.08)] bg-white px-3.5 py-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
              深链市场页只保留兼容入口；完整证据、规则、相关新闻与子市场切换统一在这个事件页完成。
            </div>
          </div>
        </ShellPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <ShellPanel className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">子市场切换</p>
                <p className="mt-1 text-[0.82rem] text-[color:var(--color-muted-ink)]">
                  按时间边界或答案切换，同步更新下方曲线与右侧交易面板。
                </p>
              </div>
              <div className="rounded-full border border-[var(--color-line)] bg-[rgba(29,78,216,0.06)] px-3 py-1.5 text-[0.76rem] text-[var(--color-accent-deep)]">
                当前: {selectedChild.answerLabel}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {event.childMarkets.map((child) => {
                const active = child.slug === selectedChild.slug;
                const lead = child.probability.yes >= child.probability.no ? "YES" : "NO";

                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedSlug(child.slug)}
                    className={
                      active
                        ? "rounded-[1.2rem] border border-[rgba(29,78,216,0.26)] bg-[rgba(29,78,216,0.08)] px-4 py-3.5 text-left shadow-[0_12px_26px_rgba(11,31,77,0.08)]"
                        : "rounded-[1.2rem] border border-[var(--color-line)] bg-white px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-[rgba(29,78,216,0.24)] hover:shadow-[0_12px_24px_rgba(11,31,77,0.08)]"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.96rem] font-semibold text-[var(--color-ink)]">{child.answerLabel}</p>
                        <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">
                          {child.statusLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">{lead}</p>
                        <p className="mt-1 text-[1rem] font-semibold text-[var(--color-accent-deep)]">
                          {formatPercent(child.probability.yes)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[0.82rem] leading-6 text-[var(--color-ink)]">{child.question}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[0.72rem] text-[color:var(--color-muted-ink)]">
                      <div>
                        <p>成交</p>
                        <p className="mt-1 font-medium text-[var(--color-ink)]">{formatPoints(child.volumePoints)}</p>
                      </div>
                      <div>
                        <p>YES</p>
                        <p className="mt-1 font-medium text-[var(--color-ink)]">{child.buyPrices.yes.toFixed(2)}</p>
                      </div>
                      <div>
                        <p>锁盘</p>
                        <p className="mt-1 font-medium text-[var(--color-ink)]">{formatDateLabel(child.closesAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ShellPanel>

          <ShellPanel className="p-4 md:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">走势与分歧</p>
                  <p className="mt-1 text-[0.82rem] text-[color:var(--color-muted-ink)]">
                    关注概率曲线，不只看当前点位；出现异常跳变时，以来源页和规则页为准。
                  </p>
                </div>
                <ProbabilityChart slug={selectedChild.slug} status={selectedChild.status} />
              </div>

              <div className="space-y-3">
                <div className="rounded-[1rem] border border-[rgba(29,78,216,0.18)] bg-[rgba(29,78,216,0.07)] px-4 py-3.5">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">当前主导方向</p>
                  <p className="mt-1.5 text-[1.45rem] font-semibold text-[var(--color-accent-deep)]">{selectedLead}</p>
                </div>
                <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3.5">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">事件总持仓</p>
                  <p className="mt-1.5 text-[1.45rem] font-semibold text-[var(--color-ink)]">{formatPoints(event.holdings.totalShares)}</p>
                </div>
                <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3.5">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">当前子市场持仓</p>
                  <p className="mt-1.5 text-[1.45rem] font-semibold text-[var(--color-ink)]">{formatPoints(selectedShares)}</p>
                </div>
                <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3.5 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
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
            </div>
          </ShellPanel>
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

          <ShellPanel className="p-4" tone="soft">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">持仓摘要</p>
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <div className="rounded-[0.95rem] border border-[rgba(11,31,77,0.08)] bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">YES 持仓</p>
                <p className="mt-1.5 text-[1.25rem] font-semibold text-[var(--color-ink)]">{formatPoints(availableShares.YES)}</p>
              </div>
              <div className="rounded-[0.95rem] border border-[rgba(11,31,77,0.08)] bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">NO 持仓</p>
                <p className="mt-1.5 text-[1.25rem] font-semibold text-[var(--color-ink)]">{formatPoints(availableShares.NO)}</p>
              </div>
            </div>
            <div className="mt-3 rounded-[1rem] border border-[rgba(11,31,77,0.08)] bg-white px-3 py-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
              事件页负责统一定义、统一证据、统一切换子市场；不要再从多个市场页拼装上下文。
            </div>
          </ShellPanel>
        </aside>
      </div>
    </div>
  );
}
