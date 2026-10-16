"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  contentType: string;
  contentId: string;
  interestKey: string;
  weight?: number;
};

export function UserBehaviorSignal({ contentType, contentId, interestKey, weight = 1 }: Props) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!auth.data.user) return;

      await supabase.rpc("record_user_behavior", {
        p_event_type: "view_detail",
        p_content_type: contentType,
        p_content_id: contentId,
        p_interest_key: interestKey,
        p_weight: weight,
      });
    })();
  }, [contentId, contentType, interestKey, weight]);

  return null;
}
