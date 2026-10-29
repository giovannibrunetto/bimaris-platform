import { createPublicClient } from "@/lib/supabase/public";

export type StoryPlace = { name: string; address?: string; googleMapsQuery: string; latitude?: number; longitude?: number; label?: string; note?: string; position: number; };
export type StorySource = { label: string; url?: string; sourceType?: string; note?: string; sortOrder: number; };
export type StoryImage = { imageUrl: string; altText?: string; caption?: string; author?: string; license?: string; sourceUrl?: string; licenseUrl?: string; sortOrder: number; isPrimary: boolean; };
export type StoryEditorialContext = { originText?: string; documentedText?: string; traditionText?: string; interpretationsText?: string; unverifiableText?: string; geographicReference?: string; periodLabel?: string; editorialNote?: string; relations: string[]; };

export type StoryEntry = {
  id: string; slug: string; title: string; excerpt: string; body: string; storyType: string;
  sourceLabel?: string; sourceUrl?: string; featured?: boolean;
  imageUrl?: string; imageAlt?: string; imageAuthor?: string; imageLicense?: string; imageSourceUrl?: string; imageLicenseUrl?: string;
  places: StoryPlace[]; sources: StorySource[]; images: StoryImage[]; editorial?: StoryEditorialContext;
};

type RawStoryPlace = { position: number | null; label: string | null; note: string | null; place: { name: string; address: string | null; google_maps_query: string | null; latitude: number | string | null; longitude: number | string | null; } | null; };
type RawStorySource = { label: string; url: string | null; source_type: string | null; note: string | null; sort_order: number | null; };
type RawStoryImage = { image_url: string; alt_text: string | null; caption: string | null; author: string | null; license: string | null; source_url: string | null; license_url: string | null; sort_order: number | null; is_primary: boolean | null; };
type RawEditorial = { origin_text: string | null; documented_text: string | null; tradition_text: string | null; interpretations_text: string | null; unverifiable_text: string | null; geographic_reference: string | null; period_label: string | null; editorial_note: string | null; relations: string[] | null; };
type RawStory = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; story_type: string | null; source_label: string | null; source_url: string | null; featured: boolean | null; image_url: string | null; image_alt: string | null; image_author: string | null; image_license: string | null; image_source_url: string | null; image_license_url: string | null; story_places: RawStoryPlace[] | null; sources: RawStorySource[] | null; images: RawStoryImage[] | null; editorial: RawEditorial | RawEditorial[] | null; };

function mapStory(row: RawStory): StoryEntry {
  const places = (row.story_places ?? []).filter(item => item.place).map(item => {
    const latitude = item.place?.latitude == null ? undefined : Number(item.place.latitude);
    const longitude = item.place?.longitude == null ? undefined : Number(item.place.longitude);
    return { name: item.place!.name, address: item.place!.address ?? undefined, googleMapsQuery: item.place!.google_maps_query ?? item.place!.name, latitude: Number.isFinite(latitude) ? latitude : undefined, longitude: Number.isFinite(longitude) ? longitude : undefined, label: item.label ?? undefined, note: item.note ?? undefined, position: item.position ?? 1 } satisfies StoryPlace;
  }).sort((a,b) => a.position - b.position);

  const sources = (row.sources ?? []).map(item => ({ label: item.label, url: item.url ?? undefined, sourceType: item.source_type ?? undefined, note: item.note ?? undefined, sortOrder: item.sort_order ?? 1 })).sort((a,b) => a.sortOrder - b.sortOrder);
  const images = (row.images ?? []).map(item => ({ imageUrl: item.image_url, altText: item.alt_text ?? undefined, caption: item.caption ?? undefined, author: item.author ?? undefined, license: item.license ?? undefined, sourceUrl: item.source_url ?? undefined, licenseUrl: item.license_url ?? undefined, sortOrder: item.sort_order ?? 1, isPrimary: item.is_primary ?? false })).sort((a,b) => a.sortOrder - b.sortOrder);
  const primaryImage = images.find(image => image.isPrimary) ?? images[0];
  const rawEditorial = Array.isArray(row.editorial) ? row.editorial[0] : row.editorial;
  const editorial = rawEditorial ? { originText: rawEditorial.origin_text ?? undefined, documentedText: rawEditorial.documented_text ?? undefined, traditionText: rawEditorial.tradition_text ?? undefined, interpretationsText: rawEditorial.interpretations_text ?? undefined, unverifiableText: rawEditorial.unverifiable_text ?? undefined, geographicReference: rawEditorial.geographic_reference ?? undefined, periodLabel: rawEditorial.period_label ?? undefined, editorialNote: rawEditorial.editorial_note ?? undefined, relations: rawEditorial.relations ?? [] } : undefined;

  return { id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt ?? "Una storia legata al territorio messinese.", body: row.body ?? row.excerpt ?? "Una storia legata al territorio messinese.", storyType: row.story_type ?? "leggenda", sourceLabel: sources[0]?.label ?? row.source_label ?? undefined, sourceUrl: sources[0]?.url ?? row.source_url ?? undefined, featured: row.featured ?? false, imageUrl: primaryImage?.imageUrl ?? row.image_url ?? undefined, imageAlt: primaryImage?.altText ?? row.image_alt ?? undefined, imageAuthor: primaryImage?.author ?? row.image_author ?? undefined, imageLicense: primaryImage?.license ?? row.image_license ?? undefined, imageSourceUrl: primaryImage?.sourceUrl ?? row.image_source_url ?? undefined, imageLicenseUrl: primaryImage?.licenseUrl ?? row.image_license_url ?? undefined, places, sources, images, editorial };
}

const storySelect = "id,slug,title,excerpt,body,story_type,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,story_places(position,label,note,place:places(name,address,google_maps_query,latitude,longitude)),sources:story_sources(label,url,source_type,note,sort_order),images:story_images(image_url,alt_text,caption,author,license,source_url,license_url,sort_order,is_primary),editorial:story_editorial_context(origin_text,documented_text,tradition_text,interpretations_text,unverifiable_text,geographic_reference,period_label,editorial_note,relations)";

export async function getPublishedStories(): Promise<StoryEntry[]> { const client = createPublicClient(); if (!client) return []; const { data, error } = await client.from("stories").select(storySelect).eq("published", true).order("featured", { ascending: false }).order("title"); if (error) { console.error("BIMARIS stories read failed", error.message); return []; } return (data as unknown as RawStory[]).map(mapStory); }
export async function getPublishedStoryBySlug(slug: string): Promise<StoryEntry | null> { const client = createPublicClient(); if (!client) return null; const { data, error } = await client.from("stories").select(storySelect).eq("published", true).eq("slug", slug).maybeSingle(); if (error) { console.error("BIMARIS story detail read failed", error.message); return null; } return data ? mapStory(data as unknown as RawStory) : null; }
