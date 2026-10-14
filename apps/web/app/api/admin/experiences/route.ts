import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

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

function numberValue(value: string) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin/esperienze?state=${encodeURIComponent(state)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const action = text(form.get("action"), 40);
  const experienceId = text(form.get("experience_id"), 80);
  const supabase = createServiceClient();
  if (!supabase) return back(request, "action-error");

  try {
    if (action === "create") {
      const name = text(form.get("name"), 200);
      const slug = slugify(text(form.get("slug"), 150) || name);
      const operatorId = text(form.get("operator_id"), 80);
      const territoryId = text(form.get("territory_id"), 80);
      const categoryId = text(form.get("category_id"), 80);
      const excerpt = text(form.get("excerpt"), 300);
      const description = text(form.get("description"), 5000);
      const whySelected = text(form.get("why_selected"), 3000);
      const wantsPublished = form.get("published") === "yes";

      if (!name || !slug || !operatorId || !territoryId || !categoryId || !excerpt || !description || !whySelected) {
        return back(request, "invalid-data");
      }

      const { data: operator, error: operatorError } = await supabase
        .from("operators")
        .select("id,published,selection_status")
        .eq("id", operatorId)
        .maybeSingle();
      if (operatorError || !operator || operator.selection_status !== "selected") return back(request, "invalid-data");
      if (wantsPublished && !operator.published) return back(request, "operator-not-published");

      const duration = numberValue(text(form.get("duration_minutes"), 20));
      const price = numberValue(text(form.get("price_from"), 30));
      const latitude = numberValue(text(form.get("latitude"), 40));
      const longitude = numberValue(text(form.get("longitude"), 40));

      const { error } = await supabase.from("experiences").insert({
        name,
        slug,
        operator_id: operatorId,
        territory_id: territoryId,
        category_id: categoryId,
        excerpt,
        description,
        why_selected: whySelected,
        duration_minutes: duration == null ? null : Math.max(1, Math.round(duration)),
        price_from: price == null ? null : Math.max(0, price),
        meeting_point: text(form.get("meeting_point"), 500) || null,
        google_maps_query: text(form.get("google_maps_query"), 500) || null,
        latitude,
        longitude,
        image_url: text(form.get("image_url"), 1000) || null,
        image_alt: text(form.get("image_alt"), 500) || null,
        booking_url: text(form.get("booking_url"), 1000) || null,
        booking_note: text(form.get("booking_note"), 1000) || null,
        bookable: form.get("bookable") === "yes",
        featured: form.get("featured") === "yes",
        published: wantsPublished,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return back(request, "created");
    }

    if (!experienceId) return back(request, "invalid-data");

    if (action === "publish") {
      const { data: experience, error: readError } = await supabase
        .from("experiences")
        .select("operator:operators(published,selection_status)")
        .eq("id", experienceId)
        .maybeSingle();
      if (readError || !experience) return back(request, "invalid-data");
      const operator = experience.operator as unknown as { published: boolean; selection_status: string } | null;
      if (!operator?.published || operator.selection_status !== "selected") return back(request, "operator-not-published");

      const { error } = await supabase.from("experiences").update({ published: true, updated_at: new Date().toISOString() }).eq("id", experienceId);
      if (error) throw error;
      return back(request, "published");
    }

    if (action === "unpublish") {
      const { error } = await supabase.from("experiences").update({ published: false, updated_at: new Date().toISOString() }).eq("id", experienceId);
      if (error) throw error;
      return back(request, "unpublished");
    }

    if (action === "feature" || action === "unfeature") {
      const { error } = await supabase.from("experiences").update({ featured: action === "feature", updated_at: new Date().toISOString() }).eq("id", experienceId);
      if (error) throw error;
      return back(request, action === "feature" ? "featured" : "unfeatured");
    }
  } catch (error) {
    console.error("BIMARIS admin experience action failed", error);
    return back(request, "action-error");
  }

  return back(request, "invalid-data");
}
