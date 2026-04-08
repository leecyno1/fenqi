import { createHash } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(/* turbopackIgnore: true */ MODULE_DIR, "../../../public/news-cache");

function inferExtension(contentType: string | null, imageUrl: string) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("svg")) return "svg";

  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "png";
  if (pathname.endsWith(".webp")) return "webp";
  if (pathname.endsWith(".gif")) return "gif";
  if (pathname.endsWith(".svg")) return "svg";
  return "jpg";
}

export async function cacheRemoteImage(imageUrl: string) {
  const normalizedUrl = imageUrl.trim();
  if (!normalizedUrl) {
    return null;
  }

  await mkdir(CACHE_DIR, { recursive: true });

  const digest = createHash("sha1").update(normalizedUrl).digest("hex");
  const probePath = path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.jpg`);
  const probeVariants = [
    probePath,
    path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.png`),
    path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.webp`),
    path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.gif`),
    path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.svg`),
  ];

  for (const existingPath of probeVariants) {
    try {
      await stat(existingPath);
      return `/news-cache/${path.basename(existingPath)}`;
    } catch {
      // continue probing
    }
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Failed to cache image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  const extension = inferExtension(contentType, normalizedUrl);
  const filePath = path.join(CACHE_DIR, /* turbopackIgnore: true */ `${digest}.${extension}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
  return `/news-cache/${path.basename(filePath)}`;
}
