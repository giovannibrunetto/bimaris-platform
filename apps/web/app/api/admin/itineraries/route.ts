import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const COVER_BUCKET = "itinerary-covers";
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const COVER_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function intOrNull(value: string, min = 0, max = 100000) {
  if (!value) return null;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin/itinerari?state=${encodeURIComponent(state)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const action = text(form.get("action"), 40);
  const itineraryId = text(form.get("itinerary_id"), 80);
  const stopId = text(form.get("stop_id"), 80);
  const supabase = createServiceClient();
  if (!supabase) return back(request, "action-error");

  try {
    if (action === "create") {
      const title = text(form.get("title"), 200);
      const excerpt = text(form.get("excerpt"), 320);
      const description = text(form.get("description"), 6000);
      const slug = slugify(text(form.get("slug"), 150) || title);
      if (!title || !excerpt || !description || !slug) return back(request, "invalid-data");

      const { error } = await supabase.from("itineraries").insert({
        title,
        slug,
        excerpt,
        description,
        duration_minutes: intOrNull(text(form.get("duration_minutes"), 10), 1, 10080),
        target: text(form.get("target"), 180) || null,
        territory: text(form.get("territory"), 180) || null,
        image_url: text(form.get("image_url"), 1200) || null,
        image_alt: text(form.get("image_alt"), 300) || null,
        featured: form.get("featured") === "yes",
        published: false,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return back(request, "created");
    }

    if (action === "upload_cover" && itineraryId) {
      const cover = form.get("cover");
      if (!(cover instanceof File) || cover.size === 0) return back(request, "invalid-cover");
      if (cover.size > MAX_COVER_BYTES) return back(request, "cover-too-large");

      const extension = COVER_EXTENSIONS[cover.type];
      if (!extension) return back(request, "invalid-cover");

      const { data: itinerary, error: itineraryError } = await supabase
        .from("itineraries")
        .select("slug,title")
        .eq("id", itineraryId)
        .maybeSingle();
      if (itineraryError) throw itineraryError;
      if (!itinerary) return back(request, "invalid-data");

      const storagePath = `${itinerary.slug}/${Date.now()}.${extension}`;
      const bytes = new Uint8Array(await cover.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(storagePath, bytes, {
          contentType: cover.type,
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(COVER_BUCKET).getPublicUrl(storagePath);
      const imageAlt = text(form.get("image_alt"), 300) || `Illustrazione di copertina per ${itinerary.title}`;
      const { error: updateError } = await supabase
        .from("itineraries")
        .update({
          image_url: publicUrlData.publicUrl,
          image_alt: imageAlt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itineraryId);
      if (updateError) throw updateError;

      return back(request, "cover-uploaded");
    }

    if ((action === "publish" || action === "unpublish" || action === "feature" || action === "unfeature") && itineraryId) {
      if (action === "publish") {
        const { count, error: countError } = await supabase
          .from("itinerary_stops")
          .select("id", { count: "exact", head: true })
          .eq("itinerary_id", itineraryId);
        if (countError) throw countError;
        if (!count) return back(request, "no-stops");
      }

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (action === "publish") patch.published = true;
      if (action === "unpublish") patch.published = false;
      if (action === "feature") patch.featured = true;
      if (action === "unfeature") patch.featured = false;

      const { error } = await supabase.from("itineraries").update(patch).eq("id", itineraryId);
      if (error) throw error;
      return back(request, action === "publish" ? "published" : action === "unpublish" ? "unpublished" : action === "feature" ? "featured" : "unfeatured");
    }

    if (action === "add_stop" && itineraryId) {
      const sourceKey = text(form.get("source_key"), 120);
      const stayMinutes = intOrNull(text(form.get("stay_minutes"), 10), 1, 1440);
      const note = text(form.get("note"), 1000) || null;
      const googleMapsQuery = text(form.get("google_maps_query"), 600) || null;
      const customTitle = text(form.get("custom_title"), 220);

      const { data: lastStop, error: lastStopError } = await supabase
        .from("itinerary_stops")
        .select("position")
        .eq("itinerary_id", itineraryId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastStopError) throw lastStopError;
      const position = (lastStop?.position ?? 0) + 1;

      const insert: Record<string, unknown> = {
        itinerary_id: itineraryId,
        position,
        stay_minutes: stayMinutes,
        note,
        google_maps_query: googleMapsQuery,
      };

      if (sourceKey === "custom") {
        if (!customTitle) return back(request, "invalid-data");
        insert.custom_title = customTitle;
      } else {
        const [kind, id] = sourceKey.split(":", 2);
        if (!id || !["culture", "story", "experience", "operator"].includes(kind)) return back(request, "invalid-data");

        const sourceConfig = {
          culture: { table: "culture_entries", column: "culture_entry_id" },
          story: { table: "stories", column: "story_id" },
          experience: { table: "experiences", column: "experience_id" },
          operator: { table: "operators", column: "operator_id" },
        } as const;
        const config = sourceConfig[kind as keyof typeof sourceConfig];
        let sourceQuery = supabase.from(config.table).select("id").eq("id", id).eq("published", true);
        if (kind === "operator") sourceQuery = sourceQuery.eq("selection_status", "selected");
        const { data: source, error: sourceError } = await sourceQuery.maybeSingle();
        if (sourceError) throw sourceError;
        if (!source) return back(request, "invalid-data");
        insert[config.column] = id;
      }

      const { error } = await supabase.from("itinerary_stops").insert(insert);
      if (error) throw error;
      await supabase.from("itineraries").update({ updated_at: new Date().toISOString() }).eq("id", itineraryId);
      return back(request, "stop-added");
    }

    if (action === "delete_stop" && stopId) {
      const { data: stop, error: readError } = await supabase.from("itinerary_stops").select("itinerary_id").eq("id", stopId).maybeSingle();
      if (readError) throw readError;
      const { error } = await supabase.from("itinerary_stops").delete().eq("id", stopId);
      if (error) throw error;
      if (stop?.itinerary_id) await supabase.from("itineraries").update({ updated_at: new Date().toISOString() }).eq("id", stop.itinerary_id);
      return back(request, "stop-deleted");
    }
  } catch (error) {
    console.error("BIMARIS admin itinerary action failed", error);
    return back(request, "action-error");
  }

  return back(request, "invalid-data");
}
