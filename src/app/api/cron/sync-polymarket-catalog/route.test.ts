import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const syncPolymarketCatalog = vi.fn();
const runTrackedJob = vi.fn();
const getPolymarketCatalogCoverage = vi.fn();

vi.mock("@/lib/integrations/sync-polymarket", () => ({
  syncPolymarketCatalog,
}));

vi.mock("@/lib/jobs", () => ({
  runTrackedJob,
}));

vi.mock("@/lib/health", () => ({
  getPolymarketCatalogCoverage,
}));

describe("POST /api/cron/sync-polymarket-catalog", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    syncPolymarketCatalog.mockReset();
    runTrackedJob.mockReset();
    getPolymarketCatalogCoverage.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
    getPolymarketCatalogCoverage.mockResolvedValue({
      ok: true,
      minEvents: 100,
      minMarkets: 100,
      eventCount: 123,
      marketCount: 456,
    });
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/cron/sync-polymarket-catalog", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("returns sync summary with catalog coverage for authorized requests", async () => {
    syncPolymarketCatalog.mockResolvedValue({ inserted: 3, updated: 5, skipped: 2 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/cron/sync-polymarket-catalog", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      inserted: 3,
      updated: 5,
      skipped: 2,
      catalog: {
        ok: true,
        minEvents: 100,
        minMarkets: 100,
        eventCount: 123,
        marketCount: 456,
      },
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });
});
