import { describe, expect, it } from "vitest";

import { buildMiniChartPath, toMiniChartPoints } from "./mini-chart-path";

describe("mini chart helpers", () => {
  it("maps probability history to stable sparkline points", () => {
    const points = toMiniChartPoints(
      [
        { timestamp: "2026-04-01T00:00:00.000Z", yesProbability: 0.45, noProbability: 0.55 },
        { timestamp: "2026-04-02T00:00:00.000Z", yesProbability: 0.62, noProbability: 0.38 },
        { timestamp: "2026-04-03T00:00:00.000Z", yesProbability: 0.51, noProbability: 0.49 },
      ],
      { width: 112, height: 48 },
    );

    expect(points).toEqual([
      { x: 0, y: 26.4 },
      { x: 56, y: 18.24 },
      { x: 112, y: 23.52 },
    ]);
  });

  it("returns a simple polyline path for computed points", () => {
    expect(
      buildMiniChartPath([
        { x: 0, y: 40.8 },
        { x: 56, y: 8.16 },
        { x: 112, y: 29.28 },
      ]),
    ).toBe("M 0 40.8 L 56 8.16 L 112 29.28");
  });
});
