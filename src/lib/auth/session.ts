import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canAccessAdmin, canAccessPortfolio, type AccessUser } from "@/lib/auth/guards";

export type AppSession = AccessUser & {
  name: string;
  email: string;
};

function isProductionBuildMissingServerConfig(error: unknown) {
  return (
    process.env.NEXT_PHASE === "phase-production-build" &&
    error instanceof Error &&
    /DATABASE_URL|BETTER_AUTH_SECRET|BETTER_AUTH_URL/i.test(error.message)
  );
}

export async function getOptionalSession(): Promise<AppSession | null> {
  let session;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    if (isProductionBuildMissingServerConfig(error)) {
      return null;
    }

    throw error;
  }

  if (!session) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
  };
}

export async function requirePortfolioSession(next = "/portfolio") {
  const session = await getOptionalSession();

  if (!canAccessPortfolio(session)) {
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  return session;
}

export async function requireAdminSession(next = "/admin") {
  const session = await getOptionalSession();

  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  if (!canAccessAdmin(session)) {
    redirect("/forbidden");
  }

  return session;
}
