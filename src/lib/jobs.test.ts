import { describe, expect, it } from "vitest";

import { evaluateJobFreshness } from "@/lib/jobs";

describe("evaluateJobFreshness", () => {
  it("only blocks readiness on required jobs", () => {
    const now = new Date("2026-05-02T08:00:00.000Z");
    const finishedAt = new Date("2026-05-02T07:30:00.000Z");
    const report = evaluateJobFreshness(
      [
        {
          jobName: "record-snapshots",
          status: "success",
          finishedAt,
        },
      ],
      now,
      ["record-snapshots"],
    );

    expect(report.ok).toBe(true);
    expect(report.jobs.find((job) => job.jobName === "record-snapshots")?.status).toBe("fresh");
    expect(report.jobs.find((job) => job.jobName === "sync-polymarket-catalog")?.status).toBe("missing");
  });

  it("keeps failing when a required job is stale or missing", () => {
    const now = new Date("2026-05-02T08:00:00.000Z");
    const finishedAt = new Date("2026-05-02T05:59:00.000Z");
    const report = evaluateJobFreshness(
      [
        {
          jobName: "record-snapshots",
          status: "success",
          finishedAt,
        },
      ],
      now,
      ["record-snapshots"],
    );

    expect(report.ok).toBe(false);
    expect(report.jobs.find((job) => job.jobName === "record-snapshots")?.status).toBe("stale");
  });

  it("treats Polymarket catalog and price sync using production cadence thresholds", () => {
    const now = new Date("2026-05-02T08:00:00.000Z");
    const report = evaluateJobFreshness(
      [
        {
          jobName: "sync-polymarket-catalog",
          status: "success",
          finishedAt: new Date("2026-05-02T06:29:00.000Z"),
        },
        {
          jobName: "sync-polymarket-prices",
          status: "success",
          finishedAt: new Date("2026-05-02T07:44:00.000Z"),
        },
      ],
      now,
      ["sync-polymarket-catalog", "sync-polymarket-prices"],
    );

    expect(report.ok).toBe(false);
    expect(report.jobs.find((job) => job.jobName === "sync-polymarket-catalog")).toMatchObject({
      status: "stale",
      maxAgeMinutes: 90,
    });
    expect(report.jobs.find((job) => job.jobName === "sync-polymarket-prices")).toMatchObject({
      status: "stale",
      maxAgeMinutes: 15,
    });
  });
});
