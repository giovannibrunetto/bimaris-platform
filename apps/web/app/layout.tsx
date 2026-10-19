import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";
import "./map-mobile.css";
import "./personal-access-mobile.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsClickTracker } from "@/components/AnalyticsClickTracker";

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
  return (
    <html lang="it">
      <body>
        <SiteHeader />
        <AnalyticsTracker />
        <AnalyticsClickTracker />
        <main>{children}</main>
        <SiteFooter />
        <ConsentBanner />
      </body>
    </html>
  );
}
