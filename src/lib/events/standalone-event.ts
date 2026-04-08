export function buildStandaloneEventId(marketId: string) {
  return `evt_${marketId}`;
}

export function buildStandaloneEventValues(input: {
  id: string;
  slug: string;
  title: string;
  brief: string;
  tone: string;
  category: "current_affairs" | "technology" | "finance";
  sourceName?: string | null;
  sourceUrl?: string | null;
  image?: string | null;
  resolutionSources: Array<{
    label: string;
    href: string;
  }>;
  evidence: string[];
}) {
  return {
    id: input.id,
    slug: input.slug,
    image: input.image ?? null,
    externalSource: null,
    externalEventId: null,
    externalEventSlug: null,
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    canonicalSourceUrl: input.sourceUrl ?? null,
    externalImageUrl: null,
    newsImageUrl: null,
    newsImageCachedUrl: null,
    newsImageSource: null,
    newsReferences: [],
    heatScore: 0,
    controversyScore: 0,
    isFeatured: false,
    lastSyncedAt: null,
    title: input.title,
    brief: input.brief,
    tone: input.tone,
    category: input.category,
    resolutionSources: input.resolutionSources,
    evidence: input.evidence,
    updatedAt: new Date(),
  };
}
