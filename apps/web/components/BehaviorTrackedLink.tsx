"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AnalyticsEventName } from "@/lib/types";

type AnalyticsData = Record<string, string | number | boolean | null>;

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  analyticsEvent?: AnalyticsEventName;
  analyticsData?: AnalyticsData;
  behaviorEvent: string;
  contentType: string;
  contentId: string;
  interestKey: string;
  weight?: number;
  external?: boolean;
};

export function BehaviorTrackedLink({ href, children, className, target, rel, analyticsEvent, analyticsData = {}, behaviorEvent, contentType, contentId, interestKey, weight = 1, external = false }: Props) {
  const handleClick = () => {
    if (analyticsEvent) track(analyticsEvent, analyticsData);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!auth.data.user) return;
      await supabase.rpc("record_user_behavior", {
        p_event_type: behaviorEvent,
        p_content_type: contentType,
        p_content_id: contentId,
        p_interest_key: interestKey,
        p_weight: weight,
      });
    })();
  };

  if (external) return <a className={className} href={href} target={target} rel={rel} onClick={handleClick}>{children}</a>;
  return <Link className={className} href={href} onClick={handleClick}>{children}</Link>;
}
