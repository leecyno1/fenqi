import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("next config", () => {
  it("allows loopback IP origins during development", () => {
    expect(nextConfig.allowedDevOrigins).toContain("127.0.0.1");
  });
});
