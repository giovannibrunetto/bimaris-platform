import type { CategorySlug, CultureEntry, Experience, HistoricalPeriodKey, TerritorySlug } from "@/lib/types";
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
  bookable: boolean | null;
  why_selected: string | null;
  image_url: string | null;
  image_alt: string | null;
  meeting_point: string | null;
  google_maps_query: string | null;
  booking_url: string | null;
  booking_note: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  territory: { slug: string; name: string } | null;
  category: { slug: string; name: string } | null;
  operator: {
    slug: string;
    name: string;
    why_selected: string | null;
    whatsapp: string | null;
    website: string | null;
    instagram: string | null;
  } | null;
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
  primary_historical_period: string | null;
  historical_periods: string[] | null;
  historical_period_note: string | null;
  historical_sort_year: number | null;
  place: {
    name: string;
    address: string | null;
    google_maps_query: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
};

export type ExperienceFoodProduct = {
  slug: string;
  name: string;
  excerpt?: string;
  territoryName?: string;
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
  return ["degustazioni", "mare", "avventura", "trekking-natura", "visite-guidate", "artigianato-laboratori"].includes(value);
}

function isHistoricalPeriodKey(value: string): value is HistoricalPeriodKey {
  return ["medioevo", "rinascimento-cinquecento", "seicento-settecento", "ottocento", "novecento", "trasversale"].includes(value);
}

function mapExperience(row: RawExperience): Experience | null {
  const territorySlug = row.territory?.slug;
  const categorySlug = row.category?.slug;

  if (!territorySlug || !categorySlug || !isTerritorySlug(territorySlug) || !isCategorySlug(categorySlug)) {
    return null;
  }

  const price = row.price_from == null ? undefined : Number(row.price_from);
  const latitude = row.latitude == null ? undefined : Number(row.latitude);
  const longitude = row.longitude == null ? undefined : Number(row.longitude);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    excerpt: row.excerpt ?? "Esperienza selezionata da BIMARIS.",
    description: row.description ?? row.excerpt ?? "Esperienza selezionata da BIMARIS.",
    territory: territorySlug,
    category: categorySlug,
    categoryName: row.category?.name ?? "Esperienza",
    location: row.territory?.name ?? "Messina",
    duration: formatDuration(row.duration_minutes),
    priceFrom: Number.isFinite(price) ? price : undefined,
    operatorName: row.operator?.name ?? "Operatore BIMARIS",
    operatorSlug: row.operator?.slug ?? undefined,
    operatorWhatsapp: row.operator?.whatsapp ?? undefined,
    operatorWebsite: row.operator?.website ?? undefined,
    operatorInstagram: row.operator?.instagram ?? undefined,
    whySelected: row.why_selected ?? row.operator?.why_selected ?? "Esperienza coerente con i criteri di selezione BIMARIS.",
    featured: row.featured ?? false,
    bookable: row.bookable ?? false,
    bookingUrl: row.booking_url ?? undefined,
    bookingNote: row.booking_note ?? undefined,
    meetingPoint: row.meeting_point ?? undefined,
    googleMapsQuery: row.google_maps_query ?? row.meeting_point ?? `${row.name} ${row.territory?.name ?? "Messina"}`,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
  };
}

function mapCultureEntry(row: RawCultureEntry): CultureEntry | null {
  if (!row.place) return null;

  const latitude = row.place.latitude == null ? undefined : Number(row.place.latitude);
  const longitude = row.place.longitude == null ? undefined : Number(row.place.longitude);
  const primaryHistoricalPeriod = row.primary_historical_period && isHistoricalPeriodKey(row.primary_historical_period)
    ? row.primary_historical_period
    : undefined;
  const historicalPeriods = (row.historical_periods ?? []).filter(isHistoricalPeriodKey);

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
    primaryHistoricalPeriod,
    historicalPeriods,
    historicalPeriodNote: row.historical_period_note ?? undefined,
    historicalSortYear: row.historical_sort_year ?? undefined,
  };
}

const experienceSelect = "id,slug,name,excerpt,description,duration_minutes,price_from,featured,bookable,why_selected,image_url,image_alt,meeting_point,google_maps_query,booking_url,booking_note,latitude,longitude,territory:territories(slug,name),category:categories(slug,name),operator:operators(slug,name,why_selected,whatsapp,website,instagram)";
const cultureSelect = "id,slug,title,excerpt,body,category,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,primary_historical_period,historical_periods,historical_period_note,historical_sort_year,place:places(name,address,google_maps_query,latitude,longitude)";

export async function getPublishedExperiences(): Promise<Experience[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("experiences")
    .select(experienceSelect)
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
    .select(experienceSelect)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("BIMARIS Supabase experience read failed", error.message);
    return null;
  }

  return data ? mapExperience(data as unknown as RawExperience) : null;
}

export async function getPublishedFoodProductsByExperienceId(experienceId: string): Promise<ExperienceFoodProduct[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("food_product_experiences")
    .select("product:food_products(slug,name,excerpt,published,territory:territories(name))")
    .eq("experience_id", experienceId);

  if (error) {
    console.error("BIMARIS experience food products read failed", error.message);
    return [];
  }

  type Row = { product: { slug: string; name: string; excerpt: string | null; published: boolean | null; territory: { name: string } | null } | null };
  return (data as unknown as Row[]).flatMap(row => row.product?.published ? [{
    slug: row.product.slug,
    name: row.product.name,
    excerpt: row.product.excerpt ?? undefined,
    territoryName: row.product.territory?.name ?? undefined,
  }] : []);
}

export async function getPublishedCultureEntries(): Promise<CultureEntry[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("culture_entries")
    .select(cultureSelect)
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
    .select(cultureSelect)
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
