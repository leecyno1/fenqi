import { z } from "zod";

type RawEnv = Record<string, string | undefined>;

type ParsedServerEnv = {
  nodeEnv: "development" | "test" | "production";
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  appUrl: string;
  cronSecret: string;
  supportEmail: string | null;
  organizationName: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  authAllowPublicSignup: boolean;
  authRequireEmailVerification: boolean;
  icpLicense: string | null;
  publicSecurityLicense: string | null;
};

const nodeEnvSchema = z.enum(["development", "test", "production"]);
const urlSchema = z.string().trim().url();
const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z.string().trim().min(1).optional();

const TEST_DEFAULTS = {
  DATABASE_URL: "postgres://test:test@127.0.0.1:5432/poly_test",
  BETTER_AUTH_SECRET: "test-secret-123456789012345678901234",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  CRON_SECRET: "test-cron-secret-123456",
} as const;

const DEVELOPMENT_DEFAULTS = {
  DATABASE_URL: "postgres://poly:poly@127.0.0.1:5432/poly",
  BETTER_AUTH_SECRET: "local-auth-secret-1234567890123456",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  CRON_SECRET: "development-cron-secret",
} as const;

function withEnvironmentDefaults(env: RawEnv): RawEnv {
  const nodeEnv = env.NODE_ENV ?? "development";

  if (nodeEnv === "test") {
    return {
      ...TEST_DEFAULTS,
      ...env,
    };
  }

  if (nodeEnv !== "production") {
    return {
      ...DEVELOPMENT_DEFAULTS,
      ...env,
    };
  }

  return env;
}

function requireString(env: RawEnv, key: keyof RawEnv) {
  const value = env[key];

  if ((env.NODE_ENV ?? "development") !== "production") {
    if (!value) {
      throw new Error(`${key} is required.`);
    }

    return value;
  }

  const result = nonEmptyString.safeParse(value);
  if (!result.success) {
    throw new Error(`${key} is required.`);
  }

  return result.data;
}

function requireUrl(env: RawEnv, key: keyof RawEnv) {
  const value = env[key];

  if ((env.NODE_ENV ?? "development") !== "production") {
    if (!value) {
      throw new Error(`${key} must be a valid absolute URL.`);
    }

    return value;
  }

  const result = urlSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`${key} must be a valid absolute URL.`);
  }

  return result.data;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

function normalizeOptional(value: string | undefined) {
  const parsed = optionalNonEmptyString.safeParse(value);
  return parsed.success ? parsed.data ?? null : null;
}

export function getServerEnv(input: RawEnv = process.env): ParsedServerEnv {
  const env = withEnvironmentDefaults(input);
  const nodeEnv = nodeEnvSchema.parse(env.NODE_ENV ?? "development");
  const databaseUrl = requireString(env, "DATABASE_URL");
  const betterAuthSecret = requireString(env, "BETTER_AUTH_SECRET");
  const cronSecret = requireString(env, "CRON_SECRET");
  const appUrl = requireUrl(env, "NEXT_PUBLIC_APP_URL");
  const betterAuthUrl = requireUrl(env, "BETTER_AUTH_URL");
  const smtpPortRaw = normalizeOptional(env.SMTP_PORT);
  const smtpPort = smtpPortRaw ? Number.parseInt(smtpPortRaw, 10) : null;

  if (smtpPortRaw && !Number.isFinite(smtpPort)) {
    throw new Error("SMTP_PORT must be a number.");
  }

  return {
    nodeEnv,
    databaseUrl,
    betterAuthSecret,
    betterAuthUrl,
    appUrl,
    cronSecret,
    supportEmail: normalizeOptional(env.SUPPORT_EMAIL),
    organizationName: normalizeOptional(env.APP_ORG_NAME),
    smtpHost: normalizeOptional(env.SMTP_HOST),
    smtpPort,
    smtpUser: normalizeOptional(env.SMTP_USER),
    smtpPassword: normalizeOptional(env.SMTP_PASSWORD),
    smtpFrom: normalizeOptional(env.SMTP_FROM),
    authAllowPublicSignup: parseBoolean(env.AUTH_ALLOW_PUBLIC_SIGNUP, nodeEnv !== "production"),
    authRequireEmailVerification: parseBoolean(env.AUTH_REQUIRE_EMAIL_VERIFICATION, nodeEnv === "production"),
    icpLicense: normalizeOptional(env.APP_ICP_LICENSE),
    publicSecurityLicense: normalizeOptional(env.APP_PUBLIC_SECURITY_LICENSE),
  };
}

export function hasTransactionalEmail(env: ParsedServerEnv) {
  return Boolean(
    env.smtpHost &&
      env.smtpPort &&
      env.smtpUser &&
      env.smtpPassword &&
      env.smtpFrom,
  );
}

export function getAuthPolicy(input: RawEnv = process.env) {
  const env = getServerEnv(input);
  const canSendTransactionalEmail = hasTransactionalEmail(env);
  const allowPublicSignup = canSendTransactionalEmail ? env.authAllowPublicSignup : env.nodeEnv !== "production";
  const requireEmailVerification = canSendTransactionalEmail && allowPublicSignup
    ? env.authRequireEmailVerification
    : false;

  return {
    allowPublicSignup,
    requireEmailVerification,
    canSendTransactionalEmail,
  };
}

export function getPublicSiteConfig(input: RawEnv = process.env) {
  const env = getServerEnv(input);

  return {
    name: "分歧",
    appUrl: env.appUrl,
    supportEmail: env.supportEmail,
    organizationName: env.organizationName,
    icpLicense: env.icpLicense,
    publicSecurityLicense: env.publicSecurityLicense,
  };
}
