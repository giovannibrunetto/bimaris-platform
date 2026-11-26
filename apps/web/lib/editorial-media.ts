import type { createServiceClient } from "@/lib/supabase/server";

type Database = NonNullable<ReturnType<typeof createServiceClient>>;
export type EditorialModel = "culture" | "legend" | "village" | "historical";
export type EditorialCover = {
  id?: string;
  url?: string;
  alt?: string | null;
  author?: string | null;
  source?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
};

export function editorialCoverUrl(cover: EditorialCover, preview = false) {
  const url = cover.url || (cover.id ? `/api/editoriale/immagini/${cover.id}` : undefined);
  return preview && url?.startsWith("/api/editoriale/immagini/") ? `${url}?anteprima=1` : url;
}

export async function getEditorialCover(db: Database, model: EditorialModel, entry: string | null) {
  if (!entry || model === "historical") return null;
  if (model === "culture") {
    const { data, error } = await db.from("culture_images")
      .select("id,image_url,alt_text,author,source_url,license,license_url")
      .eq("culture_entry_id", entry).order("is_primary", { ascending: false, nullsFirst: false })
      .order("sort_order").order("id").limit(1).maybeSingle();
    if (error) throw error;
    if (data) return { id: data.id, url: data.image_url, alt: data.alt_text, author: data.author,
      source: data.source_url, license: data.license, licenseUrl: data.license_url } satisfies EditorialCover;
  }
  const table = { culture: "culture_entries", legend: "stories", village: "villages" }[model];
  const { data, error } = await db.from(table)
    .select("image_url,image_alt,image_author,image_source_url,image_license,image_license_url")
    .eq("id", entry).maybeSingle();
  if (error) throw error;
  if (!data?.image_url) return null;
  return { url: data.image_url, alt: data.image_alt, author: data.image_author,
    source: data.image_source_url, license: data.image_license, licenseUrl: data.image_license_url } satisfies EditorialCover;
}
