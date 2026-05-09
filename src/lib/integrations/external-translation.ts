import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { externalTextTranslations } from "@/db/schema";

import { localizeExternalBrief, localizeExternalQuestion } from "./localized-polymarket";

export type ExternalTranslationInput = {
  source: string;
  sourceId: string;
  sourceSlug?: string | null;
  title: string;
  brief?: string | null;
};

export type ExternalTranslationResult = {
  title: string;
  brief: string;
  model: string;
  fromCache: boolean;
};

type TranslationRuntimeConfig = {
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string | null;
};

const TRANSLATION_LLM_BASE_URL_DEFAULT = "https://api.sfkey.cn/v1";
const TRANSLATION_LLM_MODEL_DEFAULT = "minimax2.7";
const RULE_FALLBACK_MODEL = "rule-fallback-v2";
const translatedSchema = z.object({
  title: z.string().trim().min(2).max(80),
  brief: z.string().trim().min(8).max(180),
});

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readTranslationRuntimeConfig(): TranslationRuntimeConfig {
  return {
    llmBaseUrl: (process.env.TRANSLATION_LLM_BASE_URL ?? process.env.REPORTS_LLM_BASE_URL ?? TRANSLATION_LLM_BASE_URL_DEFAULT).replace(/\/+$/, ""),
    llmModel: process.env.TRANSLATION_LLM_MODEL ?? process.env.REPORTS_LLM_MODEL ?? TRANSLATION_LLM_MODEL_DEFAULT,
    llmApiKey: (process.env.TRANSLATION_LLM_API_KEY ?? process.env.REPORTS_LLM_API_KEY)?.trim() || null,
  };
}

function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const content = fencedMatch?.[1] ?? raw;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return content.slice(start, end + 1);
}

function parseTranslation(raw: string) {
  const json = extractJsonObject(raw);
  if (!json) {
    return null;
  }

  try {
    return translatedSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

function buildRuleFallback(input: ExternalTranslationInput) {
  const title = localizeExternalQuestion({
    question: input.title,
    slug: input.sourceSlug,
    sourceName: "外部事件库",
  });

  return {
    title,
    brief: localizeExternalBrief({
      brief: "",
      question: title,
      sourceName: "外部事件库",
    }),
  };
}

async function translateWithLlm(input: ExternalTranslationInput, config: TranslationRuntimeConfig) {
  if (!config.llmApiKey) {
    return null;
  }

  const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            "你是中文事件交易产品的本地化编辑。",
            "把英文预测市场题面翻译为自然、准确、可核验的中文。",
            "不要出现数据源品牌名，不要添加原文没有的事实。",
            "title 最多 32 个中文字符，保留年份、日期、机构、人名、币种等关键信息。",
            "brief 用中文说明观察对象和结算口径，60 字以内。",
            "只输出 JSON：{\"title\": string, \"brief\": string}",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `原始标题: ${input.title}`,
            `原始摘要: ${input.brief || ""}`,
            `slug: ${input.sourceSlug || ""}`,
          ].join("\n"),
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  const parsed = parseTranslation(payload.choices?.[0]?.message?.content ?? "");

  if (!parsed) {
    return null;
  }

  return parsed;
}

async function persistTranslation(input: ExternalTranslationInput, value: { title: string; brief: string; model: string; status: string; error?: string | null }) {
  await db
    .insert(externalTextTranslations)
    .values({
      id: randomUUID(),
      source: input.source,
      sourceId: input.sourceId,
      sourceSlug: input.sourceSlug ?? null,
      originalTitle: input.title,
      originalBrief: input.brief ?? null,
      translatedTitle: value.title,
      translatedBrief: value.brief,
      model: value.model,
      status: value.status,
      error: value.error ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [externalTextTranslations.source, externalTextTranslations.sourceId],
      set: {
        sourceSlug: input.sourceSlug ?? null,
        originalTitle: input.title,
        originalBrief: input.brief ?? null,
        translatedTitle: value.title,
        translatedBrief: value.brief,
        model: value.model,
        status: value.status,
        error: value.error ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function translateExternalText(input: ExternalTranslationInput): Promise<ExternalTranslationResult> {
  const [cached] = await db
    .select({
      originalTitle: externalTextTranslations.originalTitle,
      originalBrief: externalTextTranslations.originalBrief,
      translatedTitle: externalTextTranslations.translatedTitle,
      translatedBrief: externalTextTranslations.translatedBrief,
      model: externalTextTranslations.model,
    })
    .from(externalTextTranslations)
    .where(and(eq(externalTextTranslations.source, input.source), eq(externalTextTranslations.sourceId, input.sourceId)))
    .limit(1);

  if (
    cached &&
    cached.model !== "rule-fallback" &&
    cached.model !== RULE_FALLBACK_MODEL &&
    cached.originalTitle === input.title &&
    (cached.originalBrief ?? "") === (input.brief ?? "")
  ) {
    return {
      title: cached.translatedTitle,
      brief: cached.translatedBrief,
      model: cached.model,
      fromCache: true,
    };
  }

  const config = readTranslationRuntimeConfig();
  let translated: { title: string; brief: string } | null = null;
  let model = RULE_FALLBACK_MODEL;
  let status = "fallback";
  let error: string | null = null;

  try {
    translated = await translateWithLlm(input, config);
    if (translated) {
      model = config.llmModel;
      status = "success";
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Translation model failed.";
  }

  if (!translated) {
    translated = buildRuleFallback(input);
  }

  await persistTranslation(input, {
    title: translated.title,
    brief: translated.brief,
    model,
    status,
    error,
  });

  return {
    title: translated.title,
    brief: translated.brief,
    model,
    fromCache: false,
  };
}

export async function translateExternalTexts(inputs: ExternalTranslationInput[]): Promise<Map<string, ExternalTranslationResult>> {
  const uniqueInputs = Array.from(new Map(inputs.map((input) => [`${input.source}:${input.sourceId}`, input])).values());
  const output = new Map<string, ExternalTranslationResult>();
  const maxLlmUpgrades = parsePositiveInteger(process.env.TRANSLATION_LLM_MAX_PER_SYNC, 25);
  let llmUpgradeCount = 0;

  if (uniqueInputs.length === 0) {
    return output;
  }

  const sources = Array.from(new Set(uniqueInputs.map((input) => input.source)));
  const sourceIds = uniqueInputs.map((input) => input.sourceId);
  const cachedRows = await db
    .select({
      source: externalTextTranslations.source,
      sourceId: externalTextTranslations.sourceId,
      originalTitle: externalTextTranslations.originalTitle,
      originalBrief: externalTextTranslations.originalBrief,
      translatedTitle: externalTextTranslations.translatedTitle,
      translatedBrief: externalTextTranslations.translatedBrief,
      model: externalTextTranslations.model,
    })
    .from(externalTextTranslations)
    .where(and(inArray(externalTextTranslations.source, sources), inArray(externalTextTranslations.sourceId, sourceIds)));
  const cache = new Map(cachedRows.map((row) => [`${row.source}:${row.sourceId}`, row]));

  for (const input of uniqueInputs) {
    const key = `${input.source}:${input.sourceId}`;
    const cached = cache.get(key);
    if (cached && cached.originalTitle === input.title && (cached.originalBrief ?? "") === (input.brief ?? "")) {
      const isModelCached = cached.model !== "rule-fallback" && cached.model !== RULE_FALLBACK_MODEL;
      if (isModelCached || llmUpgradeCount >= maxLlmUpgrades) {
        output.set(key, {
          title: cached.translatedTitle,
          brief: cached.translatedBrief,
          model: cached.model,
          fromCache: true,
        });
        continue;
      }
    }

    llmUpgradeCount += 1;
    output.set(key, await translateExternalText(input));
  }

  return output;
}
