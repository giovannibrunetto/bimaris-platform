import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin?state=${encodeURIComponent(state)}`, request.url), 303);
}

function operatorAccessRedirect(request: NextRequest) {
  return new URL("/area-operatore", request.nextUrl.origin).toString();
}

async function ensureOperatorAccount(supabase: NonNullable<ReturnType<typeof createServiceClient>>, applicationId: string, slug: string, request: NextRequest) {
  const { data: application, error: applicationError } = await supabase.from("operator_applications").select("email,business_name").eq("id", applicationId).single();
  if (applicationError) throw applicationError;
  const email = application?.email?.trim().toLowerCase();
  if (!email) return "account-required" as const;

  const { data: operator, error: operatorError } = await supabase.from("operators").select("id").eq("slug", slug).single();
  if (operatorError) throw operatorError;

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw usersError;
  let user = usersData.users.find((item) => item.email?.toLowerCase() === email);
  let invited = false;

  if (!user) {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: operatorAccessRedirect(request),
      data: {
        bimaris_operator: true,
        operator_slug: slug,
        business_name: application?.business_name ?? undefined,
      },
    });
    if (inviteError) throw inviteError;
    user = inviteData.user;
    invited = true;
  }

  if (!user) return "account-required" as const;
  const { error: membershipError } = await supabase.from("operator_memberships").upsert({ operator_id: operator.id, user_id: user.id, role: "owner" }, { onConflict: "operator_id,user_id" });
  if (membershipError) throw membershipError;
  return invited ? "invited" as const : "linked" as const;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

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
      const { error } = await supabase.from("operator_applications").update({ status: "reviewing", reviewed_at: new Date().toISOString(), review_notes: notes }).eq("id", applicationId).in("status", ["new", "reviewing"]);
      if (error) throw error;
      return back(request, "reviewing");
    }
    if (action === "reject" && applicationId) {
      const { error } = await supabase.rpc("reject_operator_application", { p_application_id: applicationId, p_notes: notes });
      if (error) throw error;
      return back(request, "rejected");
    }
    if ((action === "accept" || action === "accept_publish") && applicationId) {
      const slug = slugify(requestedSlug || businessName);
      if (!slug) return back(request, "invalid-slug");
      const { error } = await supabase.rpc("accept_operator_application", { p_application_id: applicationId, p_slug: slug, p_why_selected: notes, p_publish: action === "accept_publish" });
      if (error) throw error;
      const access = await ensureOperatorAccount(supabase, applicationId, slug, request);
      const base = action === "accept_publish" ? "published" : "accepted";
      return back(request, access === "invited" ? `${base}-access-invited` : access === "linked" ? `${base}-access-linked` : `${base}-account-required`);
    }
    if (action === "publish_operator" && operatorId) {
      const { error } = await supabase.from("operators").update({ published: true, selection_status: "selected", updated_at: new Date().toISOString() }).eq("id", operatorId);
      if (error) throw error;
      return back(request, "published");
    }
    if (action === "unpublish_operator" && operatorId) {
      const { error } = await supabase.from("operators").update({ published: false, updated_at: new Date().toISOString() }).eq("id", operatorId);
      if (error) throw error;
      return back(request, "unpublished");
    }
  } catch (error) {
    console.error("BIMARIS admin application action failed", error);
    return back(request, "action-error");
  }
  return back(request, "invalid-action");
}
