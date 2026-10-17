import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function back(request: NextRequest, state: string) {
  return NextResponse.redirect(new URL(`/admin/operatori?state=${encodeURIComponent(state)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const operatorId = text(form.get("operator_id"), 80);
  const email = text(form.get("email"), 320).toLowerCase();
  const role = text(form.get("role"), 20);
  if (!operatorId || !email || !["owner", "manager", "viewer"].includes(role)) return back(request, "membership-invalid");

  const supabase = createServiceClient();
  if (!supabase) return back(request, "service-error");

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (!user) return back(request, "membership-user-not-found");

    const { error: membershipError } = await supabase
      .from("operator_memberships")
      .upsert({ operator_id: operatorId, user_id: user.id, role }, { onConflict: "operator_id,user_id" });
    if (membershipError) throw membershipError;
    return back(request, "membership-linked");
  } catch (error) {
    console.error("BIMARIS operator membership action failed", error);
    return back(request, "membership-error");
  }
}
