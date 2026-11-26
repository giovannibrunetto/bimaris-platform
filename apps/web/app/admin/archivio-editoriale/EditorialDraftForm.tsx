"use client";

import CultureMonumentCard, { type CultureCardData } from "@/components/CultureMonumentCard";
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { prepareEditorialPhoto } from "./prepareEditorialPhoto";

export default function EditorialDraftForm({ action, message, saved, card, publicExcerpt, photoControls, publicationControls, children, notices, unifiedVillageSave = false }: {
  action: string;
  message?: string;
  saved: boolean;
  card: CultureCardData;
  publicExcerpt: boolean;
  notices: Record<string, string>;
  unifiedVillageSave?: boolean;
  children: ReactNode;
  photoControls: ReactNode;
  publicationControls: ReactNode;
}) {
  const [title, setTitle] = useState(card.title);
  const [excerpt, setExcerpt] = useState(card.excerpt);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [photoAlt, setPhotoAlt] = useState("");
  const [photoAuthor, setPhotoAuthor] = useState("");
  const [photoLicense, setPhotoLicense] = useState("");
  const photoReader = useRef<FileReader | null>(null);
  const [photoError, setPhotoError] = useState("");
  useEffect(() => () => { if (photoReader.current?.readyState === FileReader.LOADING) photoReader.current.abort(); }, []);
  const draftForm = useRef<HTMLFormElement>(null);
  const initialFields = useRef<string | null>(null);
  async function submitPreservingFields(event: FormEvent<HTMLFormElement> | FormEvent<HTMLDivElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const fields = new FormData(form, submitter instanceof HTMLElement ? submitter : undefined);
    inFlight.current = true;
    setSaving(true);
    setSaveError("");
    setBlocked(false);
    try {
      const file = fields.get("photo");
      if (file instanceof File && (file.name || file.size)) {
        fields.set("photo", await prepareEditorialPhoto(file));
      }
      const response = await fetch(form.action, { method: "POST", body: fields, credentials: "same-origin", headers: { Accept: "application/json" }, redirect: "error" });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const explanation = response.status === 403 ? "Sessione o autorizzazione non valida. Non chiudere questa pagina." : response.status === 413 ? "La richiesta è troppo grande." : notices[result?.state] || "Il salvataggio non è stato confermato.";
        throw new Error(explanation);
      }
      const destination = new URL(result.redirect, window.location.origin);
      if (destination.origin !== window.location.origin || destination.pathname !== "/admin/archivio-editoriale") throw new Error("Salvataggio non confermato. Verifica lo stato della scheda prima di riprovare.");
      window.location.assign(destination.href);
      return;
    } catch (error) {
      setSaveError(`${error instanceof Error ? error.message : "Errore di connessione."} I campi compilati restano disponibili in questa pagina.`);
      setSaving(false);
      inFlight.current = false;
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }
  }
  function fingerprint(form: HTMLFormElement) {
    return JSON.stringify(Array.from(new FormData(form).entries()));
  }
  function hasUnsavedFields() {
    return dirty || (draftForm.current !== null && initialFields.current !== null && fingerprint(draftForm.current) !== initialFields.current);
  }
  useEffect(() => {
    if (draftForm.current) initialFields.current = fingerprint(draftForm.current);
    const reset = () => { setSaving(false); inFlight.current = false; };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  const preview = <CultureMonumentCard card={{ ...card, title: title || "Titolo della scheda", excerpt, ...(card.variant === "village" && localPhotoUrl ? { imageUrl: localPhotoUrl, imageAlt: photoAlt || title, imageAuthor: photoAuthor || null, imageLicense: photoLicense || null } : {}) }} />;
  return <div className="editorial-composer">
  <form id="editorial-text-form" ref={draftForm} inert={saving} className="editorial-panel" method="post" action={action} encType={unifiedVillageSave ? "multipart/form-data" : undefined} onInput={event => {
    setDirty(true);
    setBlocked(false);
    const field = event.target;
    if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.name === "title") setTitle(field.value.trim());
    if (!publicExcerpt && ((field instanceof HTMLTextAreaElement && field.name === "body") || ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.name === "excerpt"))) {
      const fields = new FormData(event.currentTarget);
      setExcerpt(String(fields.get("excerpt") ?? "").trim() || String(fields.get("body") ?? "").trim().slice(0, 240));
    }
  }} onSubmit={submitPreservingFields}>
    <input type="hidden" name="action" value="save" />
      <div className="editorial-writing-fields">
        <h2>Contenuto della scheda</h2>
        {children}
      </div>
  </form>
  <aside className="editorial-composer-side">
      <section className={`editorial-panel editorial-card-preview ${card.variant === "village" ? "" : "editorial-card-preview--desktop"}`} aria-label="Anteprima della card">
        <h2>Anteprima della card</h2>
        {preview}
      </section>
    <div className="editorial-authoring-controls" inert={saving} onChangeCapture={event => {
      if (card.variant !== "village" || !(event.target instanceof HTMLInputElement)) return;
      const field = event.target;
      if (unifiedVillageSave && ["photo","alt","author","source","license","licenseUrl"].includes(field.name)) { setDirty(true); setBlocked(false); }
      if (field.name === "photo") {
        const file = field.files?.[0];
        if (photoReader.current?.readyState === FileReader.LOADING) photoReader.current.abort();
        setLocalPhotoUrl(null);
        setPhotoError("");
        if (!file) return;
        if (!file.size || file.size > 30 * 1024 * 1024) {
          setPhotoError("Seleziona una fotografia non vuota, fino a 30 MiB prima della compressione.");
          return;
        }
        const reader = new FileReader();
        photoReader.current = reader;
        reader.onload = () => { if (photoReader.current === reader && typeof reader.result === "string") setLocalPhotoUrl(reader.result); };
        reader.onerror = () => { if (photoReader.current === reader) setPhotoError("Impossibile leggere la fotografia selezionata."); };
        reader.readAsDataURL(file);
      } else if (field.name === "alt") setPhotoAlt(field.value);
      else if (field.name === "author") setPhotoAuthor(field.value);
      else if (field.name === "license") setPhotoLicense(field.value);
    }} onSubmitCapture={event => {
      if (!hasUnsavedFields()) { void submitPreservingFields(event); return; }
      event.preventDefault();
      setBlocked(true);
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }}>
      {photoError && <p role="alert">{photoError}</p>}
      {photoControls}
      {localPhotoUrl && card.variant === "village" && <p role="status">Anteprima aggiornata. {unifiedVillageSave ? "Salva bozza per confermare tutte le modifiche." : "Salva la foto in bozza per confermarla."}</p>}
    </div>
    <div id="editorial-save" className="editorial-actions" style={{ scrollMarginTop: 100 }}>
      <button className="editorial-button editorial-button--primary" type="submit" form="editorial-text-form" disabled={saving}>
        {saving ? "Salvataggio…" : "Salva bozza"}
      </button>
      {saveError ? <span role="alert">{saveError}</span> : blocked ? <span role="alert">{unifiedVillageSave ? "Salva la bozza prima di pubblicare." : "Salva le modifiche prima di allegare una foto o pubblicare."}</span> : saving ? <span role="status">Salvataggio in corso</span>
        : message && <span role={saved ? "status" : "alert"}>{message}</span>}
    </div>
    <div className="editorial-publication-controls" inert={saving} onSubmitCapture={event => {
      if (!hasUnsavedFields()) { void submitPreservingFields(event); return; }
      event.preventDefault();
      setBlocked(true);
      document.getElementById("editorial-save")?.scrollIntoView({ block: "center" });
    }}>
      {publicationControls}
    </div>
  </aside>
  </div>;
}
