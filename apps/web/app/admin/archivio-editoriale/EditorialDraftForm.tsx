"use client";

import CultureMonumentCard, { type CultureCardData } from "@/components/CultureMonumentCard";
import { useEffect, useState, type ReactNode } from "react";

export default function EditorialDraftForm({ action, message, saved, card, publicExcerpt, sideControls, children }: {
  action: string;
  message?: string;
  saved: boolean;
  card: CultureCardData;
  publicExcerpt: boolean;
  children: ReactNode;
  sideControls: ReactNode;
}) {
  const [title, setTitle] = useState(card.title);
  const [excerpt, setExcerpt] = useState(card.excerpt);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const reset = () => setSaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  const preview = <CultureMonumentCard card={{ ...card, title: title || "Titolo della scheda", excerpt }} />;
  return <div className="editorial-composer">
  <form className="editorial-panel" method="post" action={action} onInput={event => {
    const field = event.target;
    if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.name === "title") setTitle(field.value.trim());
    if (!publicExcerpt && ((field instanceof HTMLTextAreaElement && field.name === "body") || ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.name === "excerpt"))) {
      const fields = new FormData(event.currentTarget);
      setExcerpt(String(fields.get("excerpt") ?? "").trim() || String(fields.get("body") ?? "").trim().slice(0, 240));
    }
  }} onSubmit={event => {
    if (saving) {
      event.preventDefault();
      return;
    }
    setSaving(true);
  }}>
    <input type="hidden" name="action" value="save" />
      <div className="editorial-writing-fields">
        <h2>Contenuto della scheda</h2>
        {children}
      </div>
    <div id="editorial-save" className="editorial-actions" style={{ scrollMarginTop: 100 }}>
      <button className="editorial-button editorial-button--primary" disabled={saving}>
        {saving ? "Salvataggio…" : "Salva bozza"}
      </button>
      {saving ? <span role="status">Salvataggio in corso</span>
        : message && <span role={saved ? "status" : "alert"}>{message}</span>}
    </div>
  </form>
  <aside className="editorial-composer-side">
      <section className="editorial-panel editorial-card-preview editorial-card-preview--desktop" aria-label="Anteprima della card">
        <h2>Anteprima della card</h2>
        {preview}
      </section>
    {sideControls}
  </aside>
  </div>;
}
