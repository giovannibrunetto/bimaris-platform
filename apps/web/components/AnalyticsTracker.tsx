"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

function slugFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean).at(-1) ?? "";
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    track("page_view", { pathname });

    if (pathname === "/mappa") {
      track("map_open");
      return;
    }

    if (/^\/operatori\/[^/]+$/.test(pathname) && pathname !== "/operatori/candidatura") {
      track("operator_view", { slug: slugFromPath(pathname) });
      return;
    }

    if (/^\/esperienze\/[^/]+$/.test(pathname)) {
      track("experience_view", { slug: slugFromPath(pathname) });
      return;
    }

    if (/^\/itinerari\/[^/]+$/.test(pathname)) {
      track("itinerary_view", { slug: slugFromPath(pathname) });
    }
  }, [pathname]);

  return null;
}
