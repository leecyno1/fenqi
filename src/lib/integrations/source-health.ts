import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { jobRuns } from "@/db/schema";

import { fetchPolymarketEvents, fetchPolymarketUrl, getPolymarketClobUrl, getPolymarketEventsApiUrl } from "./polymarket";

export type SourceProbeStatus = "ok" | "error" | "missing" | "stale";

export type SourceProbe = {
  name: "polymarket-gamma" | "polymarket-clob";
  label: string;
  role: string;
  url: string;
  status: SourceProbeStatus;
  checkedAt: string;
  latencyMs: number;
  httpStatus: number | null;
  error: string | null;
};

export type SourceHealthReport = {
  ok: boolean;
  timestamp: string;
  maxAgeMinutes: number;
  stale: boolean;
  sources: SourceProbe[];
};

const SOURCE_HEALTH_MAX_AGE_MINUTES = 10;

const SOURCE_DEFINITIONS = [
  {
    name: "polymarket-gamma" as const,
    label: "事件目录源",
    role: "事件目录发现",
    url: () => getPolymarketEventsApiUrl(),
  },
  {
    name: "polymarket-clob" as const,
    label: "盘口价格源",
    role: "盘口价格读取",
    url: () => `${getPolymarketClobUrl().replace(/\/$/, "")}/ok`,
  },
];

function getProbeTimeoutMs() {
  const parsed = Number.parseInt(process.env.SOURCE_HEALTH_TIMEOUT_MS ?? "3000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

function elapsedSince(startedAt: number) {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown source probe error";
}

function emptyProbe(input: { name: SourceProbe["name"]; status: SourceProbeStatus; error: string }): SourceProbe {
  const definition = SOURCE_DEFINITIONS.find((source) => source.name === input.name);

  return {
    name: input.name,
    label: definition?.label ?? input.name,
    role: definition?.role ?? "外部数据源",
    url: definition?.url() ?? "",
    status: input.status,
    checkedAt: new Date(0).toISOString(),
    latencyMs: 0,
    httpStatus: null,
    error: input.error,
  };
}

async function probeGamma(timeoutMs: number): Promise<SourceProbe> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();
  const url = getPolymarketEventsApiUrl();

  try {
    const events = await fetchPolymarketEvents({ limit: 1, active: true, allowFallback: false, timeoutMs });
    return {
      name: "polymarket-gamma",
      label: "事件目录源",
      role: "事件目录发现",
      url,
      status: events.length > 0 ? "ok" : "error",
      checkedAt,
      latencyMs: elapsedSince(startedAt),
      httpStatus: events.length > 0 ? 200 : null,
      error: events.length > 0 ? null : "Gamma returned no discoverable events.",
    };
  } catch (error) {
    return {
      name: "polymarket-gamma",
      label: "事件目录源",
      role: "事件目录发现",
      url,
      status: "error",
      checkedAt,
      latencyMs: elapsedSince(startedAt),
      httpStatus: typeof error === "object" && error !== null ? ((error as { status?: number }).status ?? null) : null,
      error: errorMessage(error),
    };
  }
}

async function probeClob(timeoutMs: number): Promise<SourceProbe> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();
  const url = `${getPolymarketClobUrl().replace(/\/$/, "")}/ok`;

  try {
    const response = await fetchPolymarketUrl({
      url,
      source: "clob",
      headers: { accept: "application/json,text/plain;q=0.9,*/*;q=0.8" },
      timeoutMs,
    });
    const body = (await response.text()).trim();
    const healthy = response.ok && (!body || /ok|true|healthy/i.test(body));

    return {
      name: "polymarket-clob",
      label: "盘口价格源",
      role: "盘口价格读取",
      url,
      status: healthy ? "ok" : "error",
      checkedAt,
      latencyMs: elapsedSince(startedAt),
      httpStatus: response.status,
      error: healthy ? null : `Unexpected CLOB health response: ${response.status}${body ? ` ${body.slice(0, 120)}` : ""}`,
    };
  } catch (error) {
    return {
      name: "polymarket-clob",
      label: "盘口价格源",
      role: "盘口价格读取",
      url,
      status: "error",
      checkedAt,
      latencyMs: elapsedSince(startedAt),
      httpStatus: null,
      error: errorMessage(error),
    };
  }
}

function isSourceProbe(value: unknown): value is SourceProbe {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    (record.name === "polymarket-gamma" || record.name === "polymarket-clob") &&
    typeof record.label === "string" &&
    typeof record.role === "string" &&
    typeof record.url === "string" &&
    (record.status === "ok" || record.status === "error" || record.status === "missing" || record.status === "stale") &&
    typeof record.checkedAt === "string" &&
    typeof record.latencyMs === "number" &&
    (typeof record.httpStatus === "number" || record.httpStatus === null) &&
    (typeof record.error === "string" || record.error === null)
  );
}

function parseSourceHealthSummary(value: unknown): SourceHealthReport | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.sources)) {
    return null;
  }

  const sources = record.sources.filter(isSourceProbe);
  if (sources.length !== SOURCE_DEFINITIONS.length || typeof record.timestamp !== "string") {
    return null;
  }

  return {
    ok: sources.every((source) => source.status === "ok"),
    timestamp: record.timestamp,
    maxAgeMinutes: SOURCE_HEALTH_MAX_AGE_MINUTES,
    stale: false,
    sources,
  };
}

function markStale(report: SourceHealthReport, now: Date): SourceHealthReport {
  const checkedAt = new Date(report.timestamp);
  const ageMinutes = Number.isFinite(checkedAt.getTime()) ? (now.getTime() - checkedAt.getTime()) / 60_000 : Infinity;
  const stale = ageMinutes > SOURCE_HEALTH_MAX_AGE_MINUTES;

  if (!stale) {
    return report;
  }

  return {
    ...report,
    ok: false,
    stale: true,
    sources: report.sources.map((source) => ({
      ...source,
      status: source.status === "ok" ? "stale" : source.status,
      error: source.error ?? "Source probe is stale.",
    })),
  };
}

export async function probeSourceHealth(): Promise<SourceHealthReport> {
  const timeoutMs = getProbeTimeoutMs();
  const sources = await Promise.all([probeGamma(timeoutMs), probeClob(timeoutMs)]);

  return {
    ok: sources.every((source) => source.status === "ok"),
    timestamp: new Date().toISOString(),
    maxAgeMinutes: SOURCE_HEALTH_MAX_AGE_MINUTES,
    stale: false,
    sources,
  };
}

export async function getLatestSourceHealthReport(now = new Date()): Promise<SourceHealthReport> {
  const [latest] = await db
    .select({ summary: jobRuns.summary, finishedAt: jobRuns.finishedAt, status: jobRuns.status })
    .from(jobRuns)
    .where(eq(jobRuns.jobName, "probe-polymarket-sources"))
    .orderBy(desc(jobRuns.startedAt))
    .limit(1);

  if (!latest) {
    return getMissingSourceHealthReport(now);
  }

  const parsed = parseSourceHealthSummary(latest.summary);
  if (!parsed || latest.status !== "success") {
    return {
      ok: false,
      timestamp: latest.finishedAt?.toISOString() ?? now.toISOString(),
      maxAgeMinutes: SOURCE_HEALTH_MAX_AGE_MINUTES,
      stale: true,
      sources: SOURCE_DEFINITIONS.map((source) => emptyProbe({
        name: source.name,
        status: latest.status === "error" ? "error" : "missing",
        error: latest.status === "error" ? "Latest source probe job failed." : "Latest source probe summary is unavailable.",
      })),
    };
  }

  return markStale(parsed, now);
}

export function getMissingSourceHealthReport(now = new Date()): SourceHealthReport {
  return {
    ok: false,
    timestamp: now.toISOString(),
    maxAgeMinutes: SOURCE_HEALTH_MAX_AGE_MINUTES,
    stale: true,
    sources: SOURCE_DEFINITIONS.map((source) => emptyProbe({
      name: source.name,
      status: "missing",
      error: "No source probe has completed yet.",
    })),
  };
}
