import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";

export function ensureCronAuthorization(request: Request) {
  try {
    const env = getServerEnv();
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cron is not configured.",
      },
      { status: 503 },
    );
  }
}
