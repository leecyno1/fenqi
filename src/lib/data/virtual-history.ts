import type { PriceHistoryPeriod, PriceHistoryPoint } from "./queries";

type VirtualHistoryInput = {
  slug: string;
  status: "live" | "locked" | "resolved" | "voided" | "review" | "draft";
  closesAt: Date;
  resolvesAt: Date;
  currentYesProbability: number;
  resolutionOutcome: "YES" | "NO" | "VOID" | null;
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededNoise(seed: number) {
  let state = seed || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function getPointCount(period: PriceHistoryPeriod) {
  switch (period) {
    case "24h":
      return 24;
    case "7d":
      return 28;
    case "30d":
      return 30;
    case "all":
      return 36;
  }
}

function getRangeStart(period: PriceHistoryPeriod, now: Date, closesAt: Date) {
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all":
      return new Date(closesAt.getTime() - 35 * 24 * 60 * 60 * 1000);
  }
}

function clampProbability(value: number) {
  return Math.min(0.99, Math.max(0.01, value));
}

function getTerminalProbability(input: VirtualHistoryInput) {
  if (input.status === "resolved") {
    if (input.resolutionOutcome === "YES") {
      return 1;
    }

    if (input.resolutionOutcome === "NO") {
      return 0;
    }
  }

  if (input.status === "voided" || input.resolutionOutcome === "VOID") {
    return 0.5;
  }

  return clampProbability(input.currentYesProbability);
}

export function buildVirtualMarketHistory(
  input: VirtualHistoryInput,
  period: PriceHistoryPeriod,
  now = new Date(),
): PriceHistoryPoint[] {
  const pointCount = getPointCount(period);
  const start = getRangeStart(period, now, input.closesAt);
  const end =
    input.status === "resolved" || input.status === "voided"
      ? input.resolvesAt
      : input.status === "locked"
        ? input.closesAt
        : now;
  const duration = Math.max(end.getTime() - start.getTime(), 1);
  const random = createSeededNoise(hashString(`${input.slug}:${period}`));
  const baseline = clampProbability(0.18 + random() * 0.64);
  const terminal = getTerminalProbability(input);
  const points: PriceHistoryPoint[] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const progress = index / (pointCount - 1);
    const timestamp = new Date(start.getTime() + duration * progress);
    const wave = Math.sin(progress * Math.PI * (1.6 + random() * 1.2)) * (0.04 + random() * 0.025);
    const drift = (terminal - baseline) * progress;
    const rawProbability = baseline + drift + wave;
    const lockedCompression =
      input.status === "locked" ? (1 - progress) * 0.015 : 0;
    const probability =
      index === pointCount - 1
        ? terminal
        : clampProbability(rawProbability - lockedCompression);

    points.push({
      timestamp,
      yesProbability: probability,
      noProbability: Number((1 - probability).toFixed(6)),
    });
  }

  return points;
}
