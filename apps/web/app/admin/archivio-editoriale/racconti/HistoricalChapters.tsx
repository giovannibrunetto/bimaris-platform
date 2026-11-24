"use client";

import { useEffect, useRef, useState } from "react";
import type { CultureStory, CultureStoryChapter } from "@/data/ti-racconto-messina";

type Chapter = { key: number; title: string; body: string; slug: string; placeTitle: string; transition: string };
type General = { title: string; subtitle: string; theme: string; intro: string; conclusion: string };
type Panel = "general" | "intro" | "conclusion" | number | null;

function chapterFields(chapter: CultureStoryChapter, key: number): Chapter {
  return { key, title: chapter.title, body: chapter.paragraphs.join("\n\n"), slug: chapter.slug ?? "", placeTitle: chapter.placeTitle, transition: chapter.transition.join("\n\n") };
}

export default function HistoricalChapters({ draft, places }: {
  draft: Partial<CultureStory>;
  places: { slug: string; title: string }[];
}) {
  const [general, setGeneral] = useState<General>(() => ({
    title: draft.title ?? "", subtitle: draft.subtitle ?? "", theme: draft.theme ?? "",
    intro: draft.intro?.join("\n\n") ?? "", conclusion: draft.conclusion?.join("\n\n") ?? "",
  }));
  const [items, setItems] = useState<Chapter[]>(() => (draft.chapters ?? []).map(chapterFields));
  const nextKey = useRef(items.length);
  const [panel, setPanel] = useState<Panel>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const saving = useRef(false);
  const chapter = typeof panel === "number" ? items.find(item => item.key === panel) : undefined;

  useEffect(() => {
    const form = root.current?.closest("form");
    const publication = document.getElementById("historical-publication");
    const leave = (event: BeforeUnloadEvent) => {
      if (!dirty || saving.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const save = (event: Event) => {
      if (root.current?.dataset.mode === "focus") { event.preventDefault(); return; }
      saving.current = true;
    };
    const reset = () => { saving.current = false; };
    const guard = (event: Event) => {
      if (!dirty) return;
      event.preventDefault();
      setNotice("Salva la bozza prima di pubblicare, ritirare o archiviare.");
      document.getElementById("historical-save")?.scrollIntoView({ block: "center" });
    };
    const navigation = (event: MouseEvent) => {
      if (!dirty || saving.current || !(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!link || !link.closest(".historical-editorial")) return;
      if (window.confirm("Le modifiche non sono salvate. Vuoi uscire comunque?")) {
        saving.current = true;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    form?.addEventListener("submit", save);
    publication?.addEventListener("submit", guard, true);
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pageshow", reset);
    document.addEventListener("click", navigation, true);
    return () => {
      form?.removeEventListener("submit", save);
      publication?.removeEventListener("submit", guard, true);
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pageshow", reset);
      document.removeEventListener("click", navigation, true);
    };
  }, [dirty]);

  function editGeneral(key: keyof General, value: string) {
    setGeneral(current => ({ ...current, [key]: value }));
    setDirty(true);
  }
  function editChapter(key: number, field: keyof Omit<Chapter, "key">, value: string) {
    setItems(current => current.map(item => item.key === key ? { ...item, [field]: value } : item));
    setDirty(true);
  }
  function move(key: number, target: number) {
    setItems(current => {
      const from = current.findIndex(item => item.key === key);
      if (from < 0 || target < 0 || target >= current.length || from === target) return current;
      const next = [...current];
      next.splice(target, 0, next.splice(from, 1)[0]);
      return next;
    });
    setDirty(true);
  }
  function open(next: Panel) {
    setPanel(next);
    setNotice("");
    requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start" }));
  }
  function add() {
    if (items.length >= 30) return;
    const key = nextKey.current++;
    setItems(current => [...current, { key, title: "", body: "", slug: "", placeTitle: "", transition: "" }]);
    setDirty(true);
    open(key);
  }

  const linkedTitle = (item: Chapter) => places.find(place => place.slug === item.slug)?.title ?? item.slug;
  const row = (label: string, description: string, target: Panel, symbol: string) =>
    <button type="button" className="historical-index-row" onClick={() => open(target)}>
      <span className="historical-index-symbol" aria-hidden="true">{symbol}</span>
      <span className="historical-index-copy"><strong>{label}</strong><small>{description}</small></span>
    </button>;

  return <div ref={root} className="historical-index" id="historical-index" data-mode={panel === null ? "index" : "focus"}>
    {/* Serialize exactly once, in current order, independently of the active editor. */}
    {Object.entries(general).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    {items.map(item => <div key={item.key} hidden>
      <input type="hidden" name="chapterTitle" value={item.title} />
      <input type="hidden" name="chapterBody" value={item.body} />
      <input type="hidden" name="chapterSlug" value={item.slug} />
      <input type="hidden" name="chapterPlaceTitle" value={item.placeTitle} />
      <input type="hidden" name="chapterTransition" value={item.transition} />
    </div>)}
    {dirty && <p className="historical-dirty" role="status">Modifiche non ancora salvate</p>}
    {notice && <p className="editorial-notice" role="alert">{notice}</p>}
    {panel === null ? <>
      {row("Informazioni generali", "Titolo, presentazione ed epoca", "general", "▤")}
      <section className="historical-index-section" aria-label="Struttura del racconto">
        <div className="historical-index-heading"><h2>Struttura del racconto</h2><small>{items.length} {items.length === 1 ? "capitolo" : "capitoli"}</small></div>
        {row("Apertura", general.intro.trim() ? "Introduzione narrativa" : "Da completare", "intro", "≡")}
        {items.map((item, index) => <div key={item.key} className="historical-index-chapter">
          <button type="button" className="historical-index-row" onClick={() => open(item.key)}>
            <span className="historical-index-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="historical-index-copy"><strong>{item.title || "Capitolo senza titolo"}</strong><small>{linkedTitle(item) || "Capitolo"}</small></span>
          </button>
          <div className="historical-reorder">
            <button type="button" aria-label={`Sposta capitolo ${index + 1} su`} disabled={index === 0} onClick={() => move(item.key, index - 1)}>↑</button>
            <button type="button" aria-label={`Sposta capitolo ${index + 1} giù`} disabled={index === items.length - 1} onClick={() => move(item.key, index + 1)}>↓</button>
          </div>
        </div>)}
        <button type="button" className="historical-add" disabled={items.length >= 30} onClick={add}>＋ Aggiungi capitolo</button>
        {row("Conclusione", general.conclusion.trim() ? "Chiusura narrativa" : "Da completare", "conclusion", "≡")}
      </section>
    </> : <section className="historical-focus">
      <div className="historical-focus-head">
        <button type="button" onClick={() => open(null)}>← Struttura del racconto</button>
        <h2>{chapter ? `Capitolo ${String(items.findIndex(item => item.key === chapter.key) + 1).padStart(2, "0")}` : panel === "general" ? "Informazioni generali" : panel === "intro" ? "Apertura" : "Conclusione"}</h2>
      </div>
      <div className="historical-focus-fields">
        {panel === "general" && <>
          <label>Titolo del racconto<textarea rows={2} maxLength={180} value={general.title} onChange={e => editGeneral("title", e.target.value)} /></label>
          <label>Testo breve della card<textarea rows={3} maxLength={400} value={general.subtitle} onChange={e => editGeneral("subtitle", e.target.value)} /></label>
          <label>Epoca o tema<input maxLength={160} value={general.theme} onChange={e => editGeneral("theme", e.target.value)} /></label>
        </>}
        {(panel === "intro" || panel === "conclusion") && <label>Testo narrativo<textarea rows={10} maxLength={20000} value={general[panel]} onChange={e => editGeneral(panel, e.target.value)} /></label>}
        {chapter && <>
          <label>Titolo del capitolo<textarea rows={2} maxLength={220} value={chapter.title} onChange={e => editChapter(chapter.key, "title", e.target.value)} /></label>
          <label>Testo narrativo<textarea rows={9} maxLength={12000} value={chapter.body} onChange={e => editChapter(chapter.key, "body", e.target.value)} /></label>
          <details className="historical-focus-details">
            <summary>Luogo collegato <small>{linkedTitle(chapter) || "Nessun collegamento"}</small></summary>
            <label>Scheda Cultura<select value={chapter.slug} onChange={e => editChapter(chapter.key, "slug", e.target.value)}>
              <option value="">Nessun collegamento</option>
              {chapter.slug && !places.some(place => place.slug === chapter.slug) && <option value={chapter.slug}>{chapter.slug} (non pubblicata)</option>}
              {places.map(place => <option key={place.slug} value={place.slug}>{place.title}</option>)}
            </select></label>
            <label>Nome del luogo nel racconto<input maxLength={220} value={chapter.placeTitle} onChange={e => editChapter(chapter.key, "placeTitle", e.target.value)} /></label>
          </details>
          <details className="historical-focus-details"><summary>Passaggio al capitolo successivo</summary>
            <label>Testo del passaggio<textarea rows={4} maxLength={12000} value={chapter.transition} onChange={e => editChapter(chapter.key, "transition", e.target.value)} /></label>
          </details>
        </>}
        <button type="button" className="editorial-button editorial-button--primary historical-confirm" onClick={() => open(null)}>Conferma modifiche</button>
        <small>Le modifiche restano nella sessione. Salva bozza per registrarle.</small>
        {chapter && <button type="button" className="historical-remove" onClick={() => {
          if (!window.confirm("Rimuovere questo capitolo dal racconto?")) return;
          setItems(current => current.filter(item => item.key !== chapter.key));
          setDirty(true);
          open(null);
        }}>Rimuovi capitolo</button>}
      </div>
    </section>}
  </div>;
}
