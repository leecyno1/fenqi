import { getServerEnv } from "@/lib/env";
import { evaluateJobFreshness, listLatestTrackedJobRuns } from "@/lib/jobs";

export async function getReadinessReport(now = new Date()) {
  let envOk = true;
  let envError: string | null = null;

  try {
    getServerEnv();
  } catch (error) {
    envOk = false;
    envError = error instanceof Error ? error.message : "Invalid environment";
  }

  let databaseOk = true;
  let databaseError: string | null = null;

  try {
    const { sql } = await import("drizzle-orm");
    const { db } = await import("@/db/client");
    await db.execute(sql`select 1`);
  } catch (error) {
    databaseOk = false;
    databaseError = error instanceof Error ? error.message : "Database unavailable";
  }

  const jobRuns = databaseOk ? await listLatestTrackedJobRuns() : [];
  const jobs = evaluateJobFreshness(jobRuns, now);

  return {
    ok: envOk && databaseOk && jobs.ok,
    timestamp: now.toISOString(),
    checks: {
      env: {
        ok: envOk,
        ...(envError ? { error: envError } : {}),
      },
      database: {
        ok: databaseOk,
        ...(databaseError ? { error: databaseError } : {}),
      },
      jobs,
    },
  };
}
