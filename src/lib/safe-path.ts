export function normalizeInternalPath(input: string | null | undefined, fallback = "/") {
  if (!input) {
    return fallback;
  }

  try {
    const parsed = new URL(input, "http://localhost");

    if (parsed.origin !== "http://localhost") {
      return fallback;
    }

    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return normalized.startsWith("/") ? normalized : fallback;
  } catch {
    return fallback;
  }
}
