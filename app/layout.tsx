import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MotionReady } from "@/components/motion/MotionReady";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, jsonLd, siteUrl } from "@/lib/site";
import "lenis/dist/lenis.css";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

const THEME_INIT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/**
 * Entrance animations start hidden (globals.css, `motion-ok`) so they can play without a flash. Not for people who
 * asked for reduced motion; and if the page's scripts have not said they are running (window.__motionReady, set by
 * MotionReady) within 4 seconds, `motion-fallback` shows everything.
 */
const MOTION_INIT = `try{var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion-ok");setTimeout(function(){if(!window.__motionReady)d.classList.add("motion-fallback")},4000)}}catch(e){}`;

const TITLE = `${SITE_NAME}: discounts and bank-card deals in Pakistan`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  other: { "geo.region": "PK", "geo.placename": "Pakistan" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

/** Who we are and how to search us, for search engines and AI assistants (schema.org, read from the page source). */
function SiteStructuredData() {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: SITE_NAME,
        alternateName: SITE_TAGLINE,
        url,
        description: SITE_DESCRIPTION,
        inLanguage: ["en-PK", "ur-PK"],
        publisher: { "@id": `${url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${url}/?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: SITE_NAME,
        url,
        logo: `${url}/icon.svg`,
        areaServed: { "@type": "Country", name: "Pakistan" },
        description: SITE_DESCRIPTION,
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint so the saved theme never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT + MOTION_INIT }} />
        <SiteStructuredData />
      </head>
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <MotionReady />
        {children}
        {/* Vercel: visitors and page views, and real-user speed (Core Web Vitals). Both send nothing in development. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
