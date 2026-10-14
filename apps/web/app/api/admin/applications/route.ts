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

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin?state=${encodeURIComponent(state)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const action = text(form.get("action"), 40);
  const applicationId = text(form.get("application_id"), 80);
  const operatorId = text(form.get("operator_id"), 80);
  const notes = text(form.get("notes"), 2000) || null;
  const businessName = text(form.get("business_name"), 200);
  const requestedSlug = text(form.get("slug"), 150);

  const supabase = createServiceClient();
  if (!supabase) return back(request, "service-error");

  try {
    if (action === "reviewing" && applicationId) {
      const { error } = await supabase
        .from("operator_applications")
        .update({ status: "reviewing", reviewed_at: new Date().toISOString(), review_notes: notes })
        .eq("id", applicationId)
        .in("status", ["new", "reviewing"]);
      if (error) throw error;
      return back(request, "reviewing");
    }

    if (action === "reject" && applicationId) {
      const { error } = await supabase.rpc("reject_operator_application", {
        p_application_id: applicationId,
        p_notes: notes,
      });
      if (error) throw error;
      return back(request, "rejected");
    }

    if ((action === "accept" || action === "accept_publish") && applicationId) {
      const slug = slugify(requestedSlug || businessName);
      if (!slug) return back(request, "invalid-slug");

      const { error } = await supabase.rpc("accept_operator_application", {
        p_application_id: applicationId,
        p_slug: slug,
        p_why_selected: notes,
        p_publish: action === "accept_publish",
      });
      if (error) throw error;
      return back(request, action === "accept_publish" ? "published" : "accepted");
    }

    if (action === "publish_operator" && operatorId) {
      const { error } = await supabase
        .from("operators")
        .update({ published: true, selection_status: "selected", updated_at: new Date().toISOString() })
        .eq("id", operatorId);
      if (error) throw error;
      return back(request, "published");
    }

    if (action === "unpublish_operator" && operatorId) {
      const { error } = await supabase
        .from("operators")
        .update({ published: false, updated_at: new Date().toISOString() })
        .eq("id", operatorId);
      if (error) throw error;
      return back(request, "unpublished");
    }
  } catch (error) {
    console.error("BIMARIS admin application action failed", error);
    return back(request, "action-error");
  }

  return back(request, "invalid-action");
}
