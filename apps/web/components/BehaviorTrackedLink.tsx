"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AnalyticsEventName } from "@/lib/types";

type AnalyticsData = Record<string, string | number | boolean | null>;

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
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
  operatorId?: string;
  operatorName?: string;
  sourceType?: string;
  sourceId?: string;
  actionType?: string;
};

export function BehaviorTrackedLink({ href, children, className, style, target, rel, analyticsEvent, analyticsData = {}, behaviorEvent, contentType, contentId, interestKey, weight = 1, external = false, operatorId, operatorName, sourceType, sourceId, actionType }: Props) {
  const handleClick = () => {
    const resolvedSourceType = sourceType ?? contentType;
    const resolvedSourceId = sourceId ?? contentId;
    const resolvedActionType = actionType ?? behaviorEvent;

    if (analyticsEvent) {
      track(analyticsEvent, {
        ...analyticsData,
        operator_id: operatorId ?? null,
        operator_name: operatorName ?? null,
        source_type: resolvedSourceType,
        source_id: resolvedSourceId,
        action_type: resolvedActionType,
      });
    }

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
        p_operator_id: operatorId ?? null,
        p_operator_name: operatorName ?? null,
        p_source_type: resolvedSourceType,
        p_source_id: resolvedSourceId,
        p_action_type: resolvedActionType,
      });
    })();
  };

  if (external) return <a className={className} style={style} href={href} target={target} rel={rel} onClick={handleClick}>{children}</a>;
  return <Link className={className} style={style} href={href} onClick={handleClick}>{children}</Link>;
}
