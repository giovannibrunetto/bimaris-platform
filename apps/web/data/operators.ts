import type { Experience } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";

export type PublishedOperator = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category?: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  premium: boolean;
  whySelected?: string;
  imageUrl?: string;
  imageAlt?: string;
  territoryName?: string;
};

type RawOperator = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  premium: boolean | null;
  why_selected: string | null;
  image_url: string | null;
  image_alt: string | null;
  place: {
    name: string;
    address: string | null;
    google_maps_query: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
  territory: {
    name: string;
    slug: string;
  } | null;
};

const operatorSelect = "id,slug,name,description,category,address,latitude,longitude,phone,whatsapp,email,website,instagram,premium,why_selected,image_url,image_alt,place:places(name,address,google_maps_query,latitude,longitude),territory:territories(name,slug)";

function numberOrUndefined(value: number | string | null | undefined) {
  if (value == null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function mapOperator(row: RawOperator): PublishedOperator {
  const address = row.place?.address ?? row.address ?? undefined;
  const latitude = numberOrUndefined(row.place?.latitude ?? row.latitude);
  const longitude = numberOrUndefined(row.place?.longitude ?? row.longitude);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "Realtà selezionata da BIMARIS per qualità, autenticità e legame con il territorio.",
    category: row.category ?? undefined,
    address,
    googleMapsQuery: row.place?.google_maps_query ?? address ?? row.name,
    latitude,
    longitude,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    premium: row.premium ?? false,
    whySelected: row.why_selected ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    territoryName: row.territory?.name ?? undefined,
  };
}

export async function getPublishedOperators(): Promise<PublishedOperator[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("operators")
    .select(operatorSelect)
    .eq("published", true)
    .eq("selection_status", "selected")
    .order("premium", { ascending: false })
    .order("name");

  if (error) {
    console.error("BIMARIS operators read failed", error.message);
    return [];
  }

  return (data as unknown as RawOperator[]).map(mapOperator);
}

export async function getPublishedOperatorBySlug(slug: string): Promise<PublishedOperator | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("operators")
    .select(operatorSelect)
    .eq("published", true)
    .eq("selection_status", "selected")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS operator detail read failed", error.message);
    return null;
  }

  return data ? mapOperator(data as unknown as RawOperator) : null;
}

export async function getPublishedExperiencesByOperatorSlug(slug: string): Promise<Experience[]> {
  const { getPublishedExperiences } = await import("@/data/live");
  const experiences = await getPublishedExperiences();
  return experiences.filter(experience => experience.operatorSlug === slug);
}
