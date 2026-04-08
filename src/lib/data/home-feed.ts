import type { HomeEventSection, HomeMarketSection, MarketTopicKey } from "@/lib/data/views";

type FeedItem = HomeMarketSection["markets"][number] | HomeEventSection["markets"][number];
type FeedSection<T extends FeedItem = FeedItem> = {
  key: HomeEventSection["key"];
  title: string;
  description: string;
  markets: T[];
};

export type HomeFeedTopic = "all" | MarketTopicKey;
export type HomeFeedSort = "featured" | "closing" | "volume";
export type HomeFeedStatus = "all" | "live" | "locked" | "review" | "terminal";
export type HomeFeedControls = {
  topic: HomeFeedTopic;
  sort: HomeFeedSort;
  status: HomeFeedStatus;
  query: string;
};
export type HomeFeedSectionNavItem = {
  key: FeedSection["key"];
  title: string;
  anchorId: string;
};
type HomeFeedControlPatch = Partial<HomeFeedControls>;
type SearchParamsLike = Pick<URLSearchParams, "get">;

export const defaultHomeFeedControls: HomeFeedControls = {
  topic: "all",
  sort: "featured",
  status: "all",
  query: "",
};

export const homeFeedTopicOptions: Array<{ value: HomeFeedTopic; label: string }> = [
  { value: "all", label: "全部" },
  { value: "politics", label: "Politics" },
  { value: "world", label: "World" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "tech", label: "Tech" },
  { value: "culture", label: "Culture" },
];

export const homeFeedSortOptions: Array<{ value: HomeFeedSort; label: string; hint: string }> = [
  { value: "featured", label: "推荐排序", hint: "按关注度与市场强度优先" },
  { value: "closing", label: "临近锁盘", hint: "按收盘时间从近到远" },
  { value: "volume", label: "成交热度", hint: "按模拟成交积分从高到低" },
];

export const homeFeedStatusOptions: Array<{ value: HomeFeedStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "live", label: "进行中" },
  { value: "locked", label: "锁盘中" },
  { value: "review", label: "待审核" },
  { value: "terminal", label: "已终态" },
];
export const homeFeedSectionPreviewCount = 4;

export function selectHomeFeaturedMarkets<T extends FeedItem>(
  sections: FeedSection<T>[],
  fallbackMarkets: T[],
  count = 3,
) {
  const featured = sections.find((section) => section.key === "featured")?.markets ?? [];
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set<MarketTopicKey>();
  const sources = [featured, fallbackMarkets];

  for (const markets of sources) {
    for (const market of markets) {
      if (selected.length >= count) {
        break;
      }

      if (selectedIds.has(market.id) || selectedTopics.has(market.topicKey)) {
        continue;
      }

      selected.push(market);
      selectedIds.add(market.id);
      selectedTopics.add(market.topicKey);
    }
  }

  for (const markets of sources) {
    for (const market of markets) {
      if (selected.length >= count) {
        break;
      }

      if (selectedIds.has(market.id)) {
        continue;
      }

      selected.push(market);
      selectedIds.add(market.id);
    }
  }

  return selected;
}

export function excludeMarketsFromHomeSections<T extends FeedItem>(
  sections: FeedSection<T>[],
  excludedIds: Set<string>,
  sectionKeys?: FeedSection["key"][],
): FeedSection<T>[] {
  if (excludedIds.size === 0) {
    return sections;
  }

  const scopedKeys = sectionKeys ? new Set(sectionKeys) : null;

  return sections
    .map((section) => ({
      ...section,
      markets:
        scopedKeys && !scopedKeys.has(section.key)
          ? section.markets
          : section.markets.filter((market) => !excludedIds.has(market.id)),
    }))
    .filter((section) => section.markets.length > 0);
}

function compareMarkets(sort: HomeFeedSort) {
  return (left: FeedItem, right: FeedItem) => {
    if (sort === "closing") {
      return (
        left.closesAt.getTime() - right.closesAt.getTime() ||
        right.featuredScore - left.featuredScore ||
        right.volumePoints - left.volumePoints
      );
    }

    if (sort === "volume") {
      return (
        right.volumePoints - left.volumePoints ||
        right.activeTraders - left.activeTraders ||
        right.featuredScore - left.featuredScore
      );
    }

    return (
      right.featuredScore - left.featuredScore ||
      right.volumePoints - left.volumePoints ||
      left.closesAt.getTime() - right.closesAt.getTime()
    );
  };
}

function matchesStatus(
  market: FeedItem,
  status: HomeFeedStatus,
) {
  if (status === "all") {
    return true;
  }

  if (status === "terminal") {
    return market.status === "resolved" || market.status === "voided";
  }

  return market.status === status;
}

function matchesQuery(
  market: FeedItem,
  query: string,
) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [market.question, market.brief].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function filterAndSortHomeSections<T extends FeedItem>(
  sections: FeedSection<T>[],
  controls: HomeFeedControlPatch,
): FeedSection<T>[] {
  const resolvedControls = {
    ...defaultHomeFeedControls,
    ...controls,
  };
  const sorter = compareMarkets(resolvedControls.sort);

  return sections
    .map((section) => ({
      ...section,
      markets: section.markets
        .filter((market) => resolvedControls.topic === "all" || market.topicKey === resolvedControls.topic)
        .filter((market) => matchesStatus(market, resolvedControls.status))
        .filter((market) => matchesQuery(market, resolvedControls.query))
        .sort(sorter),
    }))
    .filter((section) => section.markets.length > 0);
}

function isHomeFeedTopic(value: string | null): value is HomeFeedTopic {
  return homeFeedTopicOptions.some((option) => option.value === value);
}

function isHomeFeedSort(value: string | null): value is HomeFeedSort {
  return homeFeedSortOptions.some((option) => option.value === value);
}

function isHomeFeedStatus(value: string | null): value is HomeFeedStatus {
  return homeFeedStatusOptions.some((option) => option.value === value);
}

export function parseHomeFeedSearchParams(
  searchParams: SearchParamsLike,
): HomeFeedControls {
  const topic = searchParams.get("topic");
  const sort = searchParams.get("sort");
  const status = searchParams.get("status");
  const query = searchParams.get("query");

  return {
    topic: isHomeFeedTopic(topic) ? topic : defaultHomeFeedControls.topic,
    sort: isHomeFeedSort(sort) ? sort : defaultHomeFeedControls.sort,
    status: isHomeFeedStatus(status) ? status : defaultHomeFeedControls.status,
    query: query?.trim() ?? defaultHomeFeedControls.query,
  };
}

export function buildHomeFeedSearch(controls: HomeFeedControls) {
  const params = new URLSearchParams();

  if (controls.topic !== defaultHomeFeedControls.topic) {
    params.set("topic", controls.topic);
  }

  if (controls.sort !== defaultHomeFeedControls.sort) {
    params.set("sort", controls.sort);
  }

  if (controls.status !== defaultHomeFeedControls.status) {
    params.set("status", controls.status);
  }

  if (controls.query.trim()) {
    params.set("query", controls.query.trim());
  }

  return params.toString();
}

export function countUniqueMarketsInSections<T extends FeedItem>(sections: FeedSection<T>[]) {
  return new Set(sections.flatMap((section) => section.markets.map((market) => market.id))).size;
}

export function canExpandHomeSection<T extends FeedItem>(
  section: FeedSection<T>,
  previewCount = homeFeedSectionPreviewCount,
) {
  return section.markets.length > previewCount;
}

export function getVisibleHomeSectionMarkets<T extends FeedItem>(
  section: FeedSection<T>,
  expanded: boolean,
  previewCount = homeFeedSectionPreviewCount,
) {
  return expanded ? section.markets : section.markets.slice(0, previewCount);
}

export function buildHomeFeedSectionAnchorId(sectionKey: FeedSection["key"]) {
  return `home-feed-${sectionKey}`;
}

export function buildHomeFeedSectionPanelId(sectionKey: FeedSection["key"]) {
  return `${buildHomeFeedSectionAnchorId(sectionKey)}-panel`;
}

export function buildHomeFeedSectionToggleLabel(section: FeedSection, expanded: boolean) {
  if (expanded) {
    return "收起";
  }

  return `查看更多 +${Math.max(section.markets.length - homeFeedSectionPreviewCount, 0)}`;
}

export function buildHomeFeedSectionToggleA11yLabel(section: FeedSection, expanded: boolean) {
  return `${expanded ? "收起" : "展开"} ${section.title} 分组`;
}

export function buildHomeFeedSectionNavItems(sections: FeedSection[]): HomeFeedSectionNavItem[] {
  return sections.map((section) => ({
    key: section.key,
    title: section.title,
    anchorId: buildHomeFeedSectionAnchorId(section.key),
  }));
}
