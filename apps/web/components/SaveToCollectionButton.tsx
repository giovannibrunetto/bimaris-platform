"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  itemType: string;
  itemId: string;
  interestKey?: string;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
};

export function SaveToCollectionButton({ itemType, itemId, interestKey, buttonClassName, buttonStyle, wrapperStyle }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) { if (active) setLoading(false); return; }
      const auth = await supabase.auth.getUser();
      const user = auth.data.user;
      if (!user) { if (active) setLoading(false); return; }
      const { data } = await supabase
        .from("user_saved_items")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      if (active) { setSaved(Boolean(data)); setLoading(false); }
    })();
    return () => { active = false; };
  }, [itemId, itemType]);

  async function toggleSaved() {
    setLoading(true);
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMessage("Salvataggio non disponibile."); setLoading(false); return; }
    const auth = await supabase.auth.getUser();
    const user = auth.data.user;
    if (!user) {
      window.location.href = `/accedi/utente?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const result = saved
      ? await supabase.from("user_saved_items").delete().eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId)
      : await supabase.from("user_saved_items").insert({ user_id: user.id, item_type: itemType, item_id: itemId });

    if (result.error) {
      setMessage("Non è stato possibile aggiornare la raccolta.");
      setLoading(false);
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setMessage(nextSaved ? "Salvato nella tua raccolta." : "Rimosso dalla tua raccolta.");
    setLoading(false);
    router.refresh();

    if (nextSaved && interestKey) {
      void (async () => {
        const { error } = await supabase.rpc("record_user_behavior", {
          p_event_type: "save_item",
          p_content_type: itemType,
          p_content_id: itemId,
          p_interest_key: interestKey,
          p_weight: 3,
        });
        if (error) console.warn("BIMARIS behavior signal failed", { eventType: "save_item", itemType, itemId, code: error.code });
      })();
    }
  }

  return <div style={{ marginTop: 18, ...wrapperStyle }}>
    <button type="button" className={buttonClassName ?? (saved ? "button" : "button ghost")} style={buttonStyle} onClick={toggleSaved} disabled={loading} aria-pressed={saved}>
      {loading ? "Attendi…" : saved ? "♥ Salvato nella raccolta" : "♡ Salva nella raccolta"}
    </button>
    {message ? <p className="muted" style={{ margin: "9px 0 0", fontSize: 14 }}>{message}</p> : null}
  </div>;
}
