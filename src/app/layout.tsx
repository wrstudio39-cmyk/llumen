import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/publicData";

// next/font self-hosts these at build time — no runtime request to
// Google, no render-blocking stylesheet fetch, subset + preload
// handled automatically. This is the single biggest typography-related
// speed win available in Next.js.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600; // 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.metaTitle,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.metaDescription,
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.metaTitle,
      description: settings.metaDescription,
      url: siteUrl,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.metaTitle,
      description: settings.metaDescription,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    alternates: { canonical: siteUrl },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2650e8",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: siteUrl,
    description: settings.metaDescription,
    ...(settings.twitterUrl ? { sameAs: [settings.twitterUrl, settings.instagramUrl, settings.facebookUrl].filter(Boolean) } : {}),
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName,
    url: siteUrl,
    // No SearchAction here: the site doesn't have a working `/blog?q=`
    // search endpoint, and Google explicitly recommends against
    // declaring a sitelinks searchbox action for a search feature that
    // doesn't actually exist — it renders in Search Console as valid
    // structured data but degrades trust/CTR if it doesn't work. Add it
    // back if a real search page ever ships.
  };

  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
