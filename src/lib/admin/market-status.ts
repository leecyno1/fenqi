import { z } from "zod";

const marketStatusValues = ["draft", "review", "live", "locked"] as const;

export const quickStatusOptions = marketStatusValues;

const marketStatusSchema = z.object({
  status: z.enum(marketStatusValues),
});

export function parseAdminMarketStatusInput(input: { status: string }) {
  return marketStatusSchema.parse(input);
}
