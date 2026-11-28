"use client";

import { useState } from "react";

export type EditorialSource = { label: string; url: string | null; source_type?: string | null; note?: string | null };

function lines(value: string) {
  return value.split("\n").map(line => line.trim()).filter(Boolean);
}

function linkLabel(value: string) {
  try {
    return new URL(value).hostname || value;
  } catch {
    return value;
  }
}

export default function EditorialSources({ initial }: { initial: EditorialSource[] }) {
  const [links, setLinks] = useState(() => initial.flatMap(source => source.url ? [source.url] : []).join("\n"));
  const [references, setReferences] = useState(() => initial.flatMap(source => source.url ? [] : [source.label]).join("\n"));
  const [edited, setEdited] = useState(false);
  const remaining = [...initial];
  const rows = [
    ...lines(links).map(url => ({ url, label: linkLabel(url) })),
    ...lines(references).map(label => ({ url: null, label })),
  ].map(source => {
    const index = remaining.findIndex(item => source.url ? item.url === source.url : !item.url && item.label === source.label);
    return index === -1 ? source : remaining.splice(index, 1)[0];
  });

  return <details className="editorial-sheet-management">
    <summary>Fonti e riferimenti{rows.length ? ` · ${rows.length}` : ""}</summary>
    <label>Link, uno per riga
      <textarea value={links} onChange={event => { setLinks(event.currentTarget.value); setEdited(true); }}
        rows={3} placeholder="https://…" />
    </label>
    <label>Riferimenti scritti a mano, uno per riga
      <textarea value={references} onChange={event => { setReferences(event.currentTarget.value); setEdited(true); }}
        rows={3} placeholder="Autore, titolo, anno…" />
    </label>
    {edited && <input type="hidden" name="sourcesEdited" value="1" />}
    {edited && rows.map((source: EditorialSource, index) => <div key={index} hidden>
      <input type="hidden" name="sourceLabel" value={source.label} />
      <input type="hidden" name="sourceLink" value={source.url ?? ""} />
      <input type="hidden" name="sourceNote" value={source.note ?? ""} />
      <input type="hidden" name="sourceType" value={source.source_type ?? ""} />
    </div>)}
  </details>;
}
