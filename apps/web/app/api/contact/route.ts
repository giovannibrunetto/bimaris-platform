import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const payload = {
    name: text(body.name, 200),
    email: text(body.email, 320),
    subject: text(body.subject, 200) || null,
    message: text(body.message, 5000),
    status: "new",
  };

  if (!payload.name || !payload.email || !payload.message) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const rateLimit = await checkApiRateLimit(request, "contact");
  if (rateLimit === "limited") return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": "900" } });
  if (rateLimit === "unavailable") return NextResponse.json({ ok: false, error: "rate_limit_unavailable" }, { status: 503 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  const { error } = await supabase.from("contact_messages").insert(payload);
  if (error) return NextResponse.json({ ok: false, error: "write_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
