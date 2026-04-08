import { z } from "zod";

const resolutionSchema = z.object({
  outcome: z.enum(["YES", "NO", "VOID"]),
  sourceLabel: z.string().trim().min(1),
  sourceUrl: z.url(),
  rationale: z.string().trim().optional().transform((value) => value || undefined),
});

export function parseAdminResolutionInput(input: unknown) {
  return resolutionSchema.parse(input);
}
