import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./brand.css";
import "./map-mobile.css";
import "./map-mobile-layout-fix.css";
import "./personal-access-mobile.css";
import "./home-mobile.css";
import "./home-polish.css";
import "./onboarding-polish.css";
import "./profile-polish.css";
import "./foundation.css";
import "./home-a3.css";
import "./a11-foundation.css";
import "./map-route-polish.css";
import "./section-hero-uniform.css";
import "./culture-detail-compact.css";
import "./ux-brand-05-hero.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsClickTracker } from "@/components/AnalyticsClickTracker";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";
import { SITE_URL, publicRobotsMetadata, serializeJsonLd } from "@/lib/seo";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "BIMARIS",
  url: SITE_URL,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "BIMARIS",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "it-IT",
};

export function generateMetadata(): Metadata {
  const prelaunch = isPrelaunchEnabled();

  return {
    metadataBase: new URL(SITE_URL),
    title: prelaunch ? "BIMARIS STA ARRIVANDO" : "BIMARIS",
    description: prelaunch
      ? "BIMARIS STA ARRIVANDO"
      : "Scopri esperienze, luoghi, percorsi e operatori del territorio con BIMARIS.",
    robots: publicRobotsMetadata(),
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const prelaunch = isPrelaunchEnabled();
  return (
    <html lang="it">
      <body>
        <script id="bimaris-organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }} />
        <script id="bimaris-website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }} />
        {prelaunch ? (
          <main><Suspense fallback={null}>{children}</Suspense></main>
        ) : (
          <Suspense fallback={null}>
            <SiteHeader />
            <AnalyticsTracker />
            <AnalyticsClickTracker />
            <main>{children}</main>
            <SiteFooter />
            <ConsentBanner />
          </Suspense>
        )}
      </body>
    </html>
  );
}
