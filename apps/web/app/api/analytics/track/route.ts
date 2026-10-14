import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const allowedEvents = new Set([
  "page_view", "experience_view", "operator_view", "territory_view", "itinerary_view",
  "map_open", "map_marker_click", "search", "filter_used", "favorite_added", "favorite_removed",
  "phone_click", "whatsapp_click", "website_click", "instagram_click", "directions_click",
  "booking_click", "share_click", "operator_application_started", "operator_application_submitted",
]);

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!body?.event || !allowedEvents.has(body.event)) return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: true, persisted: false });

  const properties = typeof body.properties === "object" && body.properties ? body.properties : {};
  const { error } = await supabase.from("analytics_events").insert({
    event_name: body.event,
    path: typeof body.path === "string" ? body.path.slice(0, 500) : null,
    session_id: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null,
    anonymous_id: typeof body.anonymousId === "string" ? body.anonymousId.slice(0, 100) : null,
    user_id: typeof body.userId === "string" ? body.userId : null,
    properties,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) return NextResponse.json({ ok: false, error: "write_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true });
}
