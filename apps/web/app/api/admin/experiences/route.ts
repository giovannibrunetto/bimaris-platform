import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReviewNotification } from "@/lib/review-notifications";

function text(value:FormDataEntryValue|null,max:number){return typeof value==="string"?value.trim().slice(0,max):"";}
function slugify(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);}
function numberValue(value:string){if(!value)return null;const parsed=Number(value.replace(",","."));return Number.isFinite(parsed)?parsed:null;}
function back(request:NextRequest,state:string){return NextResponse.redirect(new URL(`/admin/esperienze?state=${encodeURIComponent(state)}`,request.url),303);}
function operatorDossier(request:NextRequest,operatorId:string,state:string){return NextResponse.redirect(new URL(`/admin/operatori/${encodeURIComponent(operatorId)}?tab=esperienze&state=${encodeURIComponent(state)}`,request.url),303);}
const reviewSectionFields=["basics","description","details","media","location"] as const;
type ReviewSection=(typeof reviewSectionFields)[number];
const reviewSectionLabels:Record<ReviewSection,string>={basics:"Testo breve / titolo",description:"Descrizione",details:"Durata / prezzo / dettagli",media:"Fotografie / copertina",location:"Luogo / punto di incontro"};
const reviewSectionSteps:Record<ReviewSection,number>={basics:0,description:1,details:2,media:3,location:2};
function reviewSections(form:FormData){const result:Record<string,string>={};for(const key of reviewSectionFields){if(form.get(`target_${key}`)==="yes")result[key]=reviewSectionLabels[key];const legacy=text(form.get(`review_${key}`),1000);if(legacy)result[key]=legacy;}return result;}
function reviewSummary(sections:Record<string,string>,general:string){const labels=Object.keys(sections).map(key=>reviewSectionLabels[key as ReviewSection]).filter(Boolean);return general||(labels.length?`Correggere: ${labels.join(", ")}`:"");}
function inferredSection(note:string):ReviewSection|null{const n=note.toLocaleLowerCase("it");if(/foto|fotograf|immagin|copertina|galleria/.test(n))return "media";if(/descrizion|racconto|testo lungo/.test(n))return "description";if(/durata|prezzo|costo|dettagl/.test(n))return "details";if(/luogo|incontro|indirizzo|mappa|posizion/.test(n))return "location";if(/testo breve|titolo|nome|informazion/.test(n))return "basics";return null;}
function requestedStep(sections:Record<string,string>,note:string,fallback:number){const explicit=reviewSectionFields.find(section=>Boolean(sections[section]));const key=explicit??inferredSection(note);return key?reviewSectionSteps[key]:fallback;}
function correctionSnapshot(experience:Record<string,unknown>,sections:Record<string,string>){const snapshot:Record<string,unknown>={};if(sections.basics){snapshot.name=experience.name??null;snapshot.excerpt=experience.excerpt??null;}if(sections.description)snapshot.description=experience.description??null;if(sections.details){snapshot.duration_minutes=experience.duration_minutes??null;snapshot.price_from=experience.price_from??null;snapshot.bookable=experience.bookable??false;}if(sections.location)snapshot.meeting_point=experience.meeting_point??null;return snapshot;}

export async function POST(request:NextRequest){
 if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(),action=text(form.get("action"),40),experienceId=text(form.get("experience_id"),80),supabase=createServiceClient();
 if(!supabase)return back(request,"action-error");
 try{
  if(action==="create"){
   const name=text(form.get("name"),200),slug=slugify(text(form.get("slug"),150)||name),operatorId=text(form.get("operator_id"),80),territoryId=text(form.get("territory_id"),80),categoryId=text(form.get("category_id"),80),excerpt=text(form.get("excerpt"),300),description=text(form.get("description"),5000),whySelected=text(form.get("why_selected"),3000),wantsPublished=form.get("published")==="yes";
   if(!name||!slug||!operatorId||!territoryId||!categoryId||!excerpt||!description||!whySelected)return back(request,"invalid-data");
   const {data:operator,error:operatorError}=await supabase.from("operators").select("id,published,selection_status").eq("id",operatorId).maybeSingle();
   if(operatorError||!operator||operator.selection_status!=="selected")return back(request,"invalid-data");if(wantsPublished&&!operator.published)return back(request,"operator-not-published");
   const duration=numberValue(text(form.get("duration_minutes"),20)),price=numberValue(text(form.get("price_from"),30)),latitude=numberValue(text(form.get("latitude"),40)),longitude=numberValue(text(form.get("longitude"),40));
   const {error}=await supabase.from("experiences").insert({name,slug,operator_id:operatorId,territory_id:territoryId,category_id:categoryId,excerpt,description,why_selected:whySelected,duration_minutes:duration==null?null:Math.max(1,Math.round(duration)),price_from:price==null?null:Math.max(0,price),meeting_point:text(form.get("meeting_point"),500)||null,google_maps_query:text(form.get("google_maps_query"),500)||null,latitude,longitude,image_url:text(form.get("image_url"),1000)||null,image_alt:text(form.get("image_alt"),500)||null,booking_url:text(form.get("booking_url"),1000)||null,booking_note:text(form.get("booking_note"),1000)||null,bookable:form.get("bookable")==="yes",featured:form.get("featured")==="yes",published:wantsPublished,review_status:wantsPublished?"approved":"draft",reviewed_at:wantsPublished?new Date().toISOString():null,updated_at:new Date().toISOString()});
   if(error)throw error;return back(request,"created");
  }
  if(!experienceId)return back(request,"invalid-data");
  if(action==="approve"||action==="request-changes"){
   const generalNote=text(form.get("review_notes"),2000),sections=reviewSections(form),reviewNotes=action==="request-changes"?reviewSummary(sections,generalNote):generalNote;
   if(action==="request-changes"&&(Object.keys(sections).length===0||!reviewNotes))return back(request,"review-target-required");
   const {data:experience,error:readError}=await supabase.from("experiences").select("name,excerpt,description,duration_minutes,price_from,bookable,meeting_point,review_status,review_snapshot,draft_step,operator_id,operator:operators(id,name,published,selection_status,email)").eq("id",experienceId).maybeSingle();
   const allowed=action==="request-changes"?["pending","rejected"]:["pending"];
   if(readError||!experience||!allowed.includes(experience.review_status))return back(request,"invalid-review-state");
   const operator=experience.operator as unknown as {id:string;name:string|null;published:boolean;selection_status:string;email:string|null}|null;
   if(action==="approve"){
    if(!operator||operator.selection_status!=="selected")return back(request,"operator-not-selected");
    const now=new Date().toISOString();
    if(!operator.published){const {error:operatorPublishError}=await supabase.from("operators").update({published:true,updated_at:now}).eq("id",operator.id).eq("selection_status","selected");if(operatorPublishError)throw operatorPublishError;}
    const {error}=await supabase.from("experiences").update({review_status:"approved",review_notes:reviewNotes||null,review_sections:{},review_snapshot:{},reviewed_at:now,published:true,updated_at:now}).eq("id",experienceId).eq("review_status","pending");if(error)throw error;
    if(operator.email)await sendReviewNotification({to:operator.email,experienceName:experience.name,operatorName:operator.name||"operatore BIMARIS",decision:"approved",reviewNotes:reviewNotes||null});
    return operatorDossier(request,operator.id,"experience-approved");
   }
   const targetStep=requestedStep(sections,generalNote,Number.isFinite(experience.draft_step)?experience.draft_step:0);
   const existingSnapshot=experience.review_snapshot&&typeof experience.review_snapshot==="object"&&!Array.isArray(experience.review_snapshot)?experience.review_snapshot:{};
   const snapshot=experience.review_status==="rejected"&&Object.keys(existingSnapshot as object).length?existingSnapshot:correctionSnapshot(experience as unknown as Record<string,unknown>,sections);
   const {error}=await supabase.from("experiences").update({review_status:"rejected",review_notes:reviewNotes,review_sections:sections,review_snapshot:snapshot,draft_step:targetStep,reviewed_at:new Date().toISOString(),published:false,updated_at:new Date().toISOString()}).eq("id",experienceId).in("review_status",["pending","rejected"]);if(error)throw error;
   if(operator?.email)await sendReviewNotification({to:operator.email,experienceName:experience.name,operatorName:operator.name||"operatore BIMARIS",decision:"changes-requested",reviewNotes});
   return operator?operatorDossier(request,operator.id,"changes-requested"):back(request,"changes-requested");
  }
  if(action==="publish"){
   const {data:experience,error:readError}=await supabase.from("experiences").select("operator_id,operator:operators(published,selection_status)").eq("id",experienceId).maybeSingle();if(readError||!experience)return back(request,"invalid-data");const operator=experience.operator as unknown as {published:boolean;selection_status:string}|null;if(!operator?.published||operator.selection_status!=="selected")return back(request,"operator-not-published");
   const {error}=await supabase.from("experiences").update({published:true,updated_at:new Date().toISOString()}).eq("id",experienceId);if(error)throw error;return operatorDossier(request,experience.operator_id,"experience-published");
  }
  if(action==="unpublish"){const {data:experience}=await supabase.from("experiences").select("operator_id").eq("id",experienceId).maybeSingle();const {error}=await supabase.from("experiences").update({published:false,updated_at:new Date().toISOString()}).eq("id",experienceId);if(error)throw error;return experience?.operator_id?operatorDossier(request,experience.operator_id,"experience-unpublished"):back(request,"unpublished");}
  if(action==="feature"||action==="unfeature"){const {error}=await supabase.from("experiences").update({featured:action==="feature",updated_at:new Date().toISOString()}).eq("id",experienceId);if(error)throw error;return back(request,action==="feature"?"featured":"unfeatured");}
 }catch(error){console.error("BIMARIS admin experience action failed",error);return back(request,"action-error");}
 return back(request,"invalid-data");
}
