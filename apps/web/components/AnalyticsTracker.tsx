"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { pathname });
  }, [pathname]);
  return null;
}
