"use client";

import { useRef, useState } from "react";

export type EditorialSource = { label: string; url: string | null; source_type?: string | null; note?: string | null };

export default function EditorialSources({ initial, requireUrl }: { initial: EditorialSource[]; requireUrl: boolean }) {
  const [rows, setRows] = useState(() => initial.map((source, key) => ({ ...source, key })));
  const [edited, setEdited] = useState(false);
  const nextKey = useRef(initial.length);
  return <details className="editorial-sheet-management" onInput={() => setEdited(true)}>
    <summary>Fonti e riferimenti{rows.length > 0 ? ` · ${rows.length}` : ""}</summary>
    {edited && <input type="hidden" name="sourcesEdited" value="1" />}
    {rows.map((source, index) => <fieldset className="editorial-location" key={source.key}>
      <legend>Fonte {index + 1}</legend>
      <label>Titolo o riferimento bibliografico<input name="sourceLabel" defaultValue={source.label} maxLength={400} required /></label>
      <label>{requireUrl ? "Link alla fonte" : "Link alla fonte (facoltativo)"}<input name="sourceLink" type="url" maxLength={1000} defaultValue={source.url ?? ""} required={requireUrl} /></label>
      <label>Nota (facoltativa)<input name="sourceNote" defaultValue={source.note ?? ""} maxLength={1200} /></label>
      <input type="hidden" name="sourceType" value={source.source_type ?? ""} />
      <button className="editorial-button" type="button" onClick={() => {
        setRows(current => current.filter(item => item.key !== source.key));
        setEdited(true);
      }}>Rimuovi fonte</button>
    </fieldset>)}
    {rows.length < 24 && <button className="editorial-button" type="button" onClick={() => {
      const key = nextKey.current++;
      setRows(current => [...current, { key, label: "", url: null }]);
      setEdited(true);
    }}>Aggiungi una fonte</button>}
  </details>;
}
