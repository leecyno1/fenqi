import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";

export function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function buildRateLimitIdentifier(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(":") || "anonymous";
}

export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const windowStart = new Date(Math.floor(now.getTime() / input.windowMs) * input.windowMs);
  const expiresAt = new Date(windowStart.getTime() + input.windowMs);

  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({
      id: randomUUID(),
      scope: input.scope,
      identifier: input.identifier,
      windowStart,
      count: 1,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.scope, rateLimitBuckets.identifier, rateLimitBuckets.windowStart],
      set: {
        count: sql`${rateLimitBuckets.count} + 1`,
        expiresAt,
        updatedAt: now,
      },
    })
    .returning({
      count: rateLimitBuckets.count,
      expiresAt: rateLimitBuckets.expiresAt,
    });

  const count = bucket?.count ?? input.limit + 1;
  const retryAfterSeconds = Math.max(1, Math.ceil(((bucket?.expiresAt ?? expiresAt).getTime() - now.getTime()) / 1000));

  return {
    limited: count > input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterSeconds,
  };
}

export async function applyRateLimit(input: {
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
  keyParts?: Array<string | null | undefined>;
}) {
  const identifier = buildRateLimitIdentifier([getClientAddress(input.request), ...(input.keyParts ?? [])]);
  const result = await consumeRateLimit({
    scope: input.scope,
    identifier,
    limit: input.limit,
    windowMs: input.windowMs,
  });

  if (!result.limited) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Too many requests.",
      code: "RATE_LIMITED",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
