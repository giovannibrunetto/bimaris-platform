"use client";

import { useRef, useState } from "react";
import type { CultureStoryChapter } from "@/data/ti-racconto-messina";

const emptyChapter: CultureStoryChapter = { number: 1, title: "", placeTitle: "", paragraphs: [], transition: [] };

export default function HistoricalChapters({ chapters, places }: {
  chapters: CultureStoryChapter[];
  places: { slug: string; title: string }[];
}) {
  const [items, setItems] = useState(() => (chapters.length ? chapters : [emptyChapter]).map((chapter, key) => ({ chapter, key })));
  const nextKey = useRef(items.length);
  function move(index: number, offset: -1 | 1) {
    setItems(current => {
      const copy = [...current];
      const target = index + offset;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }
  return <section className="historical-chapters-editor" aria-labelledby="historical-chapters-title">
    <h2 id="historical-chapters-title">Capitoli</h2>
    {items.map(({ chapter, key }, index) => <details className="editorial-panel historical-chapter-editor" key={key} open={index === 0 || !chapter.title || undefined}>
      <summary>Capitolo {index + 1}{chapter.title && ` · ${chapter.title}`}</summary>
      <label>Titolo del capitolo<input name="chapterTitle" defaultValue={chapter.title} maxLength={220} /></label>
      <label>Testo del capitolo<textarea name="chapterBody" defaultValue={chapter.paragraphs.join("\n\n")} rows={5} maxLength={12000} /></label>
      <label>Scheda Cultura collegata
        <select name="chapterSlug" defaultValue={chapter.slug ?? ""}>
          <option value="">Nessun collegamento</option>
          {chapter.slug && !places.some(place => place.slug === chapter.slug) && <option value={chapter.slug}>{chapter.slug} (non pubblicata)</option>}
          {places.map(place => <option key={place.slug} value={place.slug}>{place.title}</option>)}
        </select>
      </label>
      <label>Nome del luogo nel racconto<input name="chapterPlaceTitle" defaultValue={chapter.placeTitle} maxLength={220} /></label>
      <label>Passaggio al capitolo successivo<textarea name="chapterTransition" defaultValue={chapter.transition.join("\n\n")} rows={3} maxLength={12000} /></label>
      <div className="editorial-actions">
        <button type="button" className="editorial-button" disabled={index === 0} onClick={() => move(index, -1)}>Sposta su</button>
        <button type="button" className="editorial-button" disabled={index === items.length - 1} onClick={() => move(index, 1)}>Sposta giù</button>
        <button type="button" className="editorial-button" onClick={() => setItems(current => current.filter(item => item.key !== key))}>Rimuovi capitolo</button>
      </div>
    </details>)}
    {items.length < 30 && <button type="button" className="editorial-button" onClick={() => {
      const key = nextKey.current++;
      setItems(current => [...current, { key, chapter: emptyChapter }]);
    }}>Aggiungi capitolo</button>}
  </section>;
}
