import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const syncReportGeneratedCandidates = vi.fn();
const runTrackedJob = vi.fn();

vi.mock("@/lib/integrations/sync-reports", () => ({
  syncReportGeneratedCandidates,
}));

vi.mock("@/lib/jobs", () => ({
  runTrackedJob,
}));

describe("POST /api/cron/generate-news-candidates", () => {
  const originalSecret = process.env.CRON_SECRET;
  const originalReportsKey = process.env.REPORTS_LLM_API_KEY;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    process.env.REPORTS_LLM_API_KEY = "test-key";
    syncReportGeneratedCandidates.mockReset();
    runTrackedJob.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/cron/generate-news-candidates", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("returns a clear configuration error when llm key is missing", async () => {
    delete process.env.REPORTS_LLM_API_KEY;

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/cron/generate-news-candidates", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Missing REPORTS_LLM_API_KEY.",
    });
  });

  it("returns generated candidate summary", async () => {
    syncReportGeneratedCandidates.mockResolvedValue({ inserted: 2, updated: 3, skipped: 1 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/cron/generate-news-candidates", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(runTrackedJob).toHaveBeenCalledWith("generate-news-candidates", expect.any(Function), expect.any(Function));
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      inserted: 2,
      updated: 3,
      skipped: 1,
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
    process.env.REPORTS_LLM_API_KEY = originalReportsKey;
  });
});
