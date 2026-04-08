type AuthEnv = Record<string, string | undefined>;

const LOCAL_ALLOWED_HOSTS = [
  "localhost",
  "localhost:*",
  "127.0.0.1",
  "127.0.0.1:*",
];

function normalizeAbsoluteUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    const normalized = url.toString();

    if (url.pathname === "/" && !url.search && !url.hash) {
      return normalized.replace(/\/$/, "");
    }

    return normalized;
  } catch {
    return undefined;
  }
}

function normalizeVercelUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  const candidate = value.startsWith("http") ? value : `https://${value}`;

  return normalizeAbsoluteUrl(candidate);
}

function toHost(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).host;
  } catch {
    return undefined;
  }
}

export function getAuthClientBaseURL(env: AuthEnv = process.env) {
  return (
    normalizeAbsoluteUrl(env.NEXT_PUBLIC_AUTH_URL) ??
    normalizeAbsoluteUrl(env.NEXT_PUBLIC_BETTER_AUTH_URL)
  );
}

export function buildAuthBaseURLConfig(env: AuthEnv = process.env) {
  const fallback =
    normalizeAbsoluteUrl(env.BETTER_AUTH_URL) ??
    normalizeAbsoluteUrl(env.NEXT_PUBLIC_BETTER_AUTH_URL) ??
    normalizeAbsoluteUrl(env.NEXT_PUBLIC_APP_URL) ??
    normalizeVercelUrl(env.VERCEL_URL);

  const allowedHosts = new Set(LOCAL_ALLOWED_HOSTS);

  for (const value of [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
    normalizeVercelUrl(env.VERCEL_URL),
  ]) {
    const host = toHost(value);

    if (host) {
      allowedHosts.add(host);
    }
  }

  return {
    allowedHosts: [...allowedHosts],
    fallback,
  };
}
