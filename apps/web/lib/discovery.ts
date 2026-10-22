import { createPublicClient } from "@/lib/supabase/public";

export const DISCOVERY_INTENTS = [
  "culture",
  "food-wine",
  "nature",
  "sea",
  "adventure",
  "relax",
  "stories-places",
] as const;

export const DISCOVERY_AUDIENCES = ["solo", "couple", "friends", "family"] as const;

export type DiscoveryIntent = (typeof DISCOVERY_INTENTS)[number];
export type DiscoveryAudience = (typeof DISCOVERY_AUDIENCES)[number];

export type DiscoveryQuery = {
  intent: DiscoveryIntent;
  audience: DiscoveryAudience;
  at?: Date;
  availableMinutes?: number;
  limit?: number;
};

export type DiscoveryResult = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  durationMinutes: number | null;
  priceFrom: number | null;
  imageUrl: string | null;
  environment: string;
  bookingRequirement: string;
  bookingNoticeHours: number;
  score: number;
  availability: "now" | "today";
};

type ExperienceRow = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  duration_minutes: number | null;
  price_from: number | string | null;
  image_url: string | null;
  published: boolean;
  review_status: string;
};

type ProfileRow = {
  experience_id: string;
  audiences: string[];
  environment: string;
  booking_requirement: string;
  booking_notice_hours: number;
  discovery_active: boolean;
  editorial_weight: number;
};

type IntentRow = { experience_id: string; intent_key: string; weight: number | string };
type AvailabilityRow = {
  experience_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
};

function isoDay(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function localTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
}

function localDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function discoverExperiences(query: DiscoveryQuery): Promise<DiscoveryResult[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const at = query.at ?? new Date();
  const day = isoDay(at);
  const time = localTime(at);
  const date = localDate(at);
  const limit = Math.max(1, Math.min(query.limit ?? 3, 5));

  const [{ data: experiences }, { data: profiles }, { data: intents }, { data: availability }] = await Promise.all([
    supabase.from("experiences").select("id,slug,name,excerpt,duration_minutes,price_from,image_url,published,review_status").eq("published", true).eq("review_status", "approved"),
    supabase.from("experience_discovery_profiles").select("experience_id,audiences,environment,booking_requirement,booking_notice_hours,discovery_active,editorial_weight").eq("discovery_active", true),
    supabase.from("experience_discovery_intents").select("experience_id,intent_key,weight").eq("intent_key", query.intent),
    supabase.from("experience_availability").select("experience_id,day_of_week,start_time,end_time,valid_from,valid_until,active").eq("day_of_week", day).eq("active", true),
  ]);

  const profileMap = new Map((profiles as ProfileRow[] | null ?? []).map((row) => [row.experience_id, row]));
  const intentMap = new Map((intents as IntentRow[] | null ?? []).map((row) => [row.experience_id, Number(row.weight)]));
  const availabilityMap = new Map<string, AvailabilityRow[]>();
  for (const row of (availability as AvailabilityRow[] | null ?? [])) {
    const rows = availabilityMap.get(row.experience_id) ?? [];
    rows.push(row);
    availabilityMap.set(row.experience_id, rows);
  }

  const results: DiscoveryResult[] = [];

  for (const experience of (experiences as ExperienceRow[] | null ?? [])) {
    const profile = profileMap.get(experience.id);
    const intentWeight = intentMap.get(experience.id);
    if (!profile || intentWeight == null || !profile.audiences.includes(query.audience)) continue;
    if (query.availableMinutes && experience.duration_minutes && experience.duration_minutes > query.availableMinutes) continue;

    const windows = (availabilityMap.get(experience.id) ?? []).filter((slot) =>
      (!slot.valid_from || slot.valid_from <= date) && (!slot.valid_until || slot.valid_until >= date)
    );
    if (!windows.length) continue;

    const current = windows.find((slot) => slot.start_time <= time && slot.end_time >= time);
    const later = windows.find((slot) => slot.start_time > time);
    const slot = current ?? later;
    if (!slot) continue;

    // v1 score: intent 40 + audience 20 + duration 10 + editorial max 5.
    // Personal preference and distance are intentionally reserved for the next layer.
    const intentScore = 40 * Math.max(0, Math.min(intentWeight, 1));
    const audienceScore = 20;
    const durationScore = query.availableMinutes && experience.duration_minutes
      ? 10 * Math.min(1, query.availableMinutes / experience.duration_minutes)
      : 10;
    const editorialScore = Math.max(0, Math.min(profile.editorial_weight, 5));
    const score = Math.round((intentScore + audienceScore + durationScore + editorialScore) * 100) / 100;

    results.push({
      id: experience.id,
      slug: experience.slug,
      name: experience.name,
      excerpt: experience.excerpt,
      durationMinutes: experience.duration_minutes,
      priceFrom: experience.price_from == null ? null : Number(experience.price_from),
      imageUrl: experience.image_url,
      environment: profile.environment,
      bookingRequirement: profile.booking_requirement,
      bookingNoticeHours: profile.booking_notice_hours,
      score,
      availability: current ? "now" : "today",
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
