"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function OperatorLogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Uscita non disponibile in questo momento.");
      return;
    }

    setLoading(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setLoading(false);
      setError("Non è stato possibile uscire. Riprova.");
      return;
    }

    window.location.replace("/accedi");
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <button className="button ghost" type="button" onClick={() => void logout()} disabled={loading}>
        {loading ? "Uscita…" : "Esci"}
      </button>
      {error && <span role="status" style={{ fontSize: 13 }}>{error}</span>}
    </div>
  );
}
