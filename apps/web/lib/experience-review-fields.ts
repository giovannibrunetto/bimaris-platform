const fields = [
 [
  "Nome",
  "name"
 ],
 [
  "Testo breve",
  "excerpt"
 ],
 [
  "Descrizione",
  "description"
 ],
 [
  "Durata",
  "duration_minutes"
 ],
 [
  "Prezzo",
  "price_from"
 ],
 [
  "Punto di incontro",
  "meeting_point"
 ],
 [
  "Tipologia punto",
  "location_kind"
 ],
 [
  "Latitudine",
  "latitude"
 ],
 [
  "Longitudine",
  "longitude"
 ],
 [
  "Comune",
  "territory_municipality_code"
 ]
] as const;

export function experienceFieldComparison(current: Record<string, unknown>, proposed: Record<string, unknown>) {
  return fields.map(([label, key]) => {
    const before = current[key];
    const after = proposed[key];
    const changed = String(before ?? "") !== String(after ?? "");
    return [label, before, after, changed] as const;
  });
}

export function experienceFieldChanges(current: Record<string, unknown>, proposed: Record<string, unknown>) {
  return experienceFieldComparison(current, proposed).filter(([, , , changed]) => changed);
}
