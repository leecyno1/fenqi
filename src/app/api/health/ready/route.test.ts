import { beforeEach, describe, expect, it, vi } from "vitest";

const getReadinessReport = vi.fn();

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    cronSecret: "internal-health-secret",
  }),
}));

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
        sources: { ok: true, timestamp: "2026-04-07T12:00:00.000Z", sources: [] },
        catalog: { ok: true, minEvents: 100, minMarkets: 100, eventCount: 123, marketCount: 456 },
      },
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://fenqi.example.com/api/health/ready"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: true },
        jobs: { ok: true, jobs: [] },
        sources: { ok: true, sources: [] },
        catalog: { ok: true, minEvents: 100, minMarkets: 100, eventCount: 123, marketCount: 456 },
      },
    });
  });

  it("returns 503 when readiness checks fail", async () => {
    getReadinessReport.mockResolvedValue({
      ok: false,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: false, error: "db offline" },
        jobs: { ok: false, jobs: [] },
        sources: {
          ok: false,
          timestamp: "2026-04-07T12:00:00.000Z",
          sources: [
            {
              name: "polymarket-gamma",
              label: "Polymarket Gamma",
              role: "事件目录发现",
              url: "https://gamma-api.polymarket.com/events",
              status: "error",
              checkedAt: "2026-04-07T12:00:00.000Z",
              latencyMs: 5000,
              httpStatus: null,
              error: "timeout",
            },
          ],
        },
        catalog: { ok: false, minEvents: 100, minMarkets: 100, eventCount: 60, marketCount: 60 },
      },
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://fenqi.example.com/api/health/ready"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: false },
        jobs: { ok: false, jobs: [] },
        sources: {
          ok: false,
          sources: [
            {
              name: "polymarket-gamma",
              label: "Polymarket Gamma",
              role: "事件目录发现",
              status: "error",
              checkedAt: "2026-04-07T12:00:00.000Z",
              latencyMs: 5000,
              httpStatus: null,
            },
          ],
        },
        catalog: { ok: false, minEvents: 100, minMarkets: 100, eventCount: 60, marketCount: 60 },
      },
    });
  });

  it("returns full details when the internal health secret matches", async () => {
    getReadinessReport.mockResolvedValue({
      ok: false,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: false, error: "db offline" },
        jobs: { ok: false, jobs: [] },
        sources: {
          ok: false,
          timestamp: "2026-04-07T12:00:00.000Z",
          sources: [
            {
              name: "polymarket-gamma",
              label: "Polymarket Gamma",
              role: "事件目录发现",
              url: "https://gamma-api.polymarket.com/events",
              status: "error",
              checkedAt: "2026-04-07T12:00:00.000Z",
              latencyMs: 5000,
              httpStatus: null,
              error: "timeout",
            },
          ],
        },
        catalog: { ok: false, minEvents: 100, minMarkets: 100, eventCount: 60, marketCount: 60 },
      },
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://fenqi.example.com/api/health/ready", {
      headers: {
        "x-health-secret": "internal-health-secret",
      },
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      timestamp: "2026-04-07T12:00:00.000Z",
      checks: {
        env: { ok: true },
        database: { ok: false, error: "db offline" },
        jobs: { ok: false, jobs: [] },
        sources: {
          ok: false,
          timestamp: "2026-04-07T12:00:00.000Z",
          sources: [
            {
              name: "polymarket-gamma",
              label: "Polymarket Gamma",
              role: "事件目录发现",
              url: "https://gamma-api.polymarket.com/events",
              status: "error",
              checkedAt: "2026-04-07T12:00:00.000Z",
              latencyMs: 5000,
              httpStatus: null,
              error: "timeout",
            },
          ],
        },
        catalog: { ok: false, minEvents: 100, minMarkets: 100, eventCount: 60, marketCount: 60 },
      },
    });
  });
});
