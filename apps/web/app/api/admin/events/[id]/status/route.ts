import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type EventAction = "approve" | "reject" | "publish";
const permittedActions = new Set<EventAction>(["approve", "reject", "publish"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }
  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.redirect(new URL("/admin/eventi?status=invalid", request.url), 303);
  }
  const form = await request.formData();
  const rawAction = form.get("action");
  if (typeof rawAction !== "string" || !permittedActions.has(rawAction as EventAction)) {
    return NextResponse.redirect(new URL("/admin/eventi?status=invalid", request.url), 303);
  }
  const action = rawAction as EventAction;
  const db = createServiceClient();
  if (!db) return NextResponse.redirect(new URL("/admin/eventi?status=error", request.url), 303);

  // The state and publication predicates make repeat/stale requests harmless.
  const update = action === "approve"
    ? { verification_status: "verified", published: false }
    : action === "reject"
      ? { verification_status: "rejected", published: false }
      : { published: true };

  let query = db.from("events").update(update).eq("id", id).select("id");
  if (action === "publish") {
    query = query.eq("verification_status", "verified").eq("published", false);
  } else {
    query = query.eq("verification_status", "pending").eq("published", false);
  }
  const { data, error } = await query;
  const status = error ? "error" : !data?.length ? "stale" : action === "approve" ? "approved" : action === "reject" ? "rejected" : "published";
  return NextResponse.redirect(new URL(`/admin/eventi?status=${status}`, request.url), 303);
}
