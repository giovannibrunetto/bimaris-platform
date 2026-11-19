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

export const experienceReviewFields = fields.map(([, key]) => key).join(",");

export function experienceFieldChanges(current: Record<string, unknown>, proposed: Record<string, unknown>) {
  return fields.flatMap(([label, key]) => {
    const before = current[key];
    const after = proposed[key];
    return String(before ?? "") === String(after ?? "") ? [] : [[label, before, after] as const];
  });
}
