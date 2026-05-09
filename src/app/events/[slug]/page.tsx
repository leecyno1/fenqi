import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { EventDetailPanel } from "@/components/event-detail-panel";
import { SiteShell } from "@/components/site-shell";
import { ShellPanel } from "@/components/shell-panel";
import { db } from "@/db/client";
import { virtualWallets } from "@/db/schema";
import { getOptionalSession } from "@/lib/auth/session";
import { getEventDetailViewBySlug, getEventListItems } from "@/lib/data/queries";
import { formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ market?: string }>;
}) {
  const [{ slug }, { market: selectedMarketSlug }, session] = await Promise.all([
    params,
    searchParams,
    getOptionalSession(),
  ]);
  const [event, allEvents] = await Promise.all([
    getEventDetailViewBySlug(slug, session?.userId, selectedMarketSlug),
    getEventListItems(),
  ]);

  if (!event) {
    notFound();
  }

  const [wallet] =
    session?.userId
      ? await db
          .select({ balance: virtualWallets.balance })
          .from(virtualWallets)
          .where(eq(virtualWallets.userId, session.userId))
          .limit(1)
      : [];

  const relatedEvents = allEvents
    .filter((item) => item.id !== event.id && item.topicKey === event.topicKey)
    .sort((left, right) => right.featuredScore - left.featuredScore)
    .slice(0, 4);

  return (
    <SiteShell currentPath="/" hideHero>
      {selectedMarketSlug ? (
        <ShellPanel className="mb-4 px-4 py-3" tone="soft">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">
              你通过市场深链进入，当前已自动定位到对应子市场。完整证据、相关新闻与规则统一收敛在事件页处理。
            </p>
            <Link
              href={`/markets/${selectedMarketSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-[0.78rem] font-medium text-[var(--color-ink)] transition hover:border-[rgba(29,78,216,0.3)]"
            >
              查看兼容市场页 <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </ShellPanel>
      ) : null}

      <EventDetailPanel
        event={event}
        userBalance={wallet?.balance ?? null}
        isAuthenticated={Boolean(session?.userId)}
      />

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_22rem]">
        <div className="space-y-4">
          <ShellPanel className="p-5 md:p-6">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">证据边界</p>
            <p className="mt-4 text-[0.88rem] leading-7 text-[var(--color-ink)]">{event.tone}</p>
            <div className="mt-4 grid gap-3">
              {event.evidence.map((item, index) => (
                <div key={item} className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                  <span className="mr-2 font-semibold text-[var(--color-accent)]">{index + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </ShellPanel>

          <ShellPanel className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">来源与相关新闻</p>
              <p className="text-[0.78rem] text-[color:var(--color-muted-ink)]">以公开来源作为最终结算依据</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {event.resolutionSource.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(29,78,216,0.22)]"
                >
                  <div>
                    <p className="text-[0.84rem] font-semibold text-[var(--color-ink)]">{source.label}</p>
                    <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted-ink)]">{source.href}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-accent)]" />
                </a>
              ))}
              {event.newsReferences.slice(0, 4).map((reference) => (
                <a
                  key={`${reference.sourceName}:${reference.articleUrl}`}
                  href={reference.articleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(198,40,40,0.2)]"
                >
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">{reference.sourceName}</p>
                    <p className="mt-1 text-[0.84rem] font-semibold text-[var(--color-ink)]">查看新闻原文</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-accent)]" />
                </a>
              ))}
            </div>
          </ShellPanel>
        </div>

        <ShellPanel className="p-4 md:p-5" tone="soft">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">详情原则</p>
          <div className="mt-4 space-y-3 text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3">
              主详情页只保留一个：事件页。所有子市场共享证据边界、结算来源和新闻上下文。
            </div>
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3">
              当单市场被深链直达时，市场页只提供兼容视图，并明确引导回事件页完成判断。
            </div>
            <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3">
              当前子市场 YES 概率 {formatPercent(event.selectedChildMarket.probability.yes)}，但最终判断必须结合证据与时间边界。
            </div>
          </div>
        </ShellPanel>
      </section>

      {relatedEvents.length > 0 ? (
        <ShellPanel className="mt-4 p-5 md:p-6">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">相关事件</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relatedEvents.map((item) => (
              <Link
                key={item.id}
                href={`/events/${item.slug}`}
                className="grid grid-cols-[4.8rem_minmax(0,1fr)] gap-3 rounded-[1rem] border border-[var(--color-line)] bg-white px-3 py-3 transition hover:-translate-y-0.5 hover:border-[rgba(29,78,216,0.22)]"
              >
                <div className="relative h-[4.8rem] overflow-hidden rounded-[0.8rem] border border-[rgba(11,31,77,0.08)] bg-[rgba(11,31,77,0.04)]">
                  <Image src={item.imageUrl} alt={item.question} fill className="object-cover" sizes="76px" />
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
                    YES {formatPercent(item.probability.yes)} · {item.primaryChildMarket.answerLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ShellPanel>
      ) : null}
    </SiteShell>
  );
}
