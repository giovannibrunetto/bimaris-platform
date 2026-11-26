import { randomUUID } from "node:crypto";
import type { createServiceClient } from "@/lib/supabase/server";
import { getEditorialCover, type EditorialCover, type EditorialModel } from "./editorial-media";

type Database = NonNullable<ReturnType<typeof createServiceClient>>;

function validLink(value: string) {
  if (!value) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

export function editorialSources(form: FormData) {
  if (form.get("sourcesEdited") !== "1") return {};
  const columns = ["sourceLabel", "sourceLink", "sourceType", "sourceNote"].map(field => form.getAll(field).map(item => String(item).trim()));
  const [labels, urls, types, notes] = columns;
  if (labels.length > 24 || columns.some(column => column.length !== labels.length)) return null;
  const sources = labels.map((label, index) => ({ label, url: urls[index], source_type: types[index], note: notes[index] }));
  if (sources.some(source => !source.label || source.label.length > 400 || source.url.length > 1000 ||
    source.note.length > 1200 || !validLink(source.url))) return null;
  return { sources };
}

function imageMime(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function readEditorialCover(db: Database, form: FormData, model: EditorialModel, workspace: string, version: number, standalone = false):
  Promise<{ error: string } | { cover?: EditorialCover; uploaded?: string }> {
  if (!standalone && !form.has("photo")) return {};
  const read = (name: string, limit: number) => String(form.get(name) ?? "").trim().slice(0, limit);
  const credits = { alt: read("alt", 250), author: read("author", 180), source: read("source", 500),
    license: read("license", 180), licenseUrl: read("licenseUrl", 500) };
  const file = form.get("photo");
  const selected = file instanceof File && Boolean(file.name || file.size);
  if (!selected && !standalone) {
    const { data, error } = await db.from("editorial_workspaces")
      .select("draft,entry_id,version").eq("model", model).eq("id", workspace).maybeSingle();
    if (error || !data) return { error: "errore" };
    if (data.version !== version) return { error: "conflitto" };
    let current: EditorialCover | null = data.draft?.cover;
    try {
      if (!current) {
        const pending = data.draft?.photos?.[0];
        current = model === "culture"
          ? (await getEditorialCover(db, model, data.entry_id)) ?? pending
          : pending ?? await getEditorialCover(db, model, data.entry_id);
      }
    } catch {
      return { error: "errore" };
    }
    if (Object.entries(credits).every(([key, value]) => value === String(current?.[key as keyof typeof credits] ?? "").trim())) return {};
    if (!current) return { error: "foto-file" };
    if (!credits.alt) return { error: "foto-alt" };
    if (![credits.source, credits.licenseUrl].every(validLink)) return { error: "dati" };
    return { cover: { ...current, ...credits } };
  }
  if (!(file instanceof File) || !selected) return { error: "foto-file" };
  if (!file.size) return { error: "foto-empty" };
  if (file.size > 3 * 1024 * 1024) return { error: "foto-size" };
  if (!credits.alt) return { error: "foto-alt" };
  if (![credits.source, credits.licenseUrl].every(validLink)) return { error: "dati" };
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = imageMime(bytes);
  if (!contentType) return { error: "foto-type" };
  const uploaded = randomUUID();
  const { error } = await db.storage.from("editorial-media").upload(uploaded, bytes, { contentType });
  if (error) {
    console.error("Editorial photo storage upload failed", error.name);
    return { error: "foto-storage" };
  }
  return { cover: { id: uploaded, ...credits }, uploaded };
}

export async function discardRejectedEditorialUpload(db: Database, uploaded: string | undefined, code: string) {
  // Remove only uploads rejected by Postgres. A network failure can hide a successful commit.
  if (uploaded && /^(?:P000[12]|2[2345][0-9A-Z]{3})$/.test(code)) {
    const { error } = await db.storage.from("editorial-media").remove([uploaded]);
    if (error) console.error("Editorial photo cleanup failed", error.name);
  }
}
