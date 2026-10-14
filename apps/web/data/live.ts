import type { CategorySlug, Experience, TerritorySlug } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";
import { experiences as mockExperiences, territories as mockTerritories } from "@/data/mock";

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

export async function getPublishedExperiences(): Promise<Experience[]> {
  const client = createPublicClient();
  if (!client) return mockExperiences;

  const { data, error } = await client
    .from("experiences")
    .select("id,slug,name,excerpt,description,duration_minutes,price_from,featured,territory:territories(slug,name),category:categories(slug,name),operator:operators(name,why_selected)")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("BIMARIS Supabase experiences read failed", error.message);
    return mockExperiences;
  }

  return (data as unknown as RawExperience[])
    .map(mapExperience)
    .filter((item): item is Experience => item !== null);
}

export async function getPublishedExperienceBySlug(slug: string): Promise<Experience | null> {
  const client = createPublicClient();
  if (!client) return mockExperiences.find(item => item.slug === slug) ?? null;

  const { data, error } = await client
    .from("experiences")
    .select("id,slug,name,excerpt,description,duration_minutes,price_from,featured,territory:territories(slug,name),category:categories(slug,name),operator:operators(name,why_selected)")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS Supabase experience read failed", error.message);
    return mockExperiences.find(item => item.slug === slug) ?? null;
  }

  return data ? mapExperience(data as unknown as RawExperience) : null;
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
