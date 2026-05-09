import { describe, expect, it } from "vitest";

import { buildImageProxyUrl, isAllowedImageProxyUrl } from "./image-proxy";

describe("image proxy URL helpers", () => {
  it("allows configured news and Polymarket image hosts", () => {
    expect(isAllowedImageProxyUrl("https://static.reuters.com/image.jpg")).toBe(true);
    expect(isAllowedImageProxyUrl("https://polymarket-upload.s3.us-east-2.amazonaws.com/event.png")).toBe(true);
    expect(buildImageProxyUrl("https://static.reuters.com/image.jpg")).toBe(
      "/api/image-proxy?url=https%3A%2F%2Fstatic.reuters.com%2Fimage.jpg",
    );
  });

  it("rejects unsupported protocols and hosts", () => {
    expect(isAllowedImageProxyUrl("http://static.reuters.com/image.jpg")).toBe(false);
    expect(isAllowedImageProxyUrl("https://evil.example/image.jpg")).toBe(false);
    expect(buildImageProxyUrl("https://evil.example/image.jpg")).toBeNull();
  });
});
