import { z } from "zod";

import type { marketCategoryEnum, marketStatusEnum } from "@/db/schema";

type MarketCategory = typeof marketCategoryEnum.enumValues[number];
type MarketStatus = typeof marketStatusEnum.enumValues[number];
type PriceAnchorMode = "external" | "hybrid" | "local";

export type AdminMarketFormInput = {
  question: string;
  slug: string;
  image: string;
  sourceName?: string;
  sourceUrl?: string;
  newsImageSource?: string;
  priceAnchorMode?: string;
  brief: string;
  tone: string;
  category: string;
  status: string;
  liquidity: string;
  yesShares: string;
  noShares: string;
  volumePoints: string;
  activeTraders: string;
  closesAt: string;
  resolvesAt: string;
  evidence: string;
  resolutionSources: string;
};

const categoryValues: MarketCategory[] = ["current_affairs", "technology", "finance"];
const statusValues: MarketStatus[] = ["draft", "review", "live", "locked", "resolved", "voided"];
const priceAnchorModeValues: PriceAnchorMode[] = ["external", "hybrid", "local"];

const baseSchema = z.object({
  question: z.string().trim().min(3),
  slug: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  image: z.string().trim().optional().default(""),
  sourceName: z.string().trim().optional().default(""),
  sourceUrl: z.string().trim().optional().default(""),
  newsImageSource: z.string().trim().optional().default(""),
  priceAnchorMode: z.enum(priceAnchorModeValues).optional().default("local"),
  brief: z.string().trim().min(6),
  tone: z.string().trim().min(6),
  category: z.enum(categoryValues),
  status: z.enum(statusValues),
  liquidity: z.coerce.number().int().positive(),
  yesShares: z.coerce.number().int().min(0),
  noShares: z.coerce.number().int().min(0),
  volumePoints: z.coerce.number().int().min(0),
  activeTraders: z.coerce.number().int().min(0),
  closesAt: z.string().min(1),
  resolvesAt: z.string().min(1),
  evidence: z.string().min(1),
  resolutionSources: z.string().min(1),
});

function parseResolutionSources(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href, ...rest] = line.split("|").map((part) => part.trim());

      if (!label || !href || rest.length > 0) {
        throw new Error("Each resolution source must use the format: label|https://example.com");
      }

      try {
        const url = new URL(href);
        return {
          label,
          href: url.toString(),
        };
      } catch {
        throw new Error("Each resolution source must include a valid URL.");
      }
    });
}

export function parseAdminMarketInput(input: AdminMarketFormInput) {
  const parsed = baseSchema.parse(input);
  const closesAt = new Date(parsed.closesAt);
  const resolvesAt = new Date(parsed.resolvesAt);

  if (Number.isNaN(closesAt.getTime()) || Number.isNaN(resolvesAt.getTime())) {
    throw new Error("Close and resolve time must be valid dates.");
  }

  if (resolvesAt <= closesAt) {
    throw new Error("Resolve time must be after close time.");
  }

  if (parsed.sourceUrl) {
    try {
      new URL(parsed.sourceUrl);
    } catch {
      throw new Error("Source URL must be a valid URL.");
    }
  }

  return {
    question: parsed.question,
    slug: parsed.slug,
    image: parsed.image || null,
    sourceName: parsed.sourceName || null,
    sourceUrl: parsed.sourceUrl || null,
    newsImageSource: parsed.newsImageSource || null,
    priceAnchorMode: parsed.priceAnchorMode,
    brief: parsed.brief,
    tone: parsed.tone,
    category: parsed.category,
    status: parsed.status,
    liquidity: parsed.liquidity,
    yesShares: parsed.yesShares,
    noShares: parsed.noShares,
    volumePoints: parsed.volumePoints,
    activeTraders: parsed.activeTraders,
    closesAt,
    resolvesAt,
    evidence: parsed.evidence
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    resolutionSources: parseResolutionSources(parsed.resolutionSources),
  };
}

function toDatetimeLocalValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buildAdminMarketFormValues(input: {
  id?: string;
  question: string;
  slug: string;
  image?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  newsImageSource?: string | null;
  priceAnchorMode?: PriceAnchorMode | null;
  brief: string;
  tone: string;
  category: MarketCategory;
  status: MarketStatus;
  liquidity: number;
  yesShares: number;
  noShares: number;
  volumePoints: number;
  activeTraders: number;
  closesAt: Date;
  resolvesAt: Date;
  evidence: string[];
  resolutionSources: Array<{
    label: string;
    href: string;
  }>;
}): AdminMarketFormInput {
  return {
    question: input.question,
    slug: input.slug,
    image: input.image ?? "",
    sourceName: input.sourceName ?? "",
    sourceUrl: input.sourceUrl ?? "",
    newsImageSource: input.newsImageSource ?? "",
    priceAnchorMode: input.priceAnchorMode ?? "local",
    brief: input.brief,
    tone: input.tone,
    category: input.category,
    status: input.status,
    liquidity: String(input.liquidity),
    yesShares: String(input.yesShares),
    noShares: String(input.noShares),
    volumePoints: String(input.volumePoints),
    activeTraders: String(input.activeTraders),
    closesAt: toDatetimeLocalValue(input.closesAt),
    resolvesAt: toDatetimeLocalValue(input.resolvesAt),
    evidence: input.evidence.join("\n"),
    resolutionSources: input.resolutionSources
      .map((source) => `${source.label}|${source.href}`)
      .join("\n"),
  };
}

export type ParsedAdminMarketInput = ReturnType<typeof parseAdminMarketInput>;
