import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

const interests = new Set(["b2c", "b2b", "both"]);
const categories = new Set(["hospitality", "food_beverage", "producer", "experience", "guide", "artisan", "culture", "other"]);
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
const email = (value: unknown) => text(value, 320).toLowerCase();
const phone = (value: unknown) => { const raw=text(value,80); if(!raw)return null; const plus=raw.startsWith("+"); const digits=raw.replace(/\D/g,""); return digits ? `${plus?"+":""}${digits}` : null; };

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ok:false,error:"invalid_body"},{status:400}); }

  if (text(body.website_url, 200)) return NextResponse.json({ok:true},{status:201});

  const categoryCode = categories.has(body.category_code) ? body.category_code : "";
  // Data minimisation for pre-launch interest: retain only the locality needed to
  // understand territorial relevance. Exact coordinates, postal code and Google
  // Place ID are deliberately not persisted by this endpoint.
  const locality = text(body.physical_city, 160) || text(body.physical_province, 120) || text(body.physical_address ?? body.location, 200);

  const payload = {
    business_name: text(body.business_name, 200),
    category: categoryCode,
    category_code: categoryCode,
    location: locality,
    physical_address: null,
    physical_city: text(body.physical_city, 160) || null,
    physical_province: text(body.physical_province, 120) || null,
    physical_postal_code: null,
    physical_country_code: null,
    physical_latitude: null,
    physical_longitude: null,
    google_place_id: null,
    location_source: "manual",
    contact_name: text(body.contact_name, 200),
    email: email(body.email),
    phone: phone(body.phone),
    site_social: text(body.site_social, 500) || null,
    interest: interests.has(body.interest) ? body.interest : "",
    privacy_consent: body.privacy_consent === true || body.privacy_consent === "yes",
    source: "public_prelaunch",
    status: "new",
    last_interaction_at: new Date().toISOString(),
  };

  if (!payload.business_name || !payload.category_code || !payload.location || !payload.contact_name || !payload.email || !payload.interest || !payload.privacy_consent) {
    return NextResponse.json({ok:false,error:"missing_fields"},{status:400});
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return NextResponse.json({ok:false,error:"invalid_email"},{status:400});

  const rateLimit = await checkApiRateLimit(request, "operator_interest");
  if (rateLimit === "limited") return NextResponse.json({ok:false,error:"rate_limited"},{status:429,headers:{"Retry-After":"3600"}});
  if (rateLimit === "unavailable") return NextResponse.json({ok:false,error:"rate_limit_unavailable"},{status:503});

  const db = createServiceClient();
  if (!db) return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  const { error } = await db.from("operator_interest_manifestations").insert(payload);
  if (error) return NextResponse.json({ok:false,error:"write_failed"},{status:500});
  return NextResponse.json({ok:true},{status:201});
}
