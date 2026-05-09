import { NextResponse } from "next/server";

import { getPublicSiteConfig } from "@/lib/env";

function tryParseOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getTrustedWriteOrigins(request: Request) {
  const trustedOrigins = new Set<string>();
  const configuredOrigin = tryParseOrigin(getPublicSiteConfig().appUrl);
  const requestOrigin = process.env.NODE_ENV === "production" ? null : tryParseOrigin(request.url);
  const extraOrigins = (process.env.APP_TRUSTED_WRITE_ORIGINS ?? "")
    .split(",")
    .map((value) => tryParseOrigin(value.trim()))
    .filter((origin): origin is string => Boolean(origin));

  if (configuredOrigin) {
    trustedOrigins.add(configuredOrigin);
  }

  for (const origin of extraOrigins) {
    trustedOrigins.add(origin);
  }

  if (requestOrigin) {
    trustedOrigins.add(requestOrigin);
  }

  return trustedOrigins;
}

export function hasTrustedWriteOrigin(request: Request) {
  const origin = tryParseOrigin(request.headers.get("origin"));
  const referer = tryParseOrigin(request.headers.get("referer"));
  const trustedOrigins = getTrustedWriteOrigins(request);

  if (origin) {
    return trustedOrigins.has(origin);
  }

  if (referer) {
    return trustedOrigins.has(referer);
  }

  return process.env.NODE_ENV !== "production";
}

export function enforceTrustedWriteOrigin(request: Request) {
  if (hasTrustedWriteOrigin(request)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Untrusted request origin.",
      code: "UNTRUSTED_ORIGIN",
    },
    { status: 403 },
  );
}
