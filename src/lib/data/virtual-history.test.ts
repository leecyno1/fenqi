import { describe, expect, it } from "vitest";

import { buildVirtualMarketHistory } from "./virtual-history";

describe("buildVirtualMarketHistory", () => {
  it("returns deterministic points for the same market input", () => {
    const input = {
      slug: "politics-us-house-approval-june-2026",
      status: "live" as const,
      closesAt: new Date("2026-06-20T12:00:00.000Z"),
      resolvesAt: new Date("2026-06-22T12:00:00.000Z"),
      currentYesProbability: 0.62,
      resolutionOutcome: null,
    };

    const first = buildVirtualMarketHistory(input, "7d", new Date("2026-04-05T00:00:00.000Z"));
    const second = buildVirtualMarketHistory(input, "7d", new Date("2026-04-05T00:00:00.000Z"));

    expect(first).toEqual(second);
    expect(first).toHaveLength(28);
  });

  it("lands resolved YES markets on a terminal yes outcome", () => {
    const points = buildVirtualMarketHistory(
      {
        slug: "sports-lakers-playoffs-2026",
        status: "resolved",
        closesAt: new Date("2026-04-01T12:00:00.000Z"),
        resolvesAt: new Date("2026-04-03T12:00:00.000Z"),
        currentYesProbability: 0.74,
        resolutionOutcome: "YES",
      },
      "30d",
      new Date("2026-04-05T00:00:00.000Z"),
    );

    const last = points.at(-1);
    expect(last?.yesProbability).toBe(1);
    expect(last?.noProbability).toBe(0);
  });

  it("lands voided markets on a neutral terminal point", () => {
    const points = buildVirtualMarketHistory(
      {
        slug: "culture-awards-release-delay-2026",
        status: "voided",
        closesAt: new Date("2026-03-12T12:00:00.000Z"),
        resolvesAt: new Date("2026-03-14T12:00:00.000Z"),
        currentYesProbability: 0.31,
        resolutionOutcome: "VOID",
      },
      "all",
      new Date("2026-04-05T00:00:00.000Z"),
    );

    const last = points.at(-1);
    expect(last?.yesProbability).toBe(0.5);
    expect(last?.noProbability).toBe(0.5);
  });
});
