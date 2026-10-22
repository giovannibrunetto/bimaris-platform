import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const OPERATOR_CATEGORIES = [
  "Ristorazione ed enogastronomia",
  "Produttori e aziende agricole",
  "Guide, escursioni e outdoor",
  "Cultura e visite",
  "Artigianato",
  "Ospitalità e ricettività",
  "Benessere",
  "Servizi turistici e mobilità",
  "Altri servizi ed esperienze",
] as const;

function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : ""; }
function email(value: unknown) { return text(value, 320).toLowerCase(); }
function phone(value: unknown) { const raw=text(value,80);if(!raw)return null;const hasPlus=raw.startsWith("+");const digits=raw.replace(/\D/g,"");return digits?`${hasPlus?"+":""}${digits}`:null; }
function url(value: unknown) { const raw=text(value,500);return raw?raw.replace(/\s+/g,""):null; }
function instagram(value: unknown) { const raw=text(value,500);return raw?raw.replace(/\s+/g,""):null; }
function number(value: unknown) { const parsed=typeof value==="number"?value:Number(value);return Number.isFinite(parsed)?parsed:null; }

export async function POST(request: NextRequest) {
  let body:any;try{body=await request.json()}catch{return NextResponse.json({ok:false,error:"invalid_body"},{status:400})}
  const privacyConsent=body.privacy_consent===true||body.privacy_consent==="yes";
  const operatingMode=["fixed","itinerant","both"].includes(body.operating_mode)?body.operating_mode:null;
  const requestedCategory=text(body.category,100);
  const category=OPERATOR_CATEGORIES.includes(requestedCategory as (typeof OPERATOR_CATEGORIES)[number])?requestedCategory:null;
  const payload={
    business_name:text(body.business_name,200),contact_name:text(body.contact_name,200),email:email(body.email),phone:phone(body.phone),whatsapp:phone(body.whatsapp),category,
    operating_mode:operatingMode,location:text(body.location,200)||null,address:text(body.address,300)||null,google_place_id:text(body.google_place_id,250)||null,latitude:number(body.latitude),longitude:number(body.longitude),
    website:url(body.website),instagram:instagram(body.instagram),description:text(body.description,5000),privacy_consent:privacyConsent,status:"new",
  };
  if(!payload.business_name||!payload.contact_name||!payload.email||!payload.category||!payload.description||!payload.location||!operatingMode||!privacyConsent)return NextResponse.json({ok:false,error:"missing_fields"},{status:400});
  if((operatingMode==="fixed"||operatingMode==="both")&&!payload.address)return NextResponse.json({ok:false,error:"missing_address"},{status:400});
  const rateLimit=await checkApiRateLimit(request,"operator_application");
  if(rateLimit==="limited")return NextResponse.json({ok:false,error:"rate_limited"},{status:429,headers:{"Retry-After":"900"}});
  if(rateLimit==="unavailable")return NextResponse.json({ok:false,error:"rate_limit_unavailable"},{status:503});
  const supabase=createServiceClient();if(!supabase)return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  const {error}=await supabase.from("operator_applications").insert(payload);if(error)return NextResponse.json({ok:false,error:"write_failed"},{status:500});
  return NextResponse.json({ok:true});
}
