import { ArrowUpRight, BarChart3, Clock3, NotebookPen, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { MarketDepthBar } from "@/components/market-depth-bar";
import { ProbabilityBar } from "@/components/probability-bar";
import { ProbabilityChart } from "@/components/probability-chart";
import { TradeForm } from "@/components/trade-form";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/db/client";
import { markets, virtualWallets } from "@/db/schema";
import { getOptionalSession } from "@/lib/auth/session";
import { getPublicSiteConfig } from "@/lib/env";
import {
  getMarketDetailViewBySlug,
  getMarketListItems,
  getMarketPriceHistory,
  getUserMarketPositions,
} from "@/lib/data/queries";
import { formatDateLabel, formatPercent, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await getMarketDetailViewBySlug(slug);
  const session = await getOptionalSession();
  const siteConfig = getPublicSiteConfig();

  if (!market) {
    notFound();
  }

  // Get user wallet balance if authenticated
  let userBalance: number | null = null;
  let availableShares = { YES: 0, NO: 0 };
  if (session?.userId) {
    const [walletRows, userPositions] = await Promise.all([
      db
        .select({ balance: virtualWallets.balance })
        .from(virtualWallets)
        .where(eq(virtualWallets.userId, session.userId))
        .limit(1),
      getUserMarketPositions(session.userId, slug),
    ]);

    const wallet = walletRows[0];
    userBalance = wallet?.balance ?? null;
    availableShares = userPositions.reduce(
      (acc, position) => ({
        ...acc,
        [position.side]: position.shareCount,
      }),
      { YES: 0, NO: 0 },
    );
  }

  // Get market shares for depth bar
  const [marketData] = await db
    .select({
      yesShares: markets.yesShares,
      noShares: markets.noShares,
    })
    .from(markets)
    .where(eq(markets.slug, slug))
    .limit(1);

  const dominantSide = market.probability.yes >= market.probability.no ? "YES" : "NO";
  const probabilityGap = Math.abs(market.probability.yes - market.probability.no);
  const totalMarketShares = (marketData?.yesShares ?? 0) + (marketData?.noShares ?? 0);
  const userOpenShares = availableShares.YES + availableShares.NO;
  const userBias =
    availableShares.YES === availableShares.NO
      ? "中性"
      : availableShares.YES > availableShares.NO
        ? "偏 YES"
        : "偏 NO";
  const isTradingOpen = market.status === "live" && market.closesAt > new Date();
  const [allMarkets, history24h] = await Promise.all([
    getMarketListItems(),
    getMarketPriceHistory(slug, "24h"),
  ]);
  const relatedMarkets = allMarkets
    .filter((item) => item.slug !== market.slug && item.topicKey === market.topicKey)
    .sort((left, right) => right.featuredScore - left.featuredScore)
    .slice(0, 4);
  const historyFirst = history24h?.[0];
  const historyLast = history24h?.at(-1);
  const yesChange24h =
    historyFirst && historyLast
      ? historyLast.yesProbability - historyFirst.yesProbability
      : 0;
  const yesChange24hLabel = `${yesChange24h >= 0 ? "+" : ""}${formatPercent(
    Math.abs(yesChange24h),
  )}`;

  return (
    <SiteShell currentPath="/">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_22rem]">
        <section className="space-y-4">
          <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
            <h1 className="text-[1.55rem] leading-[1.2] font-semibold tracking-tight text-[var(--color-ink)] md:text-[2rem]">
              {market.question}
            </h1>
            <p className="mt-2.5 text-[0.88rem] leading-6 text-[color:var(--color-muted-ink)]">{market.brief}</p>
            {market.parentEvent && market.parentEvent.childCount > 1 ? (
              <div className="mt-3">
                <Link
                  href={`/events/${market.parentEvent.slug}?market=${market.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--color-accent-deep)] transition hover:border-[rgba(29,78,216,0.36)] hover:bg-[rgba(29,78,216,0.12)]"
                >
                  返回事件全貌 <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
            <div className="mt-4 grid gap-2 md:grid-cols-6">
              {[
                ["YES", formatPercent(market.probability.yes)],
                ["NO", formatPercent(market.probability.no)],
                ["24H", yesChange24hLabel],
                ["VOL", formatPoints(market.volumePoints)],
                ["LIQ", formatPoints(market.liquidity)],
                ["TRADERS", formatPoints(market.activeTraders)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`rounded-[0.95rem] border px-3 py-2.5 ${
                    index < 2
                      ? "border-[rgba(29,78,216,0.26)] bg-[rgba(29,78,216,0.08)]"
                      : "border-black/8 bg-white"
                  }`}
                >
                  <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">{label}</p>
                  <p className="mt-1 text-[1rem] font-semibold tracking-tight text-[var(--color-ink)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">
              <span>{market.categoryLabel}</span>
              <span className="h-1 w-1 rounded-full bg-black/20" />
              <span>锁盘 {formatDateLabel(market.closesAt.toISOString())}</span>
              <span className="h-1 w-1 rounded-full bg-black/20" />
              <span>结算 {formatDateLabel(market.resolvesAt.toISOString())}</span>
              {market.externalReference ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-black/20" />
                  <span>{market.externalReference.label}</span>
                </>
              ) : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.45rem] border border-black/8 bg-white">
              <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="relative min-h-[14rem] bg-[rgba(11,31,77,0.04)]">
                  <Image src={market.imageUrl} alt={market.question} fill className="object-cover" sizes="(max-width: 768px) 100vw, 820px" />
                </div>
                <div className="border-l border-black/8 bg-[rgba(29,78,216,0.06)] p-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">事件信息</p>
                  <div className="mt-3 space-y-2.5 text-[0.8rem] leading-5 text-[var(--color-ink)]">
                    <div className="rounded-[1rem] border border-black/8 bg-white px-3 py-3">
                      <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">状态</p>
                      <p className="mt-1.5 font-medium">{market.statusLabel}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/8 bg-white px-3 py-3">
                      <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">创建时间</p>
                      <p className="mt-1.5 font-medium">{formatDateLabel(market.createdAt)}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/8 bg-white px-3 py-3">
                      <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">来源</p>
                      <p className="mt-1.5 font-medium">{market.sourceName ?? "本地事件池"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">当前概率</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.35rem] bg-black px-4 py-5 text-white">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/55">YES</p>
                    <p className="mt-2 text-[2.5rem] font-semibold tracking-tight md:text-[3rem]">{formatPercent(market.probability.yes)}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-black/8 bg-white px-4 py-5">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">NO</p>
                    <p className="mt-2 text-[2.5rem] font-semibold tracking-tight text-[var(--color-ink)] md:text-[3rem]">{formatPercent(market.probability.no)}</p>
                  </div>
                </div>
                <ProbabilityBar className="mt-4 h-3.5" yes={market.probability.yes} no={market.probability.no} />
                <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                  <div className="rounded-[1rem] border border-black/8 bg-white px-3.5 py-3">
                    <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">主导方向</p>
                    <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{dominantSide}</p>
                  </div>
                  <div className="rounded-[1rem] border border-black/8 bg-white px-3.5 py-3">
                    <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">概率差</p>
                    <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPercent(probabilityGap)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-black/8 bg-white px-3.5 py-3">
                    <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">市场总份额</p>
                    <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(totalMarketShares)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-black/8 bg-[rgba(29,78,216,0.08)] p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-accent)]">事件背景</p>
                <p className="mt-3 text-[0.82rem] leading-6 text-[var(--color-ink)]">{market.tone}</p>
                <div className="mt-3.5 space-y-2.5 rounded-[1rem] border border-black/8 bg-white/80 p-3">
                  <div className="flex items-center justify-between text-[0.78rem] text-[color:var(--color-muted-ink)]">
                    <span>交易状态</span>
                    <span className="font-medium text-[var(--color-ink)]">{isTradingOpen ? "开放中" : "已停止"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.78rem] text-[color:var(--color-muted-ink)]">
                    <span>锁盘时间</span>
                    <span className="font-medium text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.78rem] text-[color:var(--color-muted-ink)]">
                    <span>结算时间</span>
                    <span className="font-medium text-[var(--color-ink)]">{formatDateLabel(market.resolvesAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.78rem] text-[color:var(--color-muted-ink)]">
                    <span>来源链接</span>
                    {market.externalReference ? (
                      <a
                        href={market.externalReference.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-deep)]"
                      >
                        打开 <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="font-medium text-[var(--color-ink)]">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Market depth visualization */}
            {marketData && (
              <div className="mt-6">
                <p className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                  市场分歧分布
                </p>
                <MarketDepthBar
                  yesShares={marketData.yesShares}
                  noShares={marketData.noShares}
                />
              </div>
            )}

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                [Clock3, "活跃分析者", formatPoints(market.activeTraders)],
                [BarChart3, "成交积分", formatPoints(market.volumePoints)],
                [ShieldCheck, "流动性参数", formatPoints(market.liquidity)],
              ].map(([Icon, label, value]) => {
                const Component = Icon as typeof Clock3;
                return (
                  <div key={label as string} className="rounded-[1.1rem] border border-black/8 bg-white p-4">
                    <Component className="h-4.5 w-4.5 text-[var(--color-accent)]" />
                    <p className="mt-3 text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">{label as string}</p>
                    <p className="mt-1.5 text-[1.35rem] font-semibold text-[var(--color-ink)]">{value as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Probability history chart */}
          <ProbabilityChart slug={slug} status={market.status} />

          <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <NotebookPen className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">规则</p>
            </div>
            <div className="mt-4 space-y-3">
              {market.evidence.length > 0 ? (
                market.evidence.map((item, index) => (
                  <div key={item} className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                    <span className="mr-2 font-semibold text-[var(--color-accent)]">{index + 1}.</span>
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                  以公开来源和预设时间边界作为结算依据。
                </div>
              )}
              <div className="rounded-[1rem] border border-[rgba(29,78,216,0.22)] bg-[rgba(29,78,216,0.07)] px-4 py-3 text-[0.82rem] leading-6 text-[var(--color-ink)]">
                结算条件：到达锁盘时间后停止交易；以公开来源确认 YES / NO；若来源冲突且无法核验则按 VOID 处理。
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">结算依据</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {market.resolutionSource.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[1rem] border border-black/8 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-black/16"
                >
                  <p className="text-[1rem] font-semibold leading-6 text-[var(--color-ink)]">{source.label}</p>
                  <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-[color:var(--color-muted-ink)] group-hover:text-[var(--color-accent)]">
                    查看外部来源 <ArrowUpRight className="h-4 w-4" />
                  </p>
                </a>
              ))}
            </div>
          </div>

          {market.newsReferences.length > 0 ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">新闻参考</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {market.newsReferences.slice(0, 4).map((reference) => (
                  <a
                    key={`${reference.sourceName}:${reference.articleUrl}`}
                    href={reference.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1rem] border border-black/8 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-black/16"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">{reference.sourceName}</p>
                    <p className="mt-2 text-[0.92rem] font-semibold leading-6 text-[var(--color-ink)]">查看新闻原文</p>
                    <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-[color:var(--color-muted-ink)]">
                      打开外部依据 <ArrowUpRight className="h-4 w-4" />
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {relatedMarkets.length > 0 ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">相关事件</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {relatedMarkets.map((item) => (
                  <Link
                    key={item.id}
                    href={`/markets/${item.slug}`}
                    className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-3 rounded-[1rem] border border-black/8 bg-white px-3 py-3 transition hover:-translate-y-0.5 hover:border-black/16"
                  >
                    <div className="relative h-[4.6rem] overflow-hidden rounded-[0.8rem] border border-black/8 bg-[rgba(11,31,77,0.04)]">
                      <Image
                        src={item.imageUrl}
                        alt={item.question}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 text-[0.64rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
                        <span>{item.topicLabel}</span>
                        <span>{item.statusLabel}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[0.9rem] font-semibold leading-5 text-[var(--color-ink)]">
                        {item.question}
                      </p>
                      <p className="mt-1.5 text-[0.76rem] text-[color:var(--color-muted-ink)]">
                        YES {formatPercent(item.probability.yes)} · 锁盘 {formatDateLabel(item.closesAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          {/* Trade form */}
          <TradeForm
            slug={slug}
            userBalance={userBalance}
            isAuthenticated={!!session?.userId}
            isTradingOpen={isTradingOpen}
            yesProbability={market.probability.yes}
            noProbability={market.probability.no}
            availableShares={availableShares}
            resolution={
              market.resolution
                ? {
                    outcome: market.resolution.outcome,
                    sourceLabel: market.resolution.sourceLabel,
                    sourceUrl: market.resolution.sourceUrl,
                    rationale: market.resolution.rationale,
                  }
                : null
            }
          />

          <div className="rounded-[1.45rem] border border-black/10 bg-[var(--color-paper)] p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">Position Brief</p>
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <div className="rounded-[0.95rem] border border-black/8 bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">YES 持仓</p>
                <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(availableShares.YES)}</p>
              </div>
              <div className="rounded-[0.95rem] border border-black/8 bg-white px-3 py-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">NO 持仓</p>
                <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(availableShares.NO)}</p>
              </div>
            </div>
            <div className="mt-3 rounded-[1rem] border border-black/8 bg-[rgba(11,31,77,0.05)] p-3 text-[0.8rem] leading-5 text-[color:var(--color-muted-ink)]">
              <div className="flex items-center justify-between">
                <span>你的当前姿态</span>
                <span className="font-medium text-[var(--color-ink)]">{userOpenShares > 0 ? userBias : "尚未建仓"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>总持仓份额</span>
                <span className="font-medium text-[var(--color-ink)]">{formatPoints(userOpenShares)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>当前主导方向</span>
                <span className="font-medium text-[var(--color-ink)]">{dominantSide}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-black/10 bg-white p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">纠错与投诉</p>
            <p className="mt-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
              如发现题面、来源或结算结果存在问题，请联系
              {siteConfig.supportEmail ? (
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="ml-1 font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-deep)]"
                >
                  {siteConfig.supportEmail}
                </a>
              ) : (
                <span className="ml-1 font-medium text-[var(--color-ink)]">运营邮箱</span>
              )}
              。
            </p>
          </div>

        </aside>
      </div>
    </SiteShell>
  );
}
