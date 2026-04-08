import { describe, expect, it } from "vitest";

import {
  buildAuthBaseURLConfig,
  getAuthClientBaseURL,
} from "./config";

describe("auth config", () => {
  it("keeps the client on the current site by default instead of hardcoding localhost:3000", () => {
    expect(getAuthClientBaseURL({})).toBeUndefined();
  });

  it("lets the server resolve local development hosts dynamically", () => {
    const config = buildAuthBaseURLConfig({});

    expect(config.allowedHosts).toEqual(
      expect.arrayContaining([
        "localhost",
        "localhost:*",
        "127.0.0.1",
        "127.0.0.1:*",
      ]),
    );
  });

  it("uses the configured public origin as fallback and allowlist input", () => {
    const config = buildAuthBaseURLConfig({
      BETTER_AUTH_URL: "https://research.example.com",
    });

    expect(config.fallback).toBe("https://research.example.com");
    expect(config.allowedHosts).toContain("research.example.com");
  });
});
