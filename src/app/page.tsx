import { ArrowRight, ChartNoAxesCombined, Orbit, Radar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { HomeMarketFeed } from "@/components/home-market-feed";
import { MiniChart } from "@/components/mini-chart";
import { SiteShell } from "@/components/site-shell";
import { excludeMarketsFromHomeSections, selectHomeFeaturedMarkets } from "@/lib/data/home-feed";
import { getHomeEventSections, getLeaderboardEntries } from "@/lib/data/queries";
import { getContentOriginLabel } from "@/lib/data/views";
import { formatCompactNumber, formatDateLabel, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, leaderboard] = await Promise.all([
    getHomeEventSections(),
    getLeaderboardEntries(),
  ]);
  const homepageEvents = Array.from(
    new Map(
      sections.flatMap((section) => section.markets).map((event) => [event.id, event]),
    ).values(),
  );
  const featuredMarkets = selectHomeFeaturedMarkets(sections, homepageEvents, 3);
  const featuredMarketIds = new Set(featuredMarkets.map((market) => market.id));
  const dedupedSections = excludeMarketsFromHomeSections(sections, featuredMarketIds, ["featured"]);
  const totalVolume = homepageEvents.reduce((sum, item) => sum + item.totalVolumePoints, 0);
  const activeTopics = new Set(homepageEvents.map((market) => market.topicKey)).size;

  return (
    <SiteShell currentPath="/">
      {featuredMarkets.length > 0 ? (
        <>
          <section className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredMarkets.map((market, index) => (
                <Link
                  key={market.id}
                  href={`/events/${market.slug}`}
                  className="group block min-h-[22rem] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_14px_36px_rgba(11,31,77,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(11,31,77,0.14)]"
                >
                  <div className="grid h-full grid-cols-[42%_58%]">
                    <div className="grid border-r border-[var(--color-line)] bg-[rgba(11,31,77,0.04)]">
                      <div className="relative min-h-[14rem]">
                        <Image
                          src={market.imageUrl}
                          alt={market.question}
                          fill
                          sizes="(max-width: 1024px) 100vw, 360px"
                          className="object-cover"
                        />
                      </div>
                      <div className="border-t border-[rgba(11,31,77,0.12)] bg-[rgba(246,248,252,0.96)] px-3 py-2">
                        <p className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-muted-ink)]">
                          timeline / 7d
                        </p>
                        <div className="mt-1.5 h-11">
                          <MiniChart slug={market.primaryChildMarket.slug} />
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col p-3.5 lg:p-4">
                      <div className="flex items-center justify-between gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">
                        <span className="rounded-full border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-2.5 py-1 text-[var(--color-accent-deep)]">
                          事件 {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="rounded-full border border-[rgba(198,40,40,0.28)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">
                          {market.statusLabel}
                        </span>
                      </div>

                      <h2 className="mt-3 line-clamp-2 text-[1.12rem] leading-[1.08] font-semibold text-[var(--color-ink)] xl:text-[1.18rem]">
                        {market.question}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-5 text-[color:var(--color-muted-ink)]">{market.brief}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.64rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">
                        <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">
                          {getContentOriginLabel(market.contentOrigin)}
                        </span>
                        {market.lastUpdatedAt ? (
                          <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">
                            更新 {formatDateLabel(market.lastUpdatedAt)}
                          </span>
                        ) : null}
                        {market.freshnessStatus !== "fresh" ? (
                          <span className="rounded-full border border-[rgba(198,40,40,0.28)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">
                            数据较旧
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-[0.95rem] border border-[rgba(29,78,216,0.2)] bg-[rgba(29,78,216,0.06)] px-3 py-2">
                          <p className="font-display text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-muted-ink)]">YES</p>
                          <p className="mt-1 font-display text-[1.6rem] leading-none text-[var(--color-accent-deep)]">
                            {formatPercent(market.probability.yes)}
                          </p>
                        </div>
                        <div className="rounded-[0.95rem] border border-[rgba(244,180,0,0.34)] bg-[rgba(244,180,0,0.12)] px-3 py-2">
                          <p className="font-display text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-muted-ink)]">VOL</p>
                          <p className="mt-1 font-display text-[1.2rem] leading-none text-[var(--color-ink)]">
                            {formatCompactNumber(market.totalVolumePoints)}
                          </p>
                        </div>
                        <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2">
                          <p className="font-display text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-muted-ink)]">TOPIC</p>
                          <p className="mt-1 truncate text-[0.9rem] font-medium text-[var(--color-ink)]">{market.topicLabel}</p>
                        </div>
                        <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2">
                          <p className="font-display text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-muted-ink)]">CLOSE</p>
                          <p className="mt-1 text-[0.9rem] font-medium text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(29,78,216,0.34)] bg-[var(--color-accent)] px-3.5 py-2 text-[0.82rem] font-medium text-white transition group-hover:bg-[var(--color-accent-deep)]">
                          进入详情 <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid gap-0 overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] md:grid-cols-3">
              {[
                { icon: Radar, label: "事件总数", value: `${homepageEvents.length} 个`, tone: "bg-white text-[var(--color-ink)]" },
                { icon: Orbit, label: "活跃题材", value: `${activeTopics} 类`, tone: "bg-[var(--color-secondary)] text-white" },
                { icon: ChartNoAxesCombined, label: "模拟成交积分", value: formatCompactNumber(totalVolume), tone: "bg-[var(--color-accent-deep)] text-white" },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between gap-3 px-5 py-4 ${item.tone}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="font-display text-[0.92rem] uppercase tracking-[0.14em]">{item.label}</span>
                  </div>
                  <span className="font-display text-[1.55rem] leading-none">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <HomeMarketFeed sections={dedupedSections} />
        </>
      ) : (
        <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-paper)] p-10 text-center shadow-[0_14px_36px_rgba(11,31,77,0.08)]">
          <p className="font-display text-3xl tracking-tight text-[var(--color-ink)]">还没有已发布市场</p>
          <p className="mt-4 text-sm text-[color:var(--color-muted-ink)]">先通过后台创建市场并完成发布，首页会自动切到真实数据库数据。</p>
        </section>
      )}

      <section className="mt-10 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-accent-deep)] p-4 text-white shadow-[0_16px_34px_rgba(11,31,77,0.2)] md:p-5">
        <aside>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.34em] text-white/76">活跃参与者</p>
            <Link href="/leaderboard" className="text-[0.76rem] text-white/86 transition hover:text-white">
              全部
            </Link>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {leaderboard.slice(0, 4).map((item) => (
              <div key={item.rank} className="rounded-[0.95rem] border border-white/16 bg-white/10 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-[0.68rem] text-white/72">#{item.rank}</p>
                    <p className="mt-0.5 text-[0.96rem] font-semibold leading-5">{item.name}</p>
                  </div>
                  <p className="text-right text-[0.68rem] text-white/80">命中率 {formatPercent(item.hitRate)}</p>
                </div>
                <p className="mt-1 text-[0.76rem] leading-5 text-white/72">{item.title}</p>
              </div>
            ))}
          </div>
          <Link href="/leaderboard" className="mt-3 inline-flex items-center gap-2 text-[0.82rem] text-white/90 transition hover:text-white">
            查看完整榜单 <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>
    </SiteShell>
  );
}
