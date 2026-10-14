import type { CategorySlug, CultureEntry, Experience, TerritorySlug } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";
import { territories as mockTerritories } from "@/data/mock";

type RawExperience = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  description: string | null;
  duration_minutes: number | null;
  price_from: number | string | null;
  featured: boolean | null;
  territory: { slug: string; name: string } | null;
  category: { slug: string; name: string } | null;
  operator: { name: string; why_selected: string | null } | null;
};

type RawTerritory = {
  slug: string;
  name: string;
  description: string | null;
};

type RawCultureEntry = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  source_label: string | null;
  source_url: string | null;
  featured: boolean | null;
  image_url: string | null;
  image_alt: string | null;
  image_author: string | null;
  image_license: string | null;
  image_source_url: string | null;
  image_license_url: string | null;
  place: {
    name: string;
    address: string | null;
    google_maps_query: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
};

function formatDuration(minutes: number | null) {
  if (!minutes) return undefined;
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "ora" : "ore"}`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min`;
}

function isTerritorySlug(value: string): value is TerritorySlug {
  return ["messina-stretto", "milazzo-tirrenica", "nebrodi", "isole-eolie"].includes(value);
}

function isCategorySlug(value: string): value is CategorySlug {
  return ["mangiare", "esperienze", "mare", "natura", "cultura", "shopping-artigianato", "famiglia"].includes(value);
}

function mapExperience(row: RawExperience): Experience | null {
  const territorySlug = row.territory?.slug;
  const categorySlug = row.category?.slug;

  if (!territorySlug || !categorySlug || !isTerritorySlug(territorySlug) || !isCategorySlug(categorySlug)) {
    return null;
  }

  const price = row.price_from == null ? undefined : Number(row.price_from);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    excerpt: row.excerpt ?? "Esperienza selezionata da BIMARIS.",
    description: row.description ?? row.excerpt ?? "Esperienza selezionata da BIMARIS.",
    territory: territorySlug,
    category: categorySlug,
    location: row.territory?.name ?? "Messina",
    duration: formatDuration(row.duration_minutes),
    priceFrom: Number.isFinite(price) ? price : undefined,
    operatorName: row.operator?.name ?? "Operatore BIMARIS",
    whySelected: row.operator?.why_selected ?? "Esperienza coerente con i criteri di selezione BIMARIS.",
    featured: row.featured ?? false,
  };
}

function mapCultureEntry(row: RawCultureEntry): CultureEntry | null {
  if (!row.place) return null;

  const latitude = row.place.latitude == null ? undefined : Number(row.place.latitude);
  const longitude = row.place.longitude == null ? undefined : Number(row.place.longitude);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "Luogo culturale di Messina selezionato da BIMARIS.",
    body: row.body ?? row.excerpt ?? "Luogo culturale di Messina selezionato da BIMARIS.",
    category: row.category ?? "Cultura",
    placeName: row.place.name,
    address: row.place.address ?? undefined,
    googleMapsQuery: row.place.google_maps_query ?? row.place.name,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    sourceLabel: row.source_label ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    featured: row.featured ?? false,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    imageAuthor: row.image_author ?? undefined,
    imageLicense: row.image_license ?? undefined,
    imageSourceUrl: row.image_source_url ?? undefined,
    imageLicenseUrl: row.image_license_url ?? undefined,
  };
}

export async function getPublishedExperiences(): Promise<Experience[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("experiences")
    .select("id,slug,name,excerpt,description,duration_minutes,price_from,featured,territory:territories(slug,name),category:categories(slug,name),operator:operators(name,why_selected)")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("BIMARIS Supabase experiences read failed", error.message);
    return [];
  }

  return (data as unknown as RawExperience[])
    .map(mapExperience)
    .filter((item): item is Experience => item !== null);
}

export async function getPublishedExperienceBySlug(slug: string): Promise<Experience | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("experiences")
    .select("id,slug,name,excerpt,description,duration_minutes,price_from,featured,territory:territories(slug,name),category:categories(slug,name),operator:operators(name,why_selected)")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS Supabase experience read failed", error.message);
    return null;
  }

  return data ? mapExperience(data as unknown as RawExperience) : null;
}

export async function getPublishedCultureEntries(): Promise<CultureEntry[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("culture_entries")
    .select("id,slug,title,excerpt,body,category,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,place:places(name,address,google_maps_query,latitude,longitude)")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("title");

  if (error) {
    console.error("BIMARIS Supabase culture read failed", error.message);
    return [];
  }

  return (data as unknown as RawCultureEntry[])
    .map(mapCultureEntry)
    .filter((item): item is CultureEntry => item !== null);
}

export async function getPublishedCultureEntryBySlug(slug: string): Promise<CultureEntry | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from("culture_entries")
    .select("id,slug,title,excerpt,body,category,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,place:places(name,address,google_maps_query,latitude,longitude)")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS Supabase culture detail read failed", error.message);
    return null;
  }

  return data ? mapCultureEntry(data as unknown as RawCultureEntry) : null;
}

export async function getActiveTerritories() {
  const client = createPublicClient();
  if (!client) return mockTerritories;

  const { data, error } = await client
    .from("territories")
    .select("slug,name,description")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("BIMARIS Supabase territories read failed", error.message);
    return mockTerritories;
  }

  return (data as unknown as RawTerritory[]).map(item => ({
    slug: item.slug,
    name: item.name,
    text: item.description ?? "Territorio selezionato da BIMARIS.",
  }));
}
