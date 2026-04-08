import { describe, expect, it } from "vitest";

import { parseAdminMarketInput } from "./market-form";

describe("parseAdminMarketInput", () => {
  it("parses admin form input into normalized market payload", () => {
    const result = parseAdminMarketInput({
      question: "2026 年底前会有中国大模型厂商发布稳定商用 Agent OS 吗？",
      slug: "  cn-agent-os-2026  ",
      image: "",
      brief: "面向后台创建的新市场。",
      tone: "这是一个偏科技叙事的长期观察市场。",
      category: "technology",
      status: "review",
      liquidity: "120",
      yesShares: "45",
      noShares: "55",
      volumePoints: "12000",
      activeTraders: "88",
      closesAt: "2026-10-01T12:00",
      resolvesAt: "2026-10-05T12:00",
      evidence: "观察正式发布与商用可用性\n关注开发者生态与权限治理",
      resolutionSources: "官方博客|https://example.com/blog\n开发者文档|https://example.com/docs",
    });

    expect(result.slug).toBe("cn-agent-os-2026");
    expect(result.category).toBe("technology");
    expect(result.status).toBe("review");
    expect(result.liquidity).toBe(120);
    expect(result.evidence).toEqual([
      "观察正式发布与商用可用性",
      "关注开发者生态与权限治理",
    ]);
    expect(result.resolutionSources).toEqual([
      { label: "官方博客", href: "https://example.com/blog" },
      { label: "开发者文档", href: "https://example.com/docs" },
    ]);
    expect(result.closesAt).toBeInstanceOf(Date);
    expect(result.resolvesAt).toBeInstanceOf(Date);
  });

  it("rejects malformed resolution source lines", () => {
    expect(() =>
      parseAdminMarketInput({
        question: "valid question",
        slug: "bad-market",
        image: "",
        brief: "valid brief",
        tone: "valid tone text",
        category: "technology",
        status: "draft",
        liquidity: "100",
        yesShares: "0",
        noShares: "0",
        volumePoints: "0",
        activeTraders: "0",
        closesAt: "2026-10-01T12:00",
        resolvesAt: "2026-10-05T12:00",
        evidence: "one",
        resolutionSources: "bad-line-without-separator",
      }),
    ).toThrow(/resolution source/i);
  });

  it("rejects resolve time earlier than close time", () => {
    expect(() =>
      parseAdminMarketInput({
        question: "valid question",
        slug: "bad-market",
        image: "",
        brief: "valid brief",
        tone: "valid tone text",
        category: "technology",
        status: "draft",
        liquidity: "100",
        yesShares: "0",
        noShares: "0",
        volumePoints: "0",
        activeTraders: "0",
        closesAt: "2026-10-05T12:00",
        resolvesAt: "2026-10-01T12:00",
        evidence: "one",
        resolutionSources: "官方博客|https://example.com/blog",
      }),
    ).toThrow(/resolve time/i);
  });
});

import { buildAdminMarketFormValues } from "./market-form";

describe("buildAdminMarketFormValues", () => {
  it("serializes market detail data into editable form strings", () => {
    const values = buildAdminMarketFormValues({
      id: "m1",
      question: "Will this market stay live?",
      slug: "market-live",
      image: "/event-photo/finance.jpg",
      brief: "A valid brief.",
      tone: "A valid tone for operators.",
      category: "finance",
      status: "live",
      liquidity: 150,
      yesShares: 70,
      noShares: 30,
      volumePoints: 8800,
      activeTraders: 123,
      closesAt: new Date("2026-08-01T12:30:00.000Z"),
      resolvesAt: new Date("2026-08-03T09:00:00.000Z"),
      evidence: ["line one", "line two"],
      resolutionSources: [
        { label: "Source A", href: "https://example.com/a" },
        { label: "Source B", href: "https://example.com/b" },
      ],
    });

    expect(values.category).toBe("finance");
    expect(values.status).toBe("live");
    expect(values.image).toBe("/event-photo/finance.jpg");
    expect(values.liquidity).toBe("150");
    expect(values.evidence).toBe("line one\nline two");
    expect(values.resolutionSources).toBe(
      "Source A|https://example.com/a\nSource B|https://example.com/b",
    );
    expect(values.closesAt).toMatch(/^2026-08-01T/);
    expect(values.resolvesAt).toMatch(/^2026-08-03T/);
  });
});
