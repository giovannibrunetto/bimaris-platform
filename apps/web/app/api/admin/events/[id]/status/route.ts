import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { eventTransition } from "@/lib/admin-event-transitions";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const transition = typeof rawAction === "string" ? eventTransition(rawAction) : null;
  if (!transition) {
    return NextResponse.redirect(new URL("/admin/eventi?status=invalid", request.url), 303);
  }
  const db = createServiceClient();
  if (!db) return NextResponse.redirect(new URL("/admin/eventi?status=error", request.url), 303);

  // State guards are checked atomically with the write, also for repeated requests.
  const { data, error } = await db.from("events").update(transition.update)
    .eq("id", id)
    .eq("verification_status", transition.expectedStatus)
    .eq("published", transition.expectedPublished)
    .select("id");
  const status = error ? "error" : !data?.length ? "stale" : transition.successStatus;
  return NextResponse.redirect(new URL(`/admin/eventi?status=${status}`, request.url), 303);
}
