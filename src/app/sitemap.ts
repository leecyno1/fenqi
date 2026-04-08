import type { MetadataRoute } from "next";

import { getPublicSiteConfig } from "@/lib/env";

const staticRoutes = ["", "/rules", "/leaderboard", "/privacy", "/terms", "/risk", "/sign-in"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteConfig = getPublicSiteConfig();

  return staticRoutes.map((path) => ({
    url: `${siteConfig.appUrl}${path}`,
    lastModified: new Date(),
  }));
}
