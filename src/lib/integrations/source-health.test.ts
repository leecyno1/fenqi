import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => [],
          }),
        }),
      }),
    }),
  },
}));

import { getLatestSourceHealthReport, probeSourceHealth } from "./source-health";

const eventPayload = [
  {
    id: "event-1",
    slug: "event-1",
    title: "Will this test event stay live?",
    description: null,
    resolutionSource: null,
    startDate: null,
    endDate: "2026-12-31T00:00:00Z",
    image: null,
    icon: null,
    active: true,
    closed: false,
    archived: false,
    new: false,
    featured: false,
    restricted: false,
    liquidity: 100,
    volume: 100,
    openInterest: 100,
    sortBy: null,
    category: null,
    published_at: null,
    createdAt: null,
    updatedAt: null,
    competitive: null,
    volume24hr: null,
    volume1wk: null,
    volume1mo: null,
    volume1yr: null,
    liquidityAmm: null,
    liquidityClob: null,
    commentCount: null,
    markets: [],
    series: null,
    tags: [],
    cyom: false,
    closedTime: null,
    showAllOutcomes: false,
    showMarketImages: false,
    enableNegRisk: false,
    seriesSlug: null,
    negRiskAugmented: false,
    pendingDeployment: false,
    deploying: false,
    requiresTranslation: false,
    eventMetadata: null,
  },
];

describe("source health probes", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reports Gamma and CLOB as healthy", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(eventPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response("OK", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const report = await probeSourceHealth();

    expect(report.ok).toBe(true);
    expect(report.sources.map((source) => [source.name, source.status])).toEqual([
      ["polymarket-gamma", "ok"],
      ["polymarket-clob", "ok"],
    ]);
  });

  it("marks older summaries as stale when no fresh probe job exists", async () => {
    const report = await getLatestSourceHealthReport(new Date("2026-05-05T10:30:00.000Z"));

    expect(report.stale).toBe(true);
    expect(report.ok).toBe(false);
    expect(report.sources.every((source) => source.status === "missing" || source.status === "stale")).toBe(true);
  });

  it("does not mask upstream failures with bundled fallback data", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("gamma timeout"))
      .mockResolvedValueOnce(new Response("OK", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const report = await probeSourceHealth();

    expect(report.ok).toBe(false);
    expect(report.sources[0]).toMatchObject({
      name: "polymarket-gamma",
      status: "error",
      error: "gamma timeout",
    });
    expect(report.sources[1]).toMatchObject({ name: "polymarket-clob", status: "ok" });
  });
});
