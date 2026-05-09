import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { getReadinessReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const report = await getReadinessReport();
  const healthSecret = request.headers.get("x-health-secret");
  let exposeDetails = false;

  try {
    exposeDetails = Boolean(healthSecret && healthSecret === getServerEnv().cronSecret);
  } catch {
    exposeDetails = false;
  }

  const payload = exposeDetails
    ? report
    : {
        ok: report.ok,
        timestamp: report.timestamp,
        checks: {
          env: { ok: report.checks.env.ok },
          database: { ok: report.checks.database.ok },
          jobs: {
            ok: report.checks.jobs.ok,
            jobs: report.checks.jobs.jobs.map((job) => ({
              jobName: job.jobName,
              status: job.status,
              finishedAt: job.finishedAt,
              maxAgeMinutes: job.maxAgeMinutes,
            })),
          },
          sources: {
            ok: report.checks.sources.ok,
            sources: report.checks.sources.sources.map((source) => ({
              name: source.name,
              label: source.label,
              role: source.role,
              status: source.status,
              checkedAt: source.checkedAt,
              latencyMs: source.latencyMs,
              httpStatus: source.httpStatus,
            })),
          },
          catalog: report.checks.catalog,
        },
      };

  return NextResponse.json(payload, {
    status: report.ok ? 200 : 503,
  });
}
