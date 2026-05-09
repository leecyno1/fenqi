import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";
import { getAuthPolicy } from "@/lib/env";
import { applyRateLimit } from "@/lib/rate-limit";
import { enforceTrustedWriteOrigin } from "@/lib/request-integrity";

const limitedAuthRoutes = new Set([
  "sign-in/email",
  "sign-up/email",
  "forget-password",
  "request-password-reset",
  "reset-password",
]);

function getHandlers() {
  return toNextJsHandler(getAuth());
}

export async function GET(request: Request) {
  return getHandlers().GET(request);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ all?: string[] }> },
) {
  const untrustedOrigin = enforceTrustedWriteOrigin(request);
  if (untrustedOrigin) {
    return untrustedOrigin;
  }

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

  return getHandlers().POST(request);
}
