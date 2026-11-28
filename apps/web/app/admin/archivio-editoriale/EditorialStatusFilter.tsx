"use client";

export default function EditorialStatusFilter({ value }: { value: string }) {
  return <label>Stato
    <select name="stato" defaultValue={value} onChange={event => event.currentTarget.form?.requestSubmit()}>
      <option value="">Tutte</option>
      <option value="Bozza">Bozze</option>
      <option value="Pubblicata">Pubblicate</option>
      <option value="Ritirata">Ritirate</option>
      <option value="Archiviata">Archiviate</option>
    </select>
  </label>;
}
