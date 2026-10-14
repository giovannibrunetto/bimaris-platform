import { createPublicClient } from "@/lib/supabase/public";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedStories } from "@/data/stories";

export type ItineraryStop = {
  id: string;
  position: number;
  kind: "experience" | "culture" | "story" | "operator" | "custom";
  title: string;
  excerpt?: string;
  href?: string;
  address?: string;
  googleMapsQuery?: string;
  latitude?: number;
  longitude?: number;
  stayMinutes?: number;
  note?: string;
};

export type PublishedItinerary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  durationMinutes?: number;
  duration: string;
  target?: string;
  territory?: string;
  featured: boolean;
  imageUrl?: string;
  imageAlt?: string;
  stops: ItineraryStop[];
};

type RawItinerary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  duration_minutes: number | null;
  target: string | null;
  territory: string | null;
  featured: boolean | null;
  image_url: string | null;
  image_alt: string | null;
};

type RawStop = {
  id: string;
  itinerary_id: string;
  experience_id: string | null;
  culture_entry_id: string | null;
  story_id: string | null;
  operator_id: string | null;
  position: number;
  stay_minutes: number | null;
  note: string | null;
  custom_title: string | null;
  custom_description: string | null;
  google_maps_query: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

function numberOrUndefined(value: number | string | null | undefined) {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeLocationText(value?: string | null) {
  return value?.trim().toLocaleLowerCase("it-IT").replace(/\s+/g, " ") ?? "";
}

function sameLocationText(a?: string | null, b?: string | null) {
  const left = normalizeLocationText(a);
  const right = normalizeLocationText(b);
  if (!left || !right) return false;
  return left === right || (left.length > 8 && right.length > 8 && (left.includes(right) || right.includes(left)));
}

function formatDuration(minutes?: number) {
  if (!minutes) return "Durata variabile";
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} ${h === 1 ? "ora" : "ore"}`;
  }
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

async function loadPublishedRows(slug?: string) {
  const client = createPublicClient();
  if (!client) return [] as RawItinerary[];

  let query = client
    .from("itineraries")
    .select("id,slug,title,excerpt,description,duration_minutes,target,territory,featured,image_url,image_alt")
    .eq("published", true);

  if (slug) query = query.eq("slug", slug);

  const { data, error } = await query
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("BIMARIS itineraries read failed", error.message);
    return [];
  }

  return data as unknown as RawItinerary[];
}

async function loadStops(itineraryIds: string[]): Promise<Map<string, ItineraryStop[]>> {
  const result = new Map<string, ItineraryStop[]>();
  if (itineraryIds.length === 0) return result;

  const client = createPublicClient();
  if (!client) return result;

  const [{ data: stopData, error: stopError }, cultures, experiences, stories, operators] = await Promise.all([
    client
      .from("itinerary_stops")
      .select("id,itinerary_id,experience_id,culture_entry_id,story_id,operator_id,position,stay_minutes,note,custom_title,custom_description,google_maps_query,latitude,longitude")
      .in("itinerary_id", itineraryIds)
      .order("position"),
    getPublishedCultureEntries(),
    getPublishedExperiences(),
    getPublishedStories(),
    getPublishedOperators(),
  ]);

  if (stopError) {
    console.error("BIMARIS itinerary stops read failed", stopError.message);
    return result;
  }

  const cultureById = new Map(cultures.map(item => [item.id, item]));
  const experienceById = new Map(experiences.map(item => [item.id, item]));
  const storyById = new Map(stories.map(item => [item.id, item]));
  const operatorById = new Map(operators.map(item => [item.id, item]));

  for (const row of (stopData ?? []) as unknown as RawStop[]) {
    const lat = numberOrUndefined(row.latitude);
    const lng = numberOrUndefined(row.longitude);
    let stop: ItineraryStop | null = null;

    if (row.culture_entry_id) {
      const item = cultureById.get(row.culture_entry_id);
      if (item) stop = {
        id: row.id,
        position: row.position,
        kind: "culture",
        title: item.title,
        excerpt: item.excerpt,
        href: `/cultura/${item.slug}`,
        address: item.address,
        googleMapsQuery: row.google_maps_query ?? item.googleMapsQuery,
        latitude: lat ?? item.latitude,
        longitude: lng ?? item.longitude,
        stayMinutes: row.stay_minutes ?? undefined,
        note: row.note ?? undefined,
      };
    } else if (row.story_id) {
      const item = storyById.get(row.story_id);
      if (item) {
        const queryMatchedPlace = row.google_maps_query
          ? item.places.find(place =>
              sameLocationText(row.google_maps_query, place.googleMapsQuery) ||
              sameLocationText(row.google_maps_query, place.name) ||
              sameLocationText(row.google_maps_query, place.address)
            )
          : undefined;
        const coordinateMatchedPlace = lat != null && lng != null
          ? item.places.find(place =>
              place.latitude != null && place.longitude != null &&
              Math.abs(place.latitude - lat) < 0.001 &&
              Math.abs(place.longitude - lng) < 0.001
            )
          : undefined;
        const matchedPlace = queryMatchedPlace ?? coordinateMatchedPlace ?? item.places[0];

        stop = {
          id: row.id,
          position: row.position,
          kind: "story",
          title: item.title,
          excerpt: item.excerpt,
          href: `/storie-miti-leggende/${item.slug}`,
          address: matchedPlace?.address,
          googleMapsQuery: row.google_maps_query ?? matchedPlace?.googleMapsQuery,
          latitude: lat ?? matchedPlace?.latitude,
          longitude: lng ?? matchedPlace?.longitude,
          stayMinutes: row.stay_minutes ?? undefined,
          note: row.note ?? undefined,
        };
      }
    } else if (row.experience_id) {
      const item = experienceById.get(row.experience_id);
      if (item) stop = {
        id: row.id,
        position: row.position,
        kind: "experience",
        title: item.name,
        excerpt: item.excerpt,
        href: `/esperienze/${item.slug}`,
        address: item.meetingPoint,
        googleMapsQuery: row.google_maps_query ?? item.googleMapsQuery ?? item.meetingPoint,
        latitude: lat ?? item.latitude,
        longitude: lng ?? item.longitude,
        stayMinutes: row.stay_minutes ?? undefined,
        note: row.note ?? undefined,
      };
    } else if (row.operator_id) {
      const item = operatorById.get(row.operator_id);
      if (item) stop = {
        id: row.id,
        position: row.position,
        kind: "operator",
        title: item.name,
        excerpt: item.description,
        href: `/operatori/${item.slug}`,
        address: item.address,
        googleMapsQuery: row.google_maps_query ?? item.googleMapsQuery,
        latitude: lat ?? item.latitude,
        longitude: lng ?? item.longitude,
        stayMinutes: row.stay_minutes ?? undefined,
        note: row.note ?? undefined,
      };
    } else if (row.custom_title) {
      stop = {
        id: row.id,
        position: row.position,
        kind: "custom",
        title: row.custom_title,
        excerpt: row.custom_description ?? undefined,
        googleMapsQuery: row.google_maps_query ?? undefined,
        latitude: lat,
        longitude: lng,
        stayMinutes: row.stay_minutes ?? undefined,
        note: row.note ?? undefined,
      };
    }

    if (!stop) continue;
    const list = result.get(row.itinerary_id) ?? [];
    list.push(stop);
    result.set(row.itinerary_id, list);
  }

  for (const list of result.values()) list.sort((a, b) => a.position - b.position);
  return result;
}

async function mapRows(rows: RawItinerary[]): Promise<PublishedItinerary[]> {
  const stopsByItinerary = await loadStops(rows.map(row => row.id));
  return rows.map(row => {
    const durationMinutes = row.duration_minutes ?? undefined;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? row.description ?? "Percorso selezionato da BIMARIS.",
      description: row.description ?? row.excerpt ?? "Percorso selezionato da BIMARIS.",
      durationMinutes,
      duration: formatDuration(durationMinutes),
      target: row.target ?? undefined,
      territory: row.territory ?? undefined,
      featured: row.featured ?? false,
      imageUrl: row.image_url ?? undefined,
      imageAlt: row.image_alt ?? undefined,
      stops: stopsByItinerary.get(row.id) ?? [],
    };
  });
}

export async function getPublishedItineraries(): Promise<PublishedItinerary[]> {
  return mapRows(await loadPublishedRows());
}

export async function getPublishedItineraryBySlug(slug: string): Promise<PublishedItinerary | null> {
  const rows = await loadPublishedRows(slug);
  const mapped = await mapRows(rows);
  return mapped[0] ?? null;
}
