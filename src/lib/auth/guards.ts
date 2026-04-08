import { getAuthPolicy } from "@/lib/env";

export type AccessUser = {
  userId: string;
  role: string;
  emailVerified: boolean;
};

export function canAccessPortfolio(user: AccessUser | null): user is AccessUser {
  const policy = getAuthPolicy();

  if (!user?.userId) {
    return false;
  }

  return policy.requireEmailVerification ? user.emailVerified : true;
}

export function canAccessAdmin(
  user: AccessUser | null,
): user is AccessUser & { role: "admin" } {
  return canAccessPortfolio(user) && user.role === "admin";
}
