"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const immersiveRoutes = new Set([
  "/accedi/utente",
  "/profilo/onboarding",
]);

const prelaunch = process.env.NEXT_PUBLIC_BIMARIS_PRELAUNCH_MODE === "true";

export function SiteHeader() {
  const pathname = usePathname();
  if (prelaunch && (pathname === "/in-arrivo" || pathname === "/operatori/candidatura")) return null;
  if (immersiveRoutes.has(pathname)) return null;
  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (prelaunch && (pathname === "/in-arrivo" || pathname === "/operatori/candidatura")) return null;
  if (immersiveRoutes.has(pathname)) return null;
  return <Footer />;
}
