import { notFound } from "next/navigation";

import { EventGrid } from "@/components/event-grid";
import { SiteShell } from "@/components/site-shell";
import { PageIntro } from "@/components/shell-panel";
import { getTopicEventListItems } from "@/lib/data/queries";
import type { MarketTopicKey } from "@/lib/data/views";

export const dynamic = "force-dynamic";

const topics: Record<MarketTopicKey, { title: string; description: string }> = {
  politics: { title: "Politics", description: "政策、选举、政府谈判相关事件。" },
  world: { title: "World", description: "国际局势、区域风险与全球新闻事件。" },
  sports: { title: "Sports", description: "赛事结果、球员表现与体育热点。" },
  crypto: { title: "Crypto", description: "加密资产价格、ETF、监管与链上叙事。" },
  finance: { title: "Finance", description: "利率、宏观、财报与资产定价路径。" },
  tech: { title: "Tech", description: "AI、硬件、平台与产品发布事件。" },
  culture: { title: "Culture", description: "影视综、奖项、票房与公开榜单事件。" },
};

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in topics)) {
    notFound();
  }

  const topicKey = slug as MarketTopicKey;
  const topic = topics[topicKey];
  const events = await getTopicEventListItems(topicKey);

  return (
    <SiteShell currentPath={`/topics/${slug}`} hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Topic"
          title={topic.title}
          description={topic.description}
          meta={[{ label: "事件", value: `${events.length} 个` }]}
        />
        <EventGrid events={events} emptyText="这个题材下暂时没有可展示事件。" />
      </section>
    </SiteShell>
  );
}
