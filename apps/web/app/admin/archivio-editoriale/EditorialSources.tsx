"use client";

import { useRef, useState } from "react";

export type EditorialSource = { label: string; url: string | null; source_type?: string | null; note?: string | null };
type SourceGroup = Omit<EditorialSource, "url"> & { key: number; links: { key: number; url: string }[] };

function groupSources(sources: EditorialSource[]) {
  const groups: SourceGroup[] = [];
  for (const [key, source] of sources.entries()) {
    const previous = groups.at(-1);
    const link = { key, url: source.url ?? "" };
    if (previous && source.url && previous.links.every(item => item.url)
      && previous.label === source.label && previous.note === source.note && previous.source_type === source.source_type) {
      previous.links.push(link);
    } else {
      groups.push({ key, label: source.label, note: source.note, source_type: source.source_type, links: [link] });
    }
  }
  return groups;
}

export default function EditorialSources({ initial, requireUrl }: { initial: EditorialSource[]; requireUrl: boolean }) {
  const [rows, setRows] = useState(() => groupSources(initial));
  const [edited, setEdited] = useState(false);
  const nextKey = useRef(initial.length);
  const hasSpace = rows.reduce((total, row) => total + row.links.length, 0) < 24;

  const update = (key: number, change: (source: SourceGroup) => SourceGroup) => {
    setRows(current => current.map(source => source.key === key ? change(source) : source));
    setEdited(true);
  };

  return <details className="editorial-sheet-management" onInput={() => setEdited(true)}>
    <summary>Fonti e riferimenti{rows.length > 0 ? ` · ${rows.length}` : ""}</summary>
    {edited && <input type="hidden" name="sourcesEdited" value="1" />}
    {rows.map((source, index) => <fieldset className="editorial-location" key={source.key}>
      <legend>Fonte {index + 1}</legend>
      <label>Titolo o riferimento bibliografico
        <input value={source.label} onChange={event => {
          const label = event.currentTarget.value;
          update(source.key, row => ({ ...row, label }));
        }} maxLength={400} required />
      </label>
      {source.links.map((link, linkIndex) => <div key={link.key}>
        <label>{source.links.length > 1 ? `Link ${linkIndex + 1}` : requireUrl ? "Link alla fonte" : "Link alla fonte (facoltativo)"}
          <input name="sourceLink" type="url" maxLength={1000} defaultValue={link.url} required={requireUrl || source.links.length > 1} />
        </label>
        <input type="hidden" name="sourceLabel" value={source.label} />
        <input type="hidden" name="sourceNote" value={source.note ?? ""} />
        <input type="hidden" name="sourceType" value={source.source_type ?? ""} />
        {source.links.length > 1 && <button className="editorial-button" type="button" onClick={() =>
          update(source.key, row => ({ ...row, links: row.links.filter(item => item.key !== link.key) }))
        }>Rimuovi link {linkIndex + 1}</button>}
      </div>)}
      {hasSpace && <button className="editorial-button" type="button" onClick={() => {
        const link = { key: nextKey.current++, url: "" };
        update(source.key, row => ({ ...row, links: [...row.links, link] }));
      }}>Aggiungi un link</button>}
      <label>Nota (facoltativa)
        <input value={source.note ?? ""} onChange={event => {
          const note = event.currentTarget.value;
          update(source.key, row => ({ ...row, note }));
        }} maxLength={1200} />
      </label>
      <button className="editorial-button" type="button" onClick={() => {
        setRows(current => current.filter(item => item.key !== source.key));
        setEdited(true);
      }}>Rimuovi fonte</button>
    </fieldset>)}
    {hasSpace && <button className="editorial-button" type="button" onClick={() => {
      const key = nextKey.current++;
      setRows(current => [...current, { key, label: "", links: [{ key, url: "" }] }]);
      setEdited(true);
    }}>Aggiungi una fonte</button>}
  </details>;
}
