import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "www.reuters.com",
      },
      {
        protocol: "https",
        hostname: "static.reuters.com",
      },
      {
        protocol: "https",
        hostname: "assets.bwbx.io",
      },
      {
        protocol: "https",
        hostname: "images.wsj.net",
      },
      {
        protocol: "https",
        hostname: "dims.apnews.com",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
      },
      {
        protocol: "https",
        hostname: "image.cnbcfm.com",
      },
      {
        protocol: "https",
        hostname: "www.coindesk.com",
      },
      {
        protocol: "https",
        hostname: "img.buzzfeed.com",
      },
      {
        protocol: "https",
        hostname: "ichef.bbci.co.uk",
      },
      {
        protocol: "https",
        hostname: "cdn.vox-cdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
