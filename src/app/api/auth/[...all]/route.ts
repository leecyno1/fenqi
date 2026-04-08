import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { getAuthPolicy } from "@/lib/env";
import { applyRateLimit } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);
const limitedAuthRoutes = new Set([
  "sign-in/email",
  "sign-up/email",
  "forget-password",
  "request-password-reset",
  "reset-password",
]);

export const GET = handlers.GET;

export async function POST(
  request: Request,
  context: { params: Promise<{ all?: string[] }> },
) {
  const { all } = await context.params;
  const routeKey = all?.join("/") ?? "";
  const authPolicy = getAuthPolicy();

  if (routeKey === "sign-up/email" && !authPolicy.allowPublicSignup) {
    return new Response(
      JSON.stringify({ error: "Public signup is disabled." }),
      {
        status: 403,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  if (limitedAuthRoutes.has(routeKey)) {
    const rateLimited = await applyRateLimit({
      request,
      scope: `auth:${routeKey}`,
      limit: 8,
      windowMs: 60_000,
    });

    if (rateLimited) {
      return rateLimited;
    }
  }

  return handlers.POST(request);
}
