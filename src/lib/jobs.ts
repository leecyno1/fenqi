import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { jobRuns } from "@/db/schema";
import { logger } from "@/lib/logger";

export const trackedJobNames = [
  "sync-polymarket-catalog",
  "enrich-news",
  "sync-polymarket-prices",
  "probe-polymarket-sources",
  "record-snapshots",
  "generate-news-candidates",
] as const;

export type TrackedJobName = typeof trackedJobNames[number];
export type JobRunStatus = "running" | "success" | "error";

export type JobFreshnessStatus = "fresh" | "stale" | "missing" | "error";

export type JobFreshnessItem = {
  jobName: TrackedJobName;
  status: JobFreshnessStatus;
  finishedAt: Date | null;
  maxAgeMinutes: number;
};

const freshnessThresholdsMinutes: Record<TrackedJobName, number> = {
  "sync-polymarket-catalog": 90,
  "enrich-news": 8 * 60,
  "sync-polymarket-prices": 15,
  "probe-polymarket-sources": 10,
  "record-snapshots": 120,
  "generate-news-candidates": 8 * 60,
};

const jobSingleFlightWindowMs: Record<TrackedJobName, number> = {
  "sync-polymarket-catalog": 20 * 60 * 1000,
  "enrich-news": 30 * 60 * 1000,
  "sync-polymarket-prices": 10 * 60 * 1000,
  "probe-polymarket-sources": 5 * 60 * 1000,
  "record-snapshots": 30 * 60 * 1000,
  "generate-news-candidates": 30 * 60 * 1000,
};

export class JobAlreadyRunningError extends Error {
  constructor(jobName: TrackedJobName) {
    super(`Job already running: ${jobName}`);
    this.name = "JobAlreadyRunningError";
  }
}

export function evaluateJobFreshness(
  runs: Array<{
    jobName: string;
    status: JobRunStatus;
    finishedAt: Date | null;
  }>,
  now = new Date(),
  requiredJobs: readonly TrackedJobName[] = trackedJobNames,
) {
  const requiredJobSet = new Set<string>(requiredJobs);
  const latestByJob = new Map<string, { status: JobRunStatus; finishedAt: Date | null }>();

  for (const run of runs) {
    if (run.status === "running" && !run.finishedAt) {
      continue;
    }

    if (!latestByJob.has(run.jobName)) {
      latestByJob.set(run.jobName, {
        status: run.status,
        finishedAt: run.finishedAt,
      });
    }
  }

  const jobs: JobFreshnessItem[] = trackedJobNames.map((jobName) => {
    const latest = latestByJob.get(jobName);
    const maxAgeMinutes = freshnessThresholdsMinutes[jobName];

    if (!latest?.finishedAt) {
      return {
        jobName,
        status: latest?.status === "error" ? "error" : "missing",
        finishedAt: latest?.finishedAt ?? null,
        maxAgeMinutes,
      };
    }

    if (latest.status === "error") {
      return {
        jobName,
        status: "error",
        finishedAt: latest.finishedAt,
        maxAgeMinutes,
      };
    }

    const ageMinutes = (now.getTime() - latest.finishedAt.getTime()) / 60_000;

    return {
      jobName,
      status: ageMinutes <= maxAgeMinutes ? "fresh" : "stale",
      finishedAt: latest.finishedAt,
      maxAgeMinutes,
    };
  });

  return {
    ok: jobs.every((job) => !requiredJobSet.has(job.jobName) || job.status === "fresh"),
    jobs,
  };
}

export async function listLatestJobRuns(limit: number = trackedJobNames.length) {
  return db
    .select({
      id: jobRuns.id,
      jobName: jobRuns.jobName,
      status: jobRuns.status,
      startedAt: jobRuns.startedAt,
      finishedAt: jobRuns.finishedAt,
      processedCount: jobRuns.processedCount,
      summary: jobRuns.summary,
      errorMessage: jobRuns.errorMessage,
    })
    .from(jobRuns)
    .orderBy(desc(jobRuns.startedAt))
    .limit(limit);
}

export async function listLatestTrackedJobRuns() {
  const runs = await db
    .select({
      jobName: jobRuns.jobName,
      status: jobRuns.status,
      finishedAt: jobRuns.finishedAt,
    })
    .from(jobRuns)
    .where(inArray(jobRuns.jobName, [...trackedJobNames]))
    .orderBy(desc(jobRuns.startedAt));

  return runs;
}

export async function startJobRun(jobName: TrackedJobName) {
  const id = randomUUID();
  const startedAt = new Date();
  const runningCutoff = new Date(startedAt.getTime() - jobSingleFlightWindowMs[jobName]);

  const inserted = await db.execute(sql`
    insert into job_run (id, job_name, status, started_at)
    select ${id}, ${jobName}, 'running', ${startedAt}
    where not exists (
      select 1
      from job_run
      where job_name = ${jobName}
        and status = 'running'
        and started_at >= ${runningCutoff}
    )
    returning id, started_at
  `);

  const createdRun = inserted.rows[0] as { id: string; started_at: Date } | undefined;

  if (!createdRun) {
    logger.warn("job_start_skipped_already_running", { jobName });
    throw new JobAlreadyRunningError(jobName);
  }

  logger.info("job_started", { jobName, jobRunId: id });

  return { id, startedAt };
}

export async function finishJobRun(input: {
  id: string;
  jobName: TrackedJobName;
  status: Extract<JobRunStatus, "success" | "error">;
  processedCount?: number;
  summary?: Record<string, unknown>;
  errorMessage?: string | null;
}) {
  const finishedAt = new Date();

  await db
    .update(jobRuns)
    .set({
      status: input.status,
      processedCount: input.processedCount ?? null,
      summary: input.summary ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt,
    })
    .where(and(eq(jobRuns.id, input.id), eq(jobRuns.jobName, input.jobName)));

  logger[input.status === "error" ? "error" : "info"]("job_finished", {
    jobName: input.jobName,
    jobRunId: input.id,
    status: input.status,
    processedCount: input.processedCount ?? null,
    errorMessage: input.errorMessage ?? null,
  });

  return finishedAt;
}

export async function runTrackedJob<T>(jobName: TrackedJobName, handler: () => Promise<T>, summarize?: (result: T) => {
  processedCount?: number;
  summary?: Record<string, unknown>;
}) {
  const run = await startJobRun(jobName);

  try {
    const result = await handler();
    const summary = summarize?.(result);

    await finishJobRun({
      id: run.id,
      jobName,
      status: "success",
      processedCount: summary?.processedCount,
      summary: summary?.summary,
    });

    return result;
  } catch (error) {
    await finishJobRun({
      id: run.id,
      jobName,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
