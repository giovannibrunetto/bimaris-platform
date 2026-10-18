import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReviewNotification } from "@/lib/review-notifications";

function text(value: FormDataEntryValue | null, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function back(request: NextRequest, state: string) { return NextResponse.redirect(new URL(`/admin/revisioni-esperienze?state=${encodeURIComponent(state)}`, request.url), 303); }
const reviewSectionFields=["basics","description","details"] as const;
const reviewSectionLabels:Record<(typeof reviewSectionFields)[number],string>={basics:"Informazioni principali",description:"Descrizione",details:"Durata e prezzo"};
function reviewSections(form:FormData){return Object.fromEntries(reviewSectionFields.map(key=>[key,text(form.get(`review_${key}`),1000)]).filter(([,value])=>Boolean(value)));}
function reviewSummary(sections:Record<string,string>,general:string){const lines=Object.entries(sections).map(([key,value])=>`${reviewSectionLabels[key as keyof typeof reviewSectionLabels]}: ${value}`);if(general)lines.push(`Nota generale: ${general}`);return lines.join("\n\n");}

type RevisionContent={name?:unknown;excerpt?:unknown;description?:unknown;duration_minutes?:unknown;price_from?:unknown};
function nullableText(value:unknown,max:number){return typeof value==="string"?(value.trim().slice(0,max)||null):null;}
function nullableNumber(value:unknown){if(value===null||value===undefined||value==="")return null;const n=Number(value);return Number.isFinite(n)?n:null;}

export async function POST(request:NextRequest){
 if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(); const action=text(form.get("action"),40); const revisionId=text(form.get("revision_id"),80); const supabase=createServiceClient();
 if(!supabase||!revisionId)return back(request,"invalid-data");
 try{
  const {data:revision,error:readError}=await supabase.from("experience_revisions").select("id,experience_id,status,content,operator:operators(name,email,published,selection_status),experience:experiences(name,published,review_status)").eq("id",revisionId).maybeSingle();
  if(readError||!revision||revision.status!=="pending")return back(request,"invalid-review-state");
  const operator=revision.operator as unknown as {name:string|null;email:string|null;published:boolean;selection_status:string}|null;
  const experience=revision.experience as unknown as {name:string;published:boolean;review_status:string}|null;
  if(!experience||!experience.published||experience.review_status!=="approved"||!operator?.published||operator.selection_status!=="selected")return back(request,"invalid-source-state");
  const general=text(form.get("review_notes"),2000); const sections=reviewSections(form); const summary=reviewSummary(sections,general);
  if(action==="request-changes"){
   if(!summary)return back(request,"review-note-required");
   const {error}=await supabase.from("experience_revisions").update({status:"rejected",review_notes:summary,review_sections:sections,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",revisionId).eq("status","pending"); if(error)throw error;
   if(operator.email)await sendReviewNotification({to:operator.email,experienceName:experience.name,operatorName:operator.name||"operatore BIMARIS",decision:"changes-requested",reviewNotes:summary});
   return back(request,"changes-requested");
  }
  if(action==="approve-apply"){
   const content=(revision.content??{}) as RevisionContent; const name=nullableText(content.name,200); if(!name)return back(request,"invalid-data");
   const update={name,excerpt:nullableText(content.excerpt,300),description:nullableText(content.description,5000),duration_minutes:nullableNumber(content.duration_minutes),price_from:nullableNumber(content.price_from),updated_at:new Date().toISOString()};
   const {error:applyError}=await supabase.from("experiences").update(update).eq("id",revision.experience_id).eq("published",true).eq("review_status","approved"); if(applyError)throw applyError;
   const now=new Date().toISOString(); const {error:revisionError}=await supabase.from("experience_revisions").update({status:"applied",review_notes:general||null,review_sections:{},reviewed_at:now,applied_at:now,updated_at:now}).eq("id",revisionId).eq("status","pending"); if(revisionError)throw revisionError;
   if(operator.email)await sendReviewNotification({to:operator.email,experienceName:name,operatorName:operator.name||"operatore BIMARIS",decision:"approved",reviewNotes:general||null});
   return back(request,"approved-applied");
  }
  return back(request,"invalid-data");
 }catch(error){console.error("BIMARIS experience revision review failed",error);return back(request,"action-error");}
}
