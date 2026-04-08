import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { EventDetailPanel } from "@/components/event-detail-panel";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/db/client";
import { virtualWallets } from "@/db/schema";
import { getOptionalSession } from "@/lib/auth/session";
import { getEventDetailViewBySlug, getEventListItems } from "@/lib/data/queries";

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
    <SiteShell currentPath="/">
      <EventDetailPanel
        event={event}
        userBalance={wallet?.balance ?? null}
        isAuthenticated={Boolean(session?.userId)}
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
            背景与规则
          </p>
          <p className="mt-4 text-[0.84rem] leading-6 text-[var(--color-ink)]">{event.tone}</p>
          <div className="mt-4 space-y-3">
            {event.evidence.map((item, index) => (
              <div key={item} className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                <span className="mr-2 font-semibold text-[var(--color-accent)]">{index + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
            来源与相关新闻
          </p>
          <div className="mt-4 grid gap-3">
            {event.resolutionSource.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-[1rem] border border-black/8 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-black/16"
              >
                <div>
                  <p className="text-[0.84rem] font-semibold text-[var(--color-ink)]">{source.label}</p>
                  <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted-ink)]">{source.href}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-accent)]" />
              </a>
            ))}
            {event.newsReferences.slice(0, 3).map((reference) => (
              <a
                key={`${reference.sourceName}:${reference.articleUrl}`}
                href={reference.articleUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-[1rem] border border-black/8 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-black/16"
              >
                <div>
                  <p className="text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">{reference.sourceName}</p>
                  <p className="mt-1 text-[0.84rem] font-semibold text-[var(--color-ink)]">查看新闻原文</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-accent)]" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {relatedEvents.length > 0 ? (
        <section className="mt-4 rounded-[1.8rem] border border-black/10 bg-[var(--color-paper)] p-5 md:p-6">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
            相关事件
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relatedEvents.map((item) => (
              <Link
                key={item.id}
                href={`/events/${item.slug}`}
                className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-3 rounded-[1rem] border border-black/8 bg-white px-3 py-3 transition hover:-translate-y-0.5 hover:border-black/16"
              >
                <div className="relative h-[4.6rem] overflow-hidden rounded-[0.8rem] border border-black/8 bg-[rgba(11,31,77,0.04)]">
                  <Image src={item.imageUrl} alt={item.question} fill className="object-cover" sizes="72px" />
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
                    YES {Math.round(item.probability.yes * 100)}% · {item.primaryChildMarket.answerLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
