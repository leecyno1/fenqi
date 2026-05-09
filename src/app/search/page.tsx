import Link from "next/link";

import { EventGrid } from "@/components/event-grid";
import { SiteShell } from "@/components/site-shell";
import { PageIntro, ShellPanel } from "@/components/shell-panel";
import { searchEventListItems } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const events = await searchEventListItems(query);

  return (
    <SiteShell currentPath="/search" hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Search"
          title="搜索事件"
          description="输入资产、人物、赛事或政策关键词，直接定位可交易事件。"
          meta={[{ label: "结果", value: `${events.length} 个` }]}
        />
        <ShellPanel className="p-4 md:p-5" tone="soft">
          <form className="flex flex-col gap-2 md:flex-row" action="/search">
            <input
              name="q"
              defaultValue={query}
              placeholder="搜索比特币、美联储、詹姆斯、AI、内娱"
              className="min-h-11 flex-1 rounded-full border border-[var(--color-line)] bg-white px-4 text-[0.86rem] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(29,78,216,0.16)]"
            />
            <button className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-[0.82rem] font-medium text-white hover:bg-[var(--color-accent-deep)]">
              搜索
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 text-[0.76rem]">
            {["比特币", "美联储", "AI", "体育", "内娱"].map((term) => (
              <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[var(--color-ink)] hover:border-[rgba(29,78,216,0.32)]">
                {term}
              </Link>
            ))}
          </div>
        </ShellPanel>
        <EventGrid events={events} emptyText={query ? "没有匹配事件。" : "输入关键词开始搜索。"} />
      </section>
    </SiteShell>
  );
}
