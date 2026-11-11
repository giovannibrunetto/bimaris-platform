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
function number(value: unknown) { if(value===null||value===undefined||typeof value==="string"&&!value.trim())return null;const parsed=typeof value==="number"?value:Number(value);return Number.isFinite(parsed)?parsed:null; }

export async function POST(request: NextRequest) {
  let body:any;try{body=await request.json()}catch{return NextResponse.json({ok:false,error:"invalid_body"},{status:400})}
  if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({ok:false,error:"invalid_body"},{status:400});
  const privacyConsent=body.privacy_consent===true||body.privacy_consent==="yes";
  const operatingMode=["fixed","itinerant","both"].includes(body.operating_mode)?body.operating_mode:null;
  const requestedCategory=text(body.category,100);
  const category=OPERATOR_CATEGORIES.includes(requestedCategory as (typeof OPERATOR_CATEGORIES)[number])?requestedCategory:null;
  const payload={
    vat_number:text(body.vat_number,20)||null,business_name:text(body.business_name,200),contact_name:text(body.contact_name,200),email:email(body.email),phone:phone(body.phone),whatsapp:phone(body.whatsapp),category,
    operating_mode:operatingMode,location:text(body.location,200)||null,address:text(body.address,300)||null,google_place_id:text(body.google_place_id,250)||null,latitude:number(body.latitude),longitude:number(body.longitude),
    website:url(body.website),instagram:instagram(body.instagram),description:text(body.description,5000),privacy_consent:privacyConsent,status:"new",
  };
  if(!payload.business_name||!payload.contact_name||!payload.email||!payload.category||!payload.description||!payload.location||!operatingMode||!privacyConsent)return NextResponse.json({ok:false,error:"missing_fields"},{status:400});
  if((operatingMode==="fixed"||operatingMode==="both")&&!payload.address)return NextResponse.json({ok:false,error:"missing_address"},{status:400});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))return NextResponse.json({ok:false,error:"invalid_email"},{status:400});
  if(payload.vat_number&&!/^\d{11}$/.test(payload.vat_number))return NextResponse.json({ok:false,error:"invalid_vat_number"},{status:400});
  const hasLatitude=payload.latitude!==null,hasLongitude=payload.longitude!==null;
  if(hasLatitude!==hasLongitude||hasLatitude&&(!Number.isFinite(payload.latitude)||!Number.isFinite(payload.longitude)||payload.latitude! < -90||payload.latitude! > 90||payload.longitude! < -180||payload.longitude! > 180))return NextResponse.json({ok:false,error:"invalid_coordinates"},{status:400});

  const rateLimit=await checkApiRateLimit(request,"operator_application");
  if(rateLimit==="limited")return NextResponse.json({ok:false,error:"rate_limited"},{status:429,headers:{"Retry-After":"900"}});
  if(rateLimit==="unavailable")return NextResponse.json({ok:false,error:"rate_limit_unavailable"},{status:503});
  const supabase=createServiceClient();if(!supabase)return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  // A contact already admitted or awaiting review must not submit a second application.
  // Return a neutral response to avoid disclosing registration status through the public API.
  const {data:existingApplications,error:lookupError}=await supabase.from("operator_applications")
    .select("id,status").eq("email",payload.email).in("status",["new","reviewing","accepted"]).limit(1);
  if(lookupError)return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  if((existingApplications??[]).length>0)return NextResponse.json({ok:true});

  // Also block contacts who already have an operator profile, including profiles
  // created administratively rather than through an application.
  const {data:registeredOperators,error:operatorLookupError}=await supabase.from("operators")
    .select("id").ilike("email",payload.email).limit(1);
  if(operatorLookupError)return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
  if((registeredOperators??[]).length>0)return NextResponse.json({ok:true});

  // VAT alone is not a unique operator key: one legal entity may manage
  // multiple distinct activities. Match the declared business as well.
  if(payload.vat_number){
    const [{data:vatApplications,error:vatApplicationError},{data:vatOperators,error:vatOperatorError}]=await Promise.all([
      supabase.from("operator_applications").select("id,business_name").eq("vat_number",payload.vat_number).in("status",["new","reviewing","accepted"]),
      supabase.from("operators").select("id,name").eq("vat_number",payload.vat_number)
    ]);
    if(vatApplicationError||vatOperatorError)return NextResponse.json({ok:false,error:"service_unavailable"},{status:503});
    const normalizeName=(value:string)=>value.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("it");
    const name=normalizeName(payload.business_name);
    if((vatApplications??[]).some(a=>normalizeName(a.business_name)===name)||
       (vatOperators??[]).some(o=>normalizeName(o.name)===name))return NextResponse.json({ok:true});
  }

  const {error}=await supabase.from("operator_applications").insert(payload);if(error)return NextResponse.json({ok:false,error:"write_failed"},{status:500});
  return NextResponse.json({ok:true});
}
