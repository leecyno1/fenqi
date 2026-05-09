import { describe, expect, it } from "vitest";

import { InvalidJsonBodyError, readJsonBody } from "./http-json";

describe("readJsonBody", () => {
  it("parses valid json", async () => {
    const request = new Request("https://fenqi.example.com/api", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    });

    await expect(readJsonBody(request)).resolves.toEqual({ ok: true });
  });

  it("normalizes invalid json errors", async () => {
    const request = new Request("https://fenqi.example.com/api", {
      method: "POST",
      body: "{bad",
    });

    await expect(readJsonBody(request)).rejects.toBeInstanceOf(InvalidJsonBodyError);
  });
});
