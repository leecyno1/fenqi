import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getPublicSiteConfig: () => ({
    appUrl: "https://fenqi.example.com",
  }),
}));

import { getTrustedWriteOrigins, hasTrustedWriteOrigin } from "./request-integrity";

describe("request integrity", () => {
  it("accepts same-origin origin headers", () => {
    const request = new Request("https://fenqi.example.com/api/markets/demo/trade", {
      method: "POST",
      headers: {
        origin: "https://fenqi.example.com",
      },
    });

    expect(hasTrustedWriteOrigin(request)).toBe(true);
  });

  it("accepts same-origin referer headers when origin is absent", () => {
    const request = new Request("https://fenqi.example.com/api/admin/markets", {
      method: "POST",
      headers: {
        referer: "https://fenqi.example.com/admin",
      },
    });

    expect(hasTrustedWriteOrigin(request)).toBe(true);
  });

  it("rejects cross-origin writes", () => {
    const request = new Request("https://fenqi.example.com/api/auth/sign-in", {
      method: "POST",
      headers: {
        origin: "https://evil.example.com",
      },
    });

    expect(hasTrustedWriteOrigin(request)).toBe(false);
  });

  it("includes both configured and request origins in the trust set", () => {
    const request = new Request("https://preview.fenqi.example.com/api/auth/sign-in", {
      method: "POST",
      headers: {
        origin: "https://preview.fenqi.example.com",
      },
    });

    expect(Array.from(getTrustedWriteOrigins(request)).sort()).toEqual([
      "https://fenqi.example.com",
      "https://preview.fenqi.example.com",
    ]);
  });

  it("does not trust the request origin in production", () => {
    try {
      vi.stubEnv("NODE_ENV", "production");

      const request = new Request("https://preview.fenqi.example.com/api/auth/sign-in", {
        method: "POST",
        headers: {
          origin: "https://preview.fenqi.example.com",
        },
      });

      expect(Array.from(getTrustedWriteOrigins(request)).sort()).toEqual([
        "https://fenqi.example.com",
      ]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("trusts explicitly configured production preview origins", () => {
    try {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("APP_TRUSTED_WRITE_ORIGINS", "https://preview.fenqi.example.com,not a url");

      const request = new Request("https://preview.fenqi.example.com/api/auth/sign-in", {
        method: "POST",
        headers: {
          origin: "https://preview.fenqi.example.com",
        },
      });

      expect(hasTrustedWriteOrigin(request)).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
