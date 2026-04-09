import { describe, expect, it } from "vitest";

import { getReportsGeneratedCandidates, parseGeneratedSpec } from "./reports-generated";

describe("reports-generated parser", () => {
  it("extracts json object from fenced response", () => {
    const parsed = parseGeneratedSpec(
      [
        "```json",
        '{"shouldCreate":true,"eventTitle":"测试事件会发生吗？","brief":"这是测试摘要","probabilityYes":0.62,"closeHours":24,"resolveHours":48,"category":"current_affairs","tags":["测试"],"evidence":["官方公告"]}',
        "```",
      ].join("\n"),
    );

    expect(parsed).toBeTruthy();
    expect(parsed?.eventTitle).toBe("测试事件会发生吗？");
    expect(parsed?.probabilityYes).toBe(0.62);
  });
});

describe("reports-generated candidates", () => {
  it("builds normalized candidates from reports news and llm output", async () => {
    const originalKey = process.env.REPORTS_LLM_API_KEY;
    const originalAllowlist = process.env.REPORTS_PLATFORM_ALLOWLIST;
    process.env.REPORTS_LLM_API_KEY = "unit-test-key";
    process.env.REPORTS_PLATFORM_ALLOWLIST = "weibo";

    try {
      const candidates = await getReportsGeneratedCandidates({
        now: new Date("2026-04-08T12:00:00.000Z"),
        fetchJson: async (url) => {
          if (url.includes("/api/dates")) {
            return ["2026-04-08"];
          }
          if (url.includes("/api/platforms")) {
            return [{ id: "weibo", name: "微博", is_active: 1 }];
          }
          if (url.includes("/api/news")) {
            return {
              date: "2026-04-08",
              platform_id: "weibo",
              total: 2,
              items: [
                {
                  id: 1,
                  title: "美联储官员密集发声",
                  platform_id: "weibo",
                  platform_name: "微博",
                  rank: 1,
                  url: "https://example.com/news/fed",
                },
                {
                  id: 2,
                  title: "重复链接应被去重",
                  platform_id: "weibo",
                  platform_name: "微博",
                  rank: 2,
                  url: "https://example.com/news/fed",
                },
              ],
            };
          }
          throw new Error(`Unexpected url: ${url}`);
        },
        generateSpec: async () => ({
          shouldCreate: true,
          eventTitle: "美联储将在本周释放降息信号吗？",
          brief: "以联储主席公开讲话与会议纪要为准。",
          probabilityYes: 0.66,
          closeHours: 24,
          resolveHours: 72,
          category: "finance",
          tags: ["美联储", "降息预期"],
          evidence: ["官方讲话", "会议纪要"],
        }),
        resolveImage: async () => ({
          newsImageUrl: "https://img.example.com/fed.jpg",
          newsImageCachedUrl: "/news-cache/fed.jpg",
          newsImageSource: "微博",
        }),
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0]?.externalSource).toBe("news_report");
      expect(candidates[0]?.probability.yes).toBeCloseTo(0.66, 5);
      expect(candidates[0]?.sourceUrl).toBe("https://example.com/news/fed");
      expect(candidates[0]?.externalSlug.startsWith("news-")).toBe(true);
      expect(candidates[0]?.status).toBe("live");
      expect(candidates[0]?.newsImageCachedUrl).toBe("/news-cache/fed.jpg");
    } finally {
      process.env.REPORTS_LLM_API_KEY = originalKey;
      process.env.REPORTS_PLATFORM_ALLOWLIST = originalAllowlist;
    }
  });

  it("returns empty when llm key is missing", async () => {
    const originalKey = process.env.REPORTS_LLM_API_KEY;
    delete process.env.REPORTS_LLM_API_KEY;

    try {
      const candidates = await getReportsGeneratedCandidates();
      expect(candidates).toEqual([]);
    } finally {
      process.env.REPORTS_LLM_API_KEY = originalKey;
    }
  });
});
