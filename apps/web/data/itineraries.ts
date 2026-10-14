import { createPublicClient } from "@/lib/supabase/public";

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

type RawStop = {
  id: string;
  position: number;
  stay_minutes: number | null;
  note: string | null;
  custom_title: string | null;
  custom_description: string | null;
  google_maps_query: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  experience: { id: string; slug: string; name: string; excerpt: string | null; meeting_point: string | null; google_maps_query: string | null; latitude: number | string | null; longitude: number | string | null; published: boolean } | null;
  culture: { id: string; slug: string; title: string; excerpt: string | null; published: boolean; place: { address: string | null; google_maps_query: string | null; latitude: number | string | null; longitude: number | string | null } | null } | null;
  story: { id: string; slug: string; title: string; excerpt: string | null; published: boolean } | null;
  operator: { id: string; slug: string; name: string; description: string | null; address: string | null; latitude: number | string | null; longitude: number | string | null; published: boolean; selection_status: string; place: { address: string | null; google_maps_query: string | null; latitude: number | string | null; longitude: number | string | null } | null } | null;
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
  stops: RawStop[] | null;
};

const itinerarySelect = `
  id,slug,title,excerpt,description,duration_minutes,target,territory,featured,image_url,image_alt,
  stops:itinerary_stops(
    id,position,stay_minutes,note,custom_title,custom_description,google_maps_query,latitude,longitude,
    experience:experiences(id,slug,name,excerpt,meeting_point,google_maps_query,latitude,longitude,published),
    culture:culture_entries(id,slug,title,excerpt,published,place:places(address,google_maps_query,latitude,longitude)),
    story:stories(id,slug,title,excerpt,published),
    operator:operators(id,slug,name,description,address,latitude,longitude,published,selection_status,place:places(address,google_maps_query,latitude,longitude))
  )
`;

function numberOrUndefined(value: number | string | null | undefined) {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

function mapStop(row: RawStop): ItineraryStop | null {
  const lat = numberOrUndefined(row.latitude);
  const lng = numberOrUndefined(row.longitude);

  if (row.experience?.published) {
    return {
      id: row.id,
      position: row.position,
      kind: "experience",
      title: row.experience.name,
      excerpt: row.experience.excerpt ?? undefined,
      href: `/esperienze/${row.experience.slug}`,
      address: row.experience.meeting_point ?? undefined,
      googleMapsQuery: row.google_maps_query ?? row.experience.google_maps_query ?? row.experience.meeting_point ?? undefined,
      latitude: lat ?? numberOrUndefined(row.experience.latitude),
      longitude: lng ?? numberOrUndefined(row.experience.longitude),
      stayMinutes: row.stay_minutes ?? undefined,
      note: row.note ?? undefined,
    };
  }

  if (row.culture?.published) {
    return {
      id: row.id,
      position: row.position,
      kind: "culture",
      title: row.culture.title,
      excerpt: row.culture.excerpt ?? undefined,
      href: `/cultura/${row.culture.slug}`,
      address: row.culture.place?.address ?? undefined,
      googleMapsQuery: row.google_maps_query ?? row.culture.place?.google_maps_query ?? row.culture.place?.address ?? undefined,
      latitude: lat ?? numberOrUndefined(row.culture.place?.latitude),
      longitude: lng ?? numberOrUndefined(row.culture.place?.longitude),
      stayMinutes: row.stay_minutes ?? undefined,
      note: row.note ?? undefined,
    };
  }

  if (row.story?.published) {
    return {
      id: row.id,
      position: row.position,
      kind: "story",
      title: row.story.title,
      excerpt: row.story.excerpt ?? undefined,
      href: `/storie-miti-leggende/${row.story.slug}`,
      googleMapsQuery: row.google_maps_query ?? undefined,
      latitude: lat,
      longitude: lng,
      stayMinutes: row.stay_minutes ?? undefined,
      note: row.note ?? undefined,
    };
  }

  if (row.operator?.published && row.operator.selection_status === "selected") {
    return {
      id: row.id,
      position: row.position,
      kind: "operator",
      title: row.operator.name,
      excerpt: row.operator.description ?? undefined,
      href: `/operatori/${row.operator.slug}`,
      address: row.operator.place?.address ?? row.operator.address ?? undefined,
      googleMapsQuery: row.google_maps_query ?? row.operator.place?.google_maps_query ?? row.operator.place?.address ?? row.operator.address ?? undefined,
      latitude: lat ?? numberOrUndefined(row.operator.place?.latitude ?? row.operator.latitude),
      longitude: lng ?? numberOrUndefined(row.operator.place?.longitude ?? row.operator.longitude),
      stayMinutes: row.stay_minutes ?? undefined,
      note: row.note ?? undefined,
    };
  }

  if (row.custom_title) {
    return {
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

  return null;
}

function mapItinerary(row: RawItinerary): PublishedItinerary {
  const durationMinutes = row.duration_minutes ?? undefined;
  const stops = (row.stops ?? [])
    .map(mapStop)
    .filter((stop): stop is ItineraryStop => stop !== null)
    .sort((a, b) => a.position - b.position);

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
    stops,
  };
}

export async function getPublishedItineraries(): Promise<PublishedItinerary[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("itineraries")
    .select(itinerarySelect)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("BIMARIS itineraries read failed", error.message);
    return [];
  }

  return (data as unknown as RawItinerary[]).map(mapItinerary);
}

export async function getPublishedItineraryBySlug(slug: string): Promise<PublishedItinerary | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("itineraries")
    .select(itinerarySelect)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS itinerary detail read failed", error.message);
    return null;
  }

  return data ? mapItinerary(data as unknown as RawItinerary) : null;
}
