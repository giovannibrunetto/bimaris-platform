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
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PrelaunchHeader, PrelaunchFooter } from "@/components/PrelaunchChrome";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsClickTracker } from "@/components/AnalyticsClickTracker";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export const metadata: Metadata = {
  title: "BIMARIS — Messina da Vivere",
  description: "Esperienze, sapori e luoghi selezionati per vivere davvero Messina.",
  openGraph: {
    title: "BIMARIS — Messina da Vivere",
    description: "Esperienze, sapori e luoghi selezionati per vivere davvero Messina.",
    images: ["/brand/bimaris-main.jpeg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const prelaunch = isPrelaunchEnabled();
  return (
    <html lang="it">
      <body>
        <Suspense fallback={null}>
        {prelaunch ? <PrelaunchHeader /> : <SiteHeader />}
        <AnalyticsTracker />
        <AnalyticsClickTracker />
        <main>{children}</main>
        {prelaunch ? <PrelaunchFooter /> : <SiteFooter />}
        <ConsentBanner />
        </Suspense>
      </body>
    </html>
  );
}
