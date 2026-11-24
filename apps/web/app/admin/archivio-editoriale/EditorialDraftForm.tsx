"use client";

import CultureMonumentCard, { type CultureCardData } from "@/components/CultureMonumentCard";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function EditorialDraftForm({ action, message, saved, card, publicExcerpt, photoControls, publicationControls, children }: {
  action: string;
  message?: string;
  saved: boolean;
  card: CultureCardData;
  publicExcerpt: boolean;
  children: ReactNode;
  photoControls: ReactNode;
  publicationControls: ReactNode;
}) {
  const [title, setTitle] = useState(card.title);
  const [excerpt, setExcerpt] = useState(card.excerpt);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const draftForm = useRef<HTMLFormElement>(null);
  const initialFields = useRef<string | null>(null);
  function fingerprint(form: HTMLFormElement) {
    return JSON.stringify(Array.from(new FormData(form).entries()));
  }
  function hasUnsavedFields() {
    return dirty || (draftForm.current !== null && initialFields.current !== null && fingerprint(draftForm.current) !== initialFields.current);
  }
  useEffect(() => {
    if (draftForm.current) initialFields.current = fingerprint(draftForm.current);
    const reset = () => setSaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  const preview = <CultureMonumentCard card={{ ...card, title: title || "Titolo della scheda", excerpt }} />;
  return <div className="editorial-composer">
  <form id="editorial-text-form" ref={draftForm} className="editorial-panel" method="post" action={action} onInput={event => {
    setDirty(true);
    setBlocked(false);
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
  </form>
  <aside className="editorial-composer-side">
      <section className="editorial-panel editorial-card-preview editorial-card-preview--desktop" aria-label="Anteprima della card">
        <h2>Anteprima della card</h2>
        {preview}
      </section>
    <div className="editorial-authoring-controls" onSubmitCapture={event => {
      if (!hasUnsavedFields()) return;
      event.preventDefault();
      setBlocked(true);
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }}>
      {photoControls}
    </div>
    <div id="editorial-save" className="editorial-actions" style={{ scrollMarginTop: 100 }}>
      <button className="editorial-button editorial-button--primary" type="submit" form="editorial-text-form" disabled={saving}>
        {saving ? "Salvataggio…" : "Salva bozza"}
      </button>
      {blocked ? <span role="alert">Salva le modifiche prima di allegare una foto o pubblicare.</span> : saving ? <span role="status">Salvataggio in corso</span>
        : message && <span role={saved ? "status" : "alert"}>{message}</span>}
    </div>
    <div className="editorial-publication-controls" onSubmitCapture={event => {
      if (!hasUnsavedFields()) return;
      event.preventDefault();
      setBlocked(true);
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }}>
      {publicationControls}
    </div>
  </aside>
  </div>;
}
