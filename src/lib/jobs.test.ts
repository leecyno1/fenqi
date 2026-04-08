import { describe, expect, it } from "vitest";

import { evaluateJobFreshness } from "./jobs";

describe("job freshness", () => {
  it("marks missing jobs as stale", () => {
    const report = evaluateJobFreshness([], new Date("2026-04-07T12:00:00.000Z"));

    expect(report.ok).toBe(false);
    expect(report.jobs.every((job) => job.status === "missing")).toBe(true);
  });

  it("marks outdated jobs as stale when the last success is too old", () => {
    const report = evaluateJobFreshness(
      [
        {
          jobName: "sync-polymarket-prices",
          status: "success",
          finishedAt: new Date("2026-04-07T11:00:00.000Z"),
        },
      ],
      new Date("2026-04-07T12:00:00.000Z"),
    );

    const priceJob = report.jobs.find((job) => job.jobName === "sync-polymarket-prices");
    expect(priceJob?.status).toBe("stale");
    expect(report.ok).toBe(false);
  });

  it("accepts fresh successful jobs", () => {
    const report = evaluateJobFreshness(
      [
        {
          jobName: "sync-polymarket-catalog",
          status: "success",
          finishedAt: new Date("2026-04-07T11:30:00.000Z"),
        },
        {
          jobName: "enrich-news",
          status: "success",
          finishedAt: new Date("2026-04-07T10:30:00.000Z"),
        },
        {
          jobName: "sync-polymarket-prices",
          status: "success",
          finishedAt: new Date("2026-04-07T11:50:00.000Z"),
        },
        {
          jobName: "record-snapshots",
          status: "success",
          finishedAt: new Date("2026-04-07T11:20:00.000Z"),
        },
      ],
      new Date("2026-04-07T12:00:00.000Z"),
    );

    expect(report.ok).toBe(true);
    expect(report.jobs.every((job) => job.status === "fresh")).toBe(true);
  });
});
