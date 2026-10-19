"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const immersiveRoutes = new Set([
  "/accedi/utente",
  "/profilo/onboarding",
]);

export function SiteHeader() {
  const pathname = usePathname();
  if (immersiveRoutes.has(pathname)) return null;
  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (immersiveRoutes.has(pathname)) return null;
  return <Footer />;
}
