const ALLOWED_IMAGE_HOSTS = new Set([
  "polymarket-upload.s3.us-east-2.amazonaws.com",
  "polymarket-upload.s3.amazonaws.com",
  "www.reuters.com",
  "static.reuters.com",
  "assets.bwbx.io",
  "images.wsj.net",
  "dims.apnews.com",
  "a.espncdn.com",
  "image.cnbcfm.com",
  "www.coindesk.com",
  "img.buzzfeed.com",
  "ichef.bbci.co.uk",
  "cdn.vox-cdn.com",
  "images.unsplash.com",
]);

export function isAllowedImageProxyUrl(imageUrl: string) {
  try {
    const parsed = new URL(imageUrl);
    return parsed.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function buildImageProxyUrl(imageUrl: string | null | undefined) {
  const normalized = imageUrl?.trim();
  if (!normalized || !isAllowedImageProxyUrl(normalized)) {
    return null;
  }

  return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
}
