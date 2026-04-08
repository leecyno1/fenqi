import type { MarketTopicKey } from "@/lib/data/views";

const TOPIC_FALLBACK_IMAGES: Record<MarketTopicKey, string> = {
  politics: "/event-photo/politics.jpg",
  world: "/event-photo/world.jpg",
  sports: "/event-photo/sports.jpg",
  crypto: "/event-photo/crypto.jpg",
  finance: "/event-photo/finance.jpg",
  tech: "/event-photo/tech.jpg",
  culture: "/event-photo/culture.jpg",
};

const LEGACY_EVENT_ART_PATH = /\/event-art\/.+\.svg(?:\?.*)?$/i;
const SVG_IMAGE_PATH = /\.svg(?:\?.*)?$/i;

export type MarketImageInput =
  | string
  | null
  | undefined
  | {
      manualImage?: string | null;
      newsImageCachedUrl?: string | null;
      newsImageUrl?: string | null;
      externalImageUrl?: string | null;
    };

function pickImage(value?: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  // Production rule: legacy vector icons are never valid event photos.
  if (LEGACY_EVENT_ART_PATH.test(normalized) || SVG_IMAGE_PATH.test(normalized)) {
    return null;
  }

  return normalized;
}

export function resolveMarketImageUrl(
  slug: string,
  topicKey: MarketTopicKey,
  image?: MarketImageInput,
) {
  const imageInput =
    typeof image === "string" || image == null
      ? {
          manualImage: image,
          newsImageCachedUrl: null,
          newsImageUrl: null,
          externalImageUrl: null,
        }
      : image;

  const preferredImage =
    pickImage(imageInput.manualImage) ??
    pickImage(imageInput.newsImageCachedUrl) ??
    pickImage(imageInput.newsImageUrl);

  if (preferredImage) {
    return preferredImage;
  }

  if (slug.startsWith("crypto-")) {
    return "/event-photo/crypto.jpg";
  }

  if (slug.startsWith("sports-")) {
    return "/event-photo/sports.jpg";
  }

  if (slug.startsWith("finance-") || slug.includes("fed-")) {
    return "/event-photo/finance.jpg";
  }

  return TOPIC_FALLBACK_IMAGES[topicKey];
}
