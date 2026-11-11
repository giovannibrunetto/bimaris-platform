// DS-DISC-01: Resolve weekly wall-clock availability in Europe/Rome.
// Ambiguous or nonexistent local instants are excluded, never guessed.
export type WeeklyAvailability = {
  dayOfWeek: number; startTime: string; endTime: string;
  validFrom?: string | null; validUntil?: string | null; active: boolean;
};
const ZONE = "Europe/Rome";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});
function parts(ms: number) {
  const fields = Object.fromEntries(formatter.formatToParts(new Date(ms))
    .filter(p => p.type !== "literal").map(p => [p.type, Number(p.value)]));
  return fields as Record<"year" | "month" | "day" | "hour" | "minute", number>;
}
function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === m - 1 && utc.getUTCDate() === d;
}
function parseClock(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) return null;
  const [h, m, s = 0] = value.split(":").map(Number);
  if (s !== 0) return null; // precision intentionally restricted to minutes
  return h * 60 + m;
}
function resolveLocal(date: string, minuteOfDay: number): string | null {
  const [y, m, d] = date.split("-").map(Number);
  const h = Math.floor(minuteOfDay / 60), minute = minuteOfDay % 60;
  const nominal = Date.UTC(y, m - 1, d, h, minute);
  const matches: number[] = [];
  // UTC+1 / UTC+2 in Europe/Rome; enumerate both, reject ambiguity.
  for (const offsetHours of [1, 2]) {
    const ms = nominal - offsetHours * 3600000;
    const p = parts(ms);
    if (p.year === y && p.month === m && p.day === d && p.hour === h && p.minute === minute) matches.push(ms);
  }
  return matches.length === 1 ? new Date(matches[0]).toISOString() : null;
}
function nextDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
export function resolveWeeklySlots(date: string, rows: WeeklyAvailability[]): { start: string; end: string }[] {
  if (!validDate(date)) return [];
  const [y, m, d] = date.split("-").map(Number);
  // ISO weekday: Monday=1 through Sunday=7 (observed in current DB).
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
  const slots: { start: string; end: string }[] = [];
  for (const row of rows) {
    if (row.active !== true || row.dayOfWeek !== dayOfWeek ||
      (row.validFrom && date < row.validFrom) || (row.validUntil && date > row.validUntil)) continue;
    const startMinutes = parseClock(row.startTime), endMinutes = parseClock(row.endTime);
    if (startMinutes == null || endMinutes == null) continue;
    const overnight = endMinutes <= startMinutes;
    const endDate = overnight ? nextDate(date) : date;
    // A slot crossing midnight is valid only when its end instant is unambiguous.
    const start = resolveLocal(date, startMinutes);
    const end = resolveLocal(endDate, endMinutes);
    if (start && end && Date.parse(end) > Date.parse(start)) slots.push({ start, end });
  }
  return slots;
}
