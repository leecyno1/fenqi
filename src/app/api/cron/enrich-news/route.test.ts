import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const enrichMarketsWithNews = vi.fn();
const runTrackedJob = vi.fn();

vi.mock("@/lib/integrations/enrich-news", () => ({
  enrichMarketsWithNews,
}));

vi.mock("@/lib/jobs", () => ({
  runTrackedJob,
}));

describe("POST /api/cron/enrich-news", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    enrichMarketsWithNews.mockReset();
    runTrackedJob.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/cron/enrich-news", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("returns enrichment summary for authorized requests", async () => {
    enrichMarketsWithNews.mockResolvedValue({ updated: 2, skipped: 1, matched: 2 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/cron/enrich-news", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      updated: 2,
      skipped: 1,
      matched: 2,
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });
});
