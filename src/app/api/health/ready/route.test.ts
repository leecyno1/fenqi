import { beforeEach, describe, expect, it, vi } from "vitest";

const getReadinessReport = vi.fn();

vi.mock("@/lib/health", () => ({
  getReadinessReport,
}));

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    getReadinessReport.mockReset();
  });

  it("returns 200 when the system is ready", async () => {
    getReadinessReport.mockResolvedValue({
      ok: true,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: true },
        jobs: { ok: true, jobs: [] },
      },
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
  });

  it("returns 503 when readiness checks fail", async () => {
    getReadinessReport.mockResolvedValue({
      ok: false,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: false, error: "db offline" },
        jobs: { ok: false, jobs: [] },
      },
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(503);
  });
});
