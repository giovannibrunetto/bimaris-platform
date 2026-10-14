import { createPublicClient } from "@/lib/supabase/public";

export type StoryPlace = {
  name: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  note?: string;
  position: number;
};

export type StoryEntry = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  storyType: string;
  sourceLabel?: string;
  sourceUrl?: string;
  featured?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageAuthor?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  imageLicenseUrl?: string;
  places: StoryPlace[];
};

type RawStoryPlace = {
  position: number | null;
  label: string | null;
  note: string | null;
  place: {
    name: string;
    address: string | null;
    google_maps_query: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
};

type RawStory = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  story_type: string | null;
  source_label: string | null;
  source_url: string | null;
  featured: boolean | null;
  image_url: string | null;
  image_alt: string | null;
  image_author: string | null;
  image_license: string | null;
  image_source_url: string | null;
  image_license_url: string | null;
  story_places: RawStoryPlace[] | null;
};

function mapStory(row: RawStory): StoryEntry {
  const places = (row.story_places ?? [])
    .filter(item => item.place)
    .map(item => {
      const latitude = item.place?.latitude == null ? undefined : Number(item.place.latitude);
      const longitude = item.place?.longitude == null ? undefined : Number(item.place.longitude);

      return {
        name: item.place!.name,
        address: item.place!.address ?? undefined,
        googleMapsQuery: item.place!.google_maps_query ?? item.place!.name,
        latitude: Number.isFinite(latitude) ? latitude : undefined,
        longitude: Number.isFinite(longitude) ? longitude : undefined,
        label: item.label ?? undefined,
        note: item.note ?? undefined,
        position: item.position ?? 1,
      } satisfies StoryPlace;
    })
    .sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "Una storia legata al territorio messinese.",
    body: row.body ?? row.excerpt ?? "Una storia legata al territorio messinese.",
    storyType: row.story_type ?? "leggenda",
    sourceLabel: row.source_label ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    featured: row.featured ?? false,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    imageAuthor: row.image_author ?? undefined,
    imageLicense: row.image_license ?? undefined,
    imageSourceUrl: row.image_source_url ?? undefined,
    imageLicenseUrl: row.image_license_url ?? undefined,
    places,
  };
}

const storySelect = "id,slug,title,excerpt,body,story_type,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,story_places(position,label,note,place:places(name,address,google_maps_query,latitude,longitude))";

export async function getPublishedStories(): Promise<StoryEntry[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("stories")
    .select(storySelect)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("title");

  if (error) {
    console.error("BIMARIS stories read failed", error.message);
    return [];
  }

  return (data as unknown as RawStory[]).map(mapStory);
}

export async function getPublishedStoryBySlug(slug: string): Promise<StoryEntry | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("stories")
    .select(storySelect)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS story detail read failed", error.message);
    return null;
  }

  return data ? mapStory(data as unknown as RawStory) : null;
}
