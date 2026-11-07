import { rejectCrossSiteAdminMutation } from "@/lib/admin-request-origin";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin/operatori/accessi?state=${encodeURIComponent(state)}`, request.url), 303);
}

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;
async function findUserByEmail(db: ServiceClient, email: string) {
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(user => user.email?.trim().toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
  throw new Error("Auth user lookup limit reached");
}

export async function POST(request: NextRequest) {
  const crossSiteRejection = rejectCrossSiteAdminMutation(request);
  if (crossSiteRejection) return crossSiteRejection;
  if (!(await isAuthorizedAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return back(request, "invalid-origin");
    } catch {
      return back(request, "invalid-origin");
    }
  }

  const form = await request.formData();
  const operatorId = text(form.get("operator_id"), 80);
  const action = text(form.get("action"), 24) || "link";
  const email = text(form.get("email"), 320).toLowerCase();
  const userId = text(form.get("user_id"), 80);
  const role = text(form.get("role"), 20);
  if (!operatorId || !["link", "update_role", "revoke"].includes(action)) return back(request, "membership-invalid");
  if (action === "link" && (!email || !["owner", "manager", "viewer"].includes(role))) return back(request, "membership-invalid");
  if (action === "update_role" && (!userId || !["owner", "manager", "viewer"].includes(role))) return back(request, "membership-invalid");
  if (action === "revoke" && !userId) return back(request, "membership-invalid");

  const db = createServiceClient();
  if (!db) return back(request, "service-error");
  try {
    const { data: operator, error: operatorError } = await db.from("operators").select("id").eq("id", operatorId).maybeSingle();
    if (operatorError) throw operatorError;
    if (!operator) return back(request, "operator-not-found");

    if (action === "link") {
      const user = await findUserByEmail(db, email);
      if (!user) return back(request, "membership-user-not-found");
      const { data: existing, error: existingError } = await db.from("operator_memberships")
        .select("role").eq("operator_id", operatorId).eq("user_id", user.id).maybeSingle();
      if (existingError) throw existingError;
      // Existing assignments must be edited explicitly, not overwritten by the add-account form.
      if (existing) return back(request, "membership-already-linked");
      const { error } = await db.from("operator_memberships").insert({ operator_id: operatorId, user_id: user.id, role });
      if (error) throw error;
      return back(request, "membership-linked");
    }

    const { data: member, error: memberError } = await db.from("operator_memberships")
      .select("user_id,role").eq("operator_id", operatorId).eq("user_id", userId).maybeSingle();
    if (memberError) throw memberError;
    if (!member) return back(request, "membership-not-found");
    if (member.role === "owner" && (action === "revoke" || role !== "owner")) {
      const { count, error: countError } = await db.from("operator_memberships")
        .select("user_id", { count: "exact", head: true }).eq("operator_id", operatorId).eq("role", "owner");
      if (countError) throw countError;
      if ((count ?? 0) <= 1) return back(request, "last-owner-protected");
    }

    if (action === "update_role") {
      const { data, error } = await db.from("operator_memberships").update({ role })
        .eq("operator_id", operatorId).eq("user_id", userId).select("user_id");
      if (error) throw error;
      return back(request, data?.length ? "membership-role-updated" : "membership-not-found");
    }
    const { data, error } = await db.from("operator_memberships").delete()
      .eq("operator_id", operatorId).eq("user_id", userId).select("user_id");
    if (error) throw error;
    // Remove only the operator relationship, never the Supabase Auth account.
    return back(request, data?.length ? "membership-revoked" : "membership-not-found");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23514") {
      return back(request, "last-owner-protected");
    }
    console.error("BIMARIS operator membership action failed", error);
    return back(request, "membership-error");
  }
}
