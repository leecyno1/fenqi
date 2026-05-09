import { ArrowRight, BookOpen, ChartNoAxesCombined, CircleAlert, Clock3, DatabaseZap, Radar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { HomeMarketFeed } from "@/components/home-market-feed";
import { MiniChart } from "@/components/mini-chart";
import { SiteShell } from "@/components/site-shell";
import { ShellPanel } from "@/components/shell-panel";
import {
  excludeMarketsFromHomeSections,
  selectHomeFeaturedMarkets,
} from "@/lib/data/home-feed";
import { getHomeEventSections, getLeaderboardEntries } from "@/lib/data/queries";
import { getContentOriginLabel } from "@/lib/data/views";
import { formatCompactNumber, formatDateLabel, formatPercent } from "@/lib/format";
import { getLatestSourceHealthReport } from "@/lib/integrations/source-health";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, leaderboard, sourceHealth] = await Promise.all([
    getHomeEventSections(),
    getLeaderboardEntries(),
    getLatestSourceHealthReport(),
  ]);
  const homepageEvents = Array.from(
    new Map(sections.flatMap((section) => section.markets).map((event) => [event.id, event])).values(),
  );
  const featuredMarkets = selectHomeFeaturedMarkets(sections, homepageEvents, 3);
  const featuredMarketIds = new Set(featuredMarkets.map((market) => market.id));
  const dedupedSections = excludeMarketsFromHomeSections(sections, featuredMarketIds, ["featured"]);
  const totalVolume = homepageEvents.reduce((sum, item) => sum + item.totalVolumePoints, 0);
  const activeTopics = new Set(homepageEvents.map((market) => market.topicKey)).size;
  const liveEvents = homepageEvents.filter((market) => market.status === "live").length;
  const freshExternalEvents = homepageEvents.filter(
    (market) => market.contentOrigin === "external_live" && market.freshnessStatus === "fresh",
  ).length;
  const localFillEvents = homepageEvents.filter((market) => market.contentOrigin === "local_curated").length;
  const topLeaderboard = leaderboard[0];
  const overviewItems = [
    [Radar, "可交易", `${liveEvents} 个`],
    [DatabaseZap, "新鲜外部", `${freshExternalEvents} 个`],
    [ChartNoAxesCombined, "模拟成交", formatCompactNumber(totalVolume)],
    [Clock3, "题材", `${activeTopics} 类`],
  ] as const;

  return (
    <SiteShell currentPath="/" hideHero>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] px-5 py-5 shadow-[var(--shadow-card)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">Live Market Sync</p>
            <h1 className="mt-1 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)] md:text-[2.35rem]">
              精选事件
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#event-feed"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-[0.8rem] font-medium text-white shadow-[0_12px_24px_rgba(230,76,46,0.24)] transition hover:bg-[var(--color-accent-deep)]"
            >
              浏览事件库 <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-glass-line)] bg-[var(--color-surface)] px-4 py-2.5 text-[0.8rem] font-medium text-[var(--color-ink)] shadow-[0_10px_20px_rgba(31,39,55,0.06)] transition hover:bg-[var(--color-surface-raised)]"
            >
              <BookOpen className="h-4 w-4" /> 规则
            </Link>
          </div>
        </div>

        <div className="rounded-[1.55rem] border border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] px-3 py-3 shadow-[0_10px_26px_rgba(31,39,55,0.05)] backdrop-blur-xl">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {overviewItems.map(([Icon, label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-[1.15rem] bg-[var(--color-chip)] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[0.74rem] text-[color:var(--color-muted-ink)]">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>{label}</span>
                </div>
                <span className="font-semibold text-[var(--color-ink)]">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-[1.15rem] bg-[var(--color-chip)] px-3 py-2.5 text-[0.74rem]">
              <span className="text-[color:var(--color-muted-ink)]">榜首</span>
              <span className="truncate font-semibold text-[var(--color-ink)]">
                {topLeaderboard ? `${topLeaderboard.name} · ${formatPercent(topLeaderboard.hitRate)}` : "暂无"}
              </span>
            </div>
          </div>
          {localFillEvents > 0 ? (
            <p className="mt-2 px-2.5 text-[0.68rem] text-[color:var(--color-muted-ink)]">
              外部热点不足 3 个时，已用本地策展补位 {localFillEvents} 个。
            </p>
          ) : null}
        </div>

        {featuredMarkets.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {featuredMarkets.slice(0, 3).map((market, index) => (
              <Link
                key={market.id}
                href={`/events/${market.slug}`}
                className="group grid min-h-[25rem] overflow-hidden rounded-[1.65rem] border border-[var(--color-glass-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[var(--color-surface-raised)] hover:shadow-[0_24px_48px_rgba(31,39,55,0.13)]"
              >
                <div className="relative h-36 border-b border-[var(--color-glass-line)] bg-[var(--color-panel-muted)]">
                  <Image
                    src={market.imageUrl}
                    alt={market.question}
                    fill
                    fetchPriority={index === 0 ? "high" : "low"}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[0.64rem] font-semibold text-white shadow-[0_10px_18px_rgba(230,76,46,0.24)]">
                    TOP {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex h-full flex-col p-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">
                      <span>{market.topicLabel}</span>
                      <span>{market.statusLabel}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 min-h-[3rem] text-[1.03rem] font-semibold leading-6 text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                      {market.question}
                    </h2>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[0.78rem] leading-5 text-[color:var(--color-muted-ink)]">
                      {market.brief}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 rounded-[1.15rem] bg-[rgba(245,246,248,0.78)] px-3 py-2">
                    <div>
                      <p className="text-[0.56rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">YES</p>
                      <p className="mt-1 text-[1.15rem] font-semibold leading-none text-[var(--color-accent-deep)]">
                        {formatPercent(market.probability.yes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.56rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">成交</p>
                      <p className="mt-1 text-[0.9rem] font-semibold text-[var(--color-ink)]">
                        {formatCompactNumber(market.totalVolumePoints)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.56rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">锁盘</p>
                      <p className="mt-1 text-[0.9rem] font-semibold text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="h-8 overflow-hidden rounded-full">
                      <MiniChart slug={market.primaryChildMarket.slug} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[0.72rem] text-[color:var(--color-muted-ink)]">
                      <span className="truncate">{getContentOriginLabel(market.contentOrigin)}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-chip)] px-3 py-1.5 font-medium text-[var(--color-accent-deep)] shadow-[0_8px_16px_rgba(31,39,55,0.05)]">
                        详情 <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <ShellPanel className="overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-[rgba(198,40,40,0.28)] bg-[rgba(198,40,40,0.08)] p-2 text-[var(--color-secondary-deep)]">
                    <CircleAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-secondary-deep)]">Live Source Required</p>
                    <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[var(--color-ink)] md:text-[1.8rem]">
                      真实事件库还没有可上首页的数据
                    </h2>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-[0.88rem] leading-7 text-[color:var(--color-muted-ink)]">
                  当前不会再用示例样本或过期题面填充首页。首页只展示可交易、未过期、来源可核验的外部事件；最近一次源探针显示外部数据源不可达，所以目录同步没有产生可发布事件。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[0.8rem] font-medium text-white transition hover:bg-[var(--color-accent-deep)]"
                  >
                    打开后台刷新源 <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/api/health/sources"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-[0.8rem] font-medium text-[var(--color-ink)] transition hover:border-[rgba(198,40,40,0.28)]"
                  >
                    实时源诊断
                  </Link>
                </div>
              </div>
              <div className="border-t border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4 lg:border-l lg:border-t-0 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-accent)]">源状态</p>
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-2.5 py-1 text-[0.66rem] text-[color:var(--color-muted-ink)]">
                    {sourceHealth.stale ? "stale" : "fresh"}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {sourceHealth.sources.map((source) => (
                    <div key={source.name} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.78rem] font-semibold text-[var(--color-ink)]">{source.label}</p>
                          <p className="mt-0.5 text-[0.66rem] text-[color:var(--color-muted-ink)]">{source.role} / {source.latencyMs}ms</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[0.62rem] uppercase tracking-[0.14em] ${
                            source.status === "ok"
                              ? "bg-[rgba(29,78,216,0.08)] text-[var(--color-accent-deep)]"
                              : "bg-[rgba(198,40,40,0.08)] text-[var(--color-secondary-deep)]"
                          }`}
                        >
                          {source.status}
                        </span>
                      </div>
                      {source.error ? (
                        <p className="mt-1.5 line-clamp-2 text-[0.68rem] leading-5 text-[var(--color-secondary-deep)]">{source.error}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ShellPanel>
        )}
      </section>

      {homepageEvents.length > 0 ? <HomeMarketFeed sections={dedupedSections} /> : null}
    </SiteShell>
  );
}
