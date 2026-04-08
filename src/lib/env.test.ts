import { describe, expect, it } from "vitest";

import { getAuthPolicy, getServerEnv } from "./env";

describe("server env", () => {
  it("fails in production when required secrets are missing", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://fenqi.example.com",
        BETTER_AUTH_URL: "https://fenqi.example.com",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("parses required production env when launch settings are complete", () => {
    const env = getServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://fenqi:secret@db.example.com:5432/fenqi",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "https://fenqi.example.com",
      NEXT_PUBLIC_APP_URL: "https://fenqi.example.com",
      CRON_SECRET: "cron-secret-123456",
      SUPPORT_EMAIL: "ops@fenqi.example.com",
      APP_ORG_NAME: "分歧科技",
    });

    expect(env.databaseUrl).toBe("postgres://fenqi:secret@db.example.com:5432/fenqi");
    expect(env.appUrl).toBe("https://fenqi.example.com");
    expect(env.supportEmail).toBe("ops@fenqi.example.com");
  });
});

describe("auth policy", () => {
  it("disables public signup in production when email delivery is unavailable", () => {
    const policy = getAuthPolicy({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://fenqi:secret@db.example.com:5432/fenqi",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "https://fenqi.example.com",
      NEXT_PUBLIC_APP_URL: "https://fenqi.example.com",
      CRON_SECRET: "cron-secret-123456",
    });

    expect(policy.allowPublicSignup).toBe(false);
    expect(policy.requireEmailVerification).toBe(false);
  });

  it("allows verified public signup when smtp is configured and explicitly enabled", () => {
    const policy = getAuthPolicy({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://fenqi:secret@db.example.com:5432/fenqi",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "https://fenqi.example.com",
      NEXT_PUBLIC_APP_URL: "https://fenqi.example.com",
      CRON_SECRET: "cron-secret-123456",
      AUTH_ALLOW_PUBLIC_SIGNUP: "true",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "mailer",
      SMTP_PASSWORD: "password",
      SMTP_FROM: "notify@fenqi.example.com",
    });

    expect(policy.allowPublicSignup).toBe(true);
    expect(policy.requireEmailVerification).toBe(true);
    expect(policy.canSendTransactionalEmail).toBe(true);
  });
});
