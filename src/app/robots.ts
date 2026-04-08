import type { MetadataRoute } from "next";

import { getPublicSiteConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteConfig = getPublicSiteConfig();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.appUrl}/sitemap.xml`,
    host: siteConfig.appUrl,
  };
}
