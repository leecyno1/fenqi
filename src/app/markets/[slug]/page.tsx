import { ArrowUpRight, BarChart3, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { MarketDepthBar } from "@/components/market-depth-bar";
import { ProbabilityBar } from "@/components/probability-bar";
import { ProbabilityChart } from "@/components/probability-chart";
import { SiteShell } from "@/components/site-shell";
import { PageIntro, ShellPanel } from "@/components/shell-panel";
import { TradeForm } from "@/components/trade-form";
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
    availableShares.YES === availableShares.NO ? "中性" : availableShares.YES > availableShares.NO ? "偏 YES" : "偏 NO";
  const isTradingOpen = market.status === "live" && market.closesAt > new Date();
  const [allMarkets, history24h] = await Promise.all([getMarketListItems(), getMarketPriceHistory(slug, "24h")]);
  const relatedMarkets = allMarkets
    .filter((item) => item.slug !== market.slug && item.topicKey === market.topicKey)
    .sort((left, right) => right.featuredScore - left.featuredScore)
    .slice(0, 3);
  const historyFirst = history24h?.[0];
  const historyLast = history24h?.at(-1);
  const yesChange24h = historyFirst && historyLast ? historyLast.yesProbability - historyFirst.yesProbability : 0;
  const yesChange24hLabel = `${yesChange24h >= 0 ? "+" : "-"}${formatPercent(Math.abs(yesChange24h))}`;

  return (
    <SiteShell currentPath="/" hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Market Deep Link"
          title={market.question}
          description="这是兼容深链视图，只保留单市场执行所需的信息。证据边界、相关新闻、规则与多子市场切换统一回到事件页完成。"
          meta={[
            { label: "分类", value: market.categoryLabel },
            { label: "锁盘", value: formatDateLabel(market.closesAt) },
            { label: "结算", value: formatDateLabel(market.resolvesAt) },
          ]}
          actions={
            market.parentEvent ? (
              <Link
                href={`/events/${market.parentEvent.slug}?market=${market.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-[0.82rem] font-medium text-white transition hover:bg-[var(--color-accent-deep)]"
              >
                返回事件全貌 <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <ShellPanel className="p-5 md:p-6" tone="soft">
              <div className="flex flex-wrap items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
                <span>{market.statusLabel}</span>
                <span className="h-1 w-1 rounded-full bg-black/20" />
                <span>来源 {market.sourceName ?? "本地事件池"}</span>
                {market.externalReference ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-black/20" />
                    <a
                      href={market.externalReference.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-deep)]"
                    >
                      {market.externalReference.label} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
                <div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["YES", formatPercent(market.probability.yes), "blue"],
                      ["NO", formatPercent(market.probability.no), "white"],
                      ["24H", yesChange24hLabel, "white"],
                      ["成交", formatPoints(market.volumePoints), "white"],
                    ].map(([label, value, tone]) => (
                      <div
                        key={label as string}
                        className={
                          tone === "blue"
                            ? "rounded-[1rem] border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-3.5 py-3"
                            : "rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3"
                        }
                      >
                        <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">{label as string}</p>
                        <p className="mt-1.5 text-[1.2rem] font-semibold text-[var(--color-ink)]">{value as string}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.2rem] border border-[var(--color-line)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3 text-[0.74rem] text-[color:var(--color-muted-ink)]">
                      <span>主导方向 {dominantSide}</span>
                      <span>差值 {formatPercent(probabilityGap)}</span>
                    </div>
                    <ProbabilityBar className="mt-3 h-3.5" yes={market.probability.yes} no={market.probability.no} />
                    <div className="mt-4 h-[18rem]">
                      <ProbabilityChart slug={slug} status={market.status} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[1rem] border border-[rgba(198,40,40,0.16)] bg-[rgba(198,40,40,0.08)] px-4 py-3.5">
                    <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[var(--color-secondary-deep)]">兼容视图说明</p>
                    <p className="mt-2 text-[0.82rem] leading-6 text-[var(--color-ink)]">
                      只展示单市场执行信息，不再复制整套事件详情。
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3.5">
                    <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">事件背景</p>
                    <p className="mt-2 text-[0.82rem] leading-6 text-[var(--color-ink)]">{market.tone}</p>
                  </div>
                  <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3.5 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
                    <div className="flex items-center justify-between">
                      <span>交易状态</span>
                      <span className="font-medium text-[var(--color-ink)]">{isTradingOpen ? "开放中" : "已停止"}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>市场总份额</span>
                      <span className="font-medium text-[var(--color-ink)]">{formatPoints(totalMarketShares)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>流动性</span>
                      <span className="font-medium text-[var(--color-ink)]">{formatPoints(market.liquidity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ShellPanel>

            {marketData ? (
              <ShellPanel className="p-5 md:p-6">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">市场分歧分布</p>
                <div className="mt-4">
                  <MarketDepthBar yesShares={marketData.yesShares} noShares={marketData.noShares} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    [Clock3, "活跃分析者", formatPoints(market.activeTraders)],
                    [BarChart3, "成交积分", formatPoints(market.volumePoints)],
                    [ShieldCheck, "流动性参数", formatPoints(market.liquidity)],
                  ].map(([Icon, label, value]) => {
                    const Component = Icon as typeof Clock3;
                    return (
                      <div key={label as string} className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
                        <Component className="h-4.5 w-4.5 text-[var(--color-accent)]" />
                        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">{label as string}</p>
                        <p className="mt-1.5 text-[1.25rem] font-semibold text-[var(--color-ink)]">{value as string}</p>
                      </div>
                    );
                  })}
                </div>
              </ShellPanel>
            ) : null}

            <ShellPanel className="p-5 md:p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">结算与参考</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {market.resolutionSource.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(29,78,216,0.22)]"
                  >
                    <p className="text-[1rem] font-semibold leading-6 text-[var(--color-ink)]">{source.label}</p>
                    <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-[color:var(--color-muted-ink)]">
                      查看外部来源 <ArrowUpRight className="h-4 w-4" />
                    </p>
                  </a>
                ))}
                {market.newsReferences.slice(0, 2).map((reference) => (
                  <a
                    key={`${reference.sourceName}:${reference.articleUrl}`}
                    href={reference.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(198,40,40,0.22)]"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">{reference.sourceName}</p>
                    <p className="mt-2 text-[0.92rem] font-semibold leading-6 text-[var(--color-ink)]">查看新闻原文</p>
                  </a>
                ))}
              </div>
            </ShellPanel>

            {relatedMarkets.length > 0 ? (
              <ShellPanel className="p-5 md:p-6" tone="soft">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">同题材深链</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {relatedMarkets.map((item) => (
                    <Link
                      key={item.id}
                      href={`/markets/${item.slug}`}
                      className="rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[rgba(29,78,216,0.22)]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
                        <span>{item.topicLabel}</span>
                        <span>{item.statusLabel}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[0.88rem] font-semibold leading-6 text-[var(--color-ink)]">{item.question}</p>
                      <p className="mt-2 text-[0.76rem] text-[color:var(--color-muted-ink)]">YES {formatPercent(item.probability.yes)}</p>
                    </Link>
                  ))}
                </div>
              </ShellPanel>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
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

            <ShellPanel className="p-4" tone="soft">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">Position Brief</p>
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">YES 持仓</p>
                  <p className="mt-1.5 text-[1.25rem] font-semibold text-[var(--color-ink)]">{formatPoints(availableShares.YES)}</p>
                </div>
                <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">NO 持仓</p>
                  <p className="mt-1.5 text-[1.25rem] font-semibold text-[var(--color-ink)]">{formatPoints(availableShares.NO)}</p>
                </div>
              </div>
              <div className="mt-3 rounded-[1rem] border border-[var(--color-line)] bg-white px-3 py-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
                <div className="flex items-center justify-between">
                  <span>你的当前姿态</span>
                  <span className="font-medium text-[var(--color-ink)]">{userOpenShares > 0 ? userBias : "尚未建仓"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>总持仓份额</span>
                  <span className="font-medium text-[var(--color-ink)]">{formatPoints(userOpenShares)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>当前主导方向</span>
                  <span className="font-medium text-[var(--color-ink)]">{dominantSide}</span>
                </div>
              </div>
            </ShellPanel>

            <ShellPanel className="p-4">
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
            </ShellPanel>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
