import type { Metadata } from "next";

import { getPublicSiteConfig } from "@/lib/env";

import "./globals.css";

const siteConfig = getPublicSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: "分歧",
    template: "%s | 分歧",
  },
  description: "中文事件概率站，提供事件、仓位、积分与公开来源驱动的结算记录。",
  applicationName: "分歧",
  openGraph: {
    title: "分歧",
    description: "中文事件概率站，提供事件、仓位、积分与公开来源驱动的结算记录。",
    siteName: "分歧",
    type: "website",
    url: siteConfig.appUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
