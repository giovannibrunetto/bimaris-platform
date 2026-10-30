import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./brand.css";
import "./map-mobile.css";
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
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsClickTracker } from "@/components/AnalyticsClickTracker";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export function generateMetadata(): Metadata {
  const prelaunch = isPrelaunchEnabled();

  return {
    title: prelaunch ? "BIMARIS STA ARRIVANDO" : "BIMARIS",
    description: prelaunch
      ? "BIMARIS STA ARRIVANDO"
      : "Scopri esperienze, luoghi, percorsi e operatori del territorio con BIMARIS.",
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const prelaunch = isPrelaunchEnabled();
  return (
    <html lang="it">
      <body>
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
