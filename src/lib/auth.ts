import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db/client";
import {
  accounts,
  sessions,
  users,
  verifications,
  virtualWallets,
  walletLedger,
} from "@/db/schema";
import { buildInitialWalletArtifacts } from "@/lib/auth/bootstrap";
import { buildAuthBaseURLConfig } from "@/lib/auth/config";
import { sendPasswordResetEmailMessage, sendVerificationEmailMessage } from "@/lib/auth/transactional-email";
import { getAuthPolicy, getServerEnv } from "@/lib/env";

const authBaseURLConfig = buildAuthBaseURLConfig();
const env = getServerEnv();
const authPolicy = getAuthPolicy();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  baseURL: authBaseURLConfig,
  secret: env.betterAuthSecret,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: authPolicy.requireEmailVerification,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: authPolicy.canSendTransactionalEmail
      ? async ({ user, url }) => {
          await sendPasswordResetEmailMessage({
            email: user.email,
            url,
          });
        }
      : undefined,
  },
  emailVerification: authPolicy.canSendTransactionalEmail
    ? {
        sendOnSignUp: authPolicy.requireEmailVerification,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          await sendVerificationEmailMessage({
            email: user.email,
            url,
          });
        },
      }
    : undefined,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const artifacts = buildInitialWalletArtifacts({
            userId: user.id,
          });

          await db
            .insert(virtualWallets)
            .values(artifacts.wallet)
            .onConflictDoNothing();

          await db
            .insert(walletLedger)
            .values(artifacts.ledger)
            .onConflictDoNothing();
        },
      },
    },
  },
});
