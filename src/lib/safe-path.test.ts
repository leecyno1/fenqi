import { describe, expect, it } from "vitest";

import { normalizeInternalPath } from "./safe-path";

describe("normalizeInternalPath", () => {
  it("keeps internal paths", () => {
    expect(normalizeInternalPath("/portfolio?tab=positions#top")).toBe("/portfolio?tab=positions#top");
  });

  it("rejects absolute external urls", () => {
    expect(normalizeInternalPath("https://evil.example.com/hijack")).toBe("/");
  });

  it("rejects protocol-relative urls", () => {
    expect(normalizeInternalPath("//evil.example.com/hijack")).toBe("/");
  });
});
