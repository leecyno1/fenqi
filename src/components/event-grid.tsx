import { MarketCard } from "@/components/market-card";
import type { EventListItem } from "@/lib/data/views";

export function EventGrid({ events, emptyText }: { events: EventListItem[]; emptyText: string }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-white px-5 py-10 text-center text-[0.9rem] text-[color:var(--color-muted-ink)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {events.map((event) => (
        <MarketCard
          key={event.id}
          market={{
            ...event,
            href: `/events/${event.slug}`,
            chartSlug: event.primaryChildMarket.slug,
          }}
        />
      ))}
    </div>
  );
}
