import type { WeeklyAvailability } from "./availability";
import { resolveWeeklySlots } from "./availability";

/** Pure availability and booking eligibility evaluation; no inferred reservations. */
export type BookingRules = {
  requirement: string | null;
  noticeHours: number | null;
  cutoffTime: string | null;
  cutoffDayOffset: number | null;
};
export type Eligibility = {
  slots: { start: string; end: string }[];
  status: "eligible" | "unconfirmed";
  reason?: string;
};
const absoluteInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
/**
 * Resolve weekly availability for a given Europe/Rome calendar date.
 * Conservative: any configured booking cutoff not yet interpreted blocks eligibility.
 * An available time slot is not a real-time bookable reservation.
 */
export function evaluateAvailability(
  date: string, rows: WeeklyAvailability[], rules: BookingRules, nowIso: string
): Eligibility {
  if (!absoluteInstant.test(nowIso) || !Number.isFinite(Date.parse(nowIso))) {
    return { slots: [], status: "unconfirmed", reason: "invalid_reference_instant" };
  }
  const slots = resolveWeeklySlots(date, rows);
  if (!slots.length) return { slots: [], status: "unconfirmed", reason: "no_verified_slot" };
  if (rules.cutoffTime != null || rules.cutoffDayOffset != null) {
    return { slots: [], status: "unconfirmed", reason: "booking_cutoff_requires_resolution" };
  }
  if (rules.noticeHours != null && (!Number.isFinite(rules.noticeHours) || rules.noticeHours < 0)) {
    return { slots: [], status: "unconfirmed", reason: "invalid_booking_notice" };
  }
  const now = Date.parse(nowIso);
  const minStart = now + (rules.noticeHours ?? 0) * 3600000;
  // Availability rows represent continuous windows, not individual bookable start times.
  // Preserve the remaining portion of a window after the notice threshold.
  const eligible = slots.flatMap(s => {
    const start = Math.max(Date.parse(s.start), Math.ceil(minStart / 60000) * 60000);
    return start < Date.parse(s.end) ? [{ start: new Date(start).toISOString(), end: s.end }] : [];
  });
  return eligible.length
    ? { slots: eligible, status: "eligible" }
    : { slots: [], status: "unconfirmed", reason: "notice_not_met" };
}
