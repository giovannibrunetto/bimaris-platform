import { createPublicClient } from "@/lib/supabase/public";

export type Village = {
  id: string;
  slug: string;
  name: string;
  excerpt: string;
  description: string;
  history?: string;
  identity?: string;
  thingsToSee?: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  imageAlt?: string;
  featured: boolean;
  territory?: { slug: string; name: string };
};

type RawVillage = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  description: string | null;
  history: string | null;
  identity: string | null;
  things_to_see: string | null;
  address: string | null;
  google_maps_query: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  image_alt: string | null;
  featured: boolean | null;
  territory: { slug: string; name: string } | null;
};

const select = "id,slug,name,excerpt,description,history,identity,things_to_see,address,google_maps_query,latitude,longitude,image_url,image_alt,featured,territory:territories(slug,name)";

function mapVillage(row: RawVillage): Village {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    excerpt: row.excerpt ?? "",
    description: row.description ?? "",
    history: row.history ?? undefined,
    identity: row.identity ?? undefined,
    thingsToSee: row.things_to_see ?? undefined,
    address: row.address ?? undefined,
    googleMapsQuery: row.google_maps_query,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    featured: row.featured ?? false,
    territory: row.territory ?? undefined,
  };
}

export async function getPublishedVillages(): Promise<Village[]> {
  const client = createPublicClient();
  if (!client) return [];
  const { data, error } = await client.from("villages").select(select).eq("published", true).order("featured", { ascending: false }).order("name");
  if (error) { console.error("BIMARIS villages read failed", error.message); return []; }
  return (data as unknown as RawVillage[]).map(mapVillage);
}

export async function getPublishedVillageBySlug(slug: string): Promise<Village | null> {
  const client = createPublicClient();
  if (!client) return null;
  const { data, error } = await client.from("villages").select(select).eq("published", true).eq("slug", slug).maybeSingle();
  if (error) { console.error("BIMARIS village detail read failed", error.message); return null; }
  return data ? mapVillage(data as unknown as RawVillage) : null;
}
