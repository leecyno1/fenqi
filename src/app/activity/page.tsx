import { EventGrid } from "@/components/event-grid";
import { SiteShell } from "@/components/site-shell";
import { PageIntro } from "@/components/shell-panel";
import { getActivityEventListItems } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const events = await getActivityEventListItems();

  return (
    <SiteShell currentPath="/activity" hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Activity"
          title="最新动态"
          description="按最近更新排序，快速检查盘口、来源和锁盘时间。"
          meta={[{ label: "事件", value: `${events.length} 个` }]}
        />
        <EventGrid events={events} emptyText="暂时没有动态。" />
      </section>
    </SiteShell>
  );
}
