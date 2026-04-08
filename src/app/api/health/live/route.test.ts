import { describe, expect, it } from "vitest";

describe("GET /api/health/live", () => {
  it("returns a live heartbeat", async () => {
    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});
