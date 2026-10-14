"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function AnalyticsClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor?.href) return;

      const href = anchor.href;
      const label = (anchor.textContent ?? "").trim().slice(0, 120) || null;

      if (href.startsWith("tel:")) {
        track("phone_click", { label });
        return;
      }

      if (/wa\.me|whatsapp\.com/i.test(href)) {
        track("whatsapp_click", { label });
        return;
      }

      if (/instagram\.com/i.test(href)) {
        track("instagram_click", { label });
        return;
      }

      if (/google\.[^/]+\/maps|maps\.google\./i.test(href)) {
        track("directions_click", { label });
        return;
      }

      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin && ["http:", "https:"].includes(url.protocol)) {
          track("website_click", { host: url.hostname, label });
        }
      } catch {
        // Ignore malformed links: analytics must never affect navigation.
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
