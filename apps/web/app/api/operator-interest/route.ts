import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

const interests = new Set(["b2c", "b2b", "both"]);
const categories = new Set(["hospitality", "food_beverage", "producer", "experience", "guide", "artisan", "culture", "other"]);
const locationSources = new Set(["google_places", "manual"]);
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
const email = (value: unknown) => text(value, 320).toLowerCase();
const phone = (value: unknown) => { const raw=text(value,80); if(!raw)return null; const plus=raw.startsWith("+"); const digits=raw.replace(/\D/g,""); return digits ? `${plus?"+":""}${digits}` : null; };
const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ok:false,error:"invalid_body"},{status:400}); }

  if (text(body.website_url, 200)) return NextResponse.json({ok:true},{status:201});

  const categoryCode = categories.has(body.category_code) ? body.category_code : "";
  const physicalAddress = text(body.physical_address ?? body.location, 500);
  const locationSource = locationSources.has(body.location_source) ? body.location_source : "manual";
  const latitude = numberOrNull(body.physical_latitude);
  const longitude = numberOrNull(body.physical_longitude);

  const payload = {
    business_name: text(body.business_name, 200),
    category: categoryCode,
    category_code: categoryCode,
    location: physicalAddress,
    physical_address: physicalAddress,
    physical_city: text(body.physical_city, 160) || null,
    physical_province: text(body.physical_province, 120) || null,
    physical_postal_code: text(body.physical_postal_code, 32) || null,
    physical_country_code: text(body.physical_country_code, 2).toUpperCase() || null,
    physical_latitude: latitude,
    physical_longitude: longitude,
    google_place_id: locationSource === "google_places" ? (text(body.google_place_id, 255) || null) : null,
    location_source: locationSource,
    contact_name: text(body.contact_name, 200),
    email: email(body.email),
    phone: phone(body.phone),
    site_social: text(body.site_social, 500) || null,
    interest: interests.has(body.interest) ? body.interest : "",
    privacy_consent: body.privacy_consent === true || body.privacy_consent === "yes",
    source: "public_prelaunch",
    status: "new",
  };

  if (!payload.business_name || !payload.category_code || !payload.physical_address || !payload.contact_name || !payload.email || !payload.interest || !payload.privacy_consent) {
    return NextResponse.json({ok:false,error:"missing_fields"},{status:400});
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return NextResponse.json({ok:false,error:"invalid_email"},{status:400});
  if ((latitude !== null && (latitude < -90 || latitude > 90)) || (longitude !== null && (longitude < -180 || longitude > 180))) {
    return NextResponse.json({ok:false,error:"invalid_location"},{status:400});
  }

  const rateLimit = await checkApiRateLimit(request, "operator_interest");
  if (rateLimit === "limited") return NextResponse.json({ok:false,error:"rate_limited"},{status:429,headers:{"Retry-After":"3600"}});
  if (rateLimit === "unavailable") return NextResponse.json({ok:false,error:"rate_limit_unavailable"},{status:503});

  const db = createServiceClient();
  if (!db) return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  const { error } = await db.from("operator_interest_manifestations").insert(payload);
  if (error) return NextResponse.json({ok:false,error:"write_failed"},{status:500});
  return NextResponse.json({ok:true},{status:201});
}
