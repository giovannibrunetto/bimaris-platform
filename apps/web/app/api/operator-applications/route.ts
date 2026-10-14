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

  const privacyConsent = body.privacy_consent === true || body.privacy_consent === "yes";

  const payload = {
    business_name: text(body.business_name, 200),
    contact_name: text(body.contact_name, 200),
    email: text(body.email, 320),
    phone: text(body.phone, 80) || null,
    whatsapp: text(body.whatsapp, 80) || null,
    category: text(body.category, 100) || null,
    location: text(body.location, 200) || null,
    address: text(body.address, 300) || null,
    website: text(body.website, 500) || null,
    instagram: text(body.instagram, 500) || null,
    description: text(body.description, 5000),
    privacy_consent: privacyConsent,
    status: "new",
  };

  if (!payload.business_name || !payload.contact_name || !payload.email || !payload.description || !privacyConsent) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  const { error } = await supabase.from("operator_applications").insert(payload);
  if (error) return NextResponse.json({ ok: false, error: "write_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
