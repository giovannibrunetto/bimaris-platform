"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function EditorialDraftForm({ action, message, saved, children }: {
  action: string;
  message?: string;
  saved: boolean;
  children: ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const reset = () => setSaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return <form className="editorial-panel" method="post" action={action} onSubmit={event => {
    if (saving) {
      event.preventDefault();
      return;
    }
    setSaving(true);
  }}>
    <input type="hidden" name="action" value="save" />
    {children}
    <div id="editorial-save" className="editorial-actions" style={{ scrollMarginTop: 100 }}>
      <button className="editorial-button editorial-button--primary" disabled={saving}>
        {saving ? "Salvataggio…" : "Salva bozza"}
      </button>
      {saving ? <span role="status">Salvataggio in corso</span>
        : message && <span role={saved ? "status" : "alert"}>{message}</span>}
    </div>
  </form>;
}
