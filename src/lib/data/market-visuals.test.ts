import { describe, expect, it } from "vitest";

import { resolveMarketImageUrl } from "./market-visuals";

describe("resolveMarketImageUrl", () => {
  it("prefers manual override, then cached news image, then live news image", () => {
    expect(
      resolveMarketImageUrl("fed-cut-september-2026", "finance", {
        manualImage: "https://cdn.example/manual.jpg",
        newsImageCachedUrl: "/api/assets/news/fed.jpg",
        newsImageUrl: "https://news.example/fed-live.jpg",
        externalImageUrl: "https://polymarket-upload.example/fed.png",
      }),
    ).toBe("https://cdn.example/manual.jpg");

    expect(
      resolveMarketImageUrl("fed-cut-september-2026", "finance", {
        manualImage: null,
        newsImageCachedUrl: "/api/assets/news/fed.jpg",
        newsImageUrl: "https://news.example/fed-live.jpg",
        externalImageUrl: "https://polymarket-upload.example/fed.png",
      }),
    ).toBe("/api/assets/news/fed.jpg");

    expect(
      resolveMarketImageUrl("fed-cut-september-2026", "finance", {
        manualImage: null,
        newsImageCachedUrl: null,
        newsImageUrl: "https://news.example/fed-live.jpg",
        externalImageUrl: "https://polymarket-upload.example/fed.png",
      }),
    ).toBe("https://news.example/fed-live.jpg");

    expect(
      resolveMarketImageUrl("fed-cut-september-2026", "finance", {
        manualImage: null,
        newsImageCachedUrl: null,
        newsImageUrl: null,
        externalImageUrl: "https://polymarket-upload.example/fed.png",
      }),
    ).toBe("/event-photo/finance.jpg");
  });

  it("ignores legacy svg icon paths and falls back to real photo assets", () => {
    expect(
      resolveMarketImageUrl("crypto-btc-2026", "crypto", {
        manualImage: "/event-art/bitcoin.svg",
        newsImageCachedUrl: null,
        newsImageUrl: null,
        externalImageUrl: null,
      }),
    ).toBe("/event-photo/crypto.jpg");

    expect(
      resolveMarketImageUrl("fed-cut-september-2026", "finance", {
        manualImage: null,
        newsImageCachedUrl: null,
        newsImageUrl: null,
        externalImageUrl: "https://cdn.example/icon.svg",
      }),
    ).toBe("/event-photo/finance.jpg");

    expect(resolveMarketImageUrl("culture-summer-boxoffice-2026-animation", "culture")).toBe(
      "/event-photo/culture.jpg",
    );
  });
});
