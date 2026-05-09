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
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('poly-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
