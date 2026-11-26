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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [photoAlt, setPhotoAlt] = useState("");
  const [photoAuthor, setPhotoAuthor] = useState("");
  const [photoLicense, setPhotoLicense] = useState("");
  useEffect(() => {
    if (!selectedPhoto) { setLocalPhotoUrl(null); return; }
    const url = URL.createObjectURL(selectedPhoto);
    setLocalPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPhoto]);
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
  const preview = <CultureMonumentCard card={{ ...card, title: title || "Titolo della scheda", excerpt, ...(card.variant === "village" && localPhotoUrl ? { imageUrl: localPhotoUrl, imageAlt: photoAlt || title, imageAuthor: photoAuthor || null, imageLicense: photoLicense || null } : {}) }} />;
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
    <div className="editorial-authoring-controls" onChange={event => {
      if (card.variant !== "village" || !(event.target instanceof HTMLInputElement)) return;
      const field = event.target;
      if (field.name === "photo") {
        const file = field.files?.[0];
        setSelectedPhoto(file && file.size > 0 && file.size <= 3 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type) ? file : null);
      } else if (field.name === "alt") setPhotoAlt(field.value);
      else if (field.name === "author") setPhotoAuthor(field.value);
      else if (field.name === "license") setPhotoLicense(field.value);
    }} onSubmitCapture={event => {
      if (!hasUnsavedFields()) return;
      event.preventDefault();
      setBlocked(true);
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }}>
      {localPhotoUrl && card.variant === "village" && <section className="editorial-panel" aria-label="Anteprima nuova copertina"><h2>Nuova foto selezionata</h2><img src={localPhotoUrl} alt={photoAlt || "Anteprima nuova copertina"} style={{width:"100%", aspectRatio:"16 / 9", objectFit:"cover", borderRadius:12}} /><p role="status">Anteprima locale: salva la foto in bozza per confermarla.</p></section>}
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
