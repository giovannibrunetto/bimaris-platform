import { experienceRevisionBlocker } from "@/lib/experience-revision-blocker";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-request-origin";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReviewNotification } from "@/lib/review-notifications";
import { recordOperatorNotice } from "@/lib/operator-notifications";

const LIVE_MEDIA_BUCKET="experience-media";
const REVISION_MEDIA_BUCKET="experience-revision-media";

function text(value: FormDataEntryValue | null, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function reviewResult(request: NextRequest, state: string, experienceId?: string) {
  const path = experienceId
    ? `/admin/esperienze/${encodeURIComponent(experienceId)}/revisione`
    : "/admin/contenuti?categoria=esperienze";
  const url = new URL(path, request.url);
  url.searchParams.set("state", state);
  url.hash = experienceId ? "revision-outcome" : "experience-queue-outcome";
  return NextResponse.redirect(url, 303);
}
const reviewSectionFields=["basics","description","details"] as const;
const reviewSectionLabels:Record<(typeof reviewSectionFields)[number],string>={basics:"Informazioni principali",description:"Descrizione",details:"Durata e prezzo"};
function reviewSections(form:FormData){return Object.fromEntries(reviewSectionFields.map(key=>[key,text(form.get(`review_${key}`),1000)]).filter(([,value])=>Boolean(value)));}
function reviewSummary(sections:Record<string,string>,general:string){const lines=Object.entries(sections).map(([key,value])=>`${reviewSectionLabels[key as keyof typeof reviewSectionLabels]}: ${value}`);if(general)lines.push(`Nota generale: ${general}`);return lines.join("\n\n");}
function rpcState(error:{message?:string}|null){const message=error?.message??"";if(message.includes("invalid-review-state"))return "invalid-review-state";if(message.includes("invalid-source-state"))return "invalid-source-state";if(message.includes("invalid-data"))return "invalid-data";return "action-error";}
function filename(path:string){return path.split("/").filter(Boolean).pop()||"media.webp";}

type PromotedMedia={id:string;privatePath:string;livePath:string};

export async function POST(request:NextRequest){
  const crossSiteRejection = rejectCrossSiteAdminMutation(request);
  if (crossSiteRejection) return crossSiteRejection;
 if(!(await isAuthorizedAdmin()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(); const action=text(form.get("action"),40); const revisionId=text(form.get("revision_id"),80); const supabase=createServiceClient();
 const back = (state: string) => reviewResult(request, state, experienceId);
 let experienceId: string | undefined;
 if(!supabase||!revisionId)return back("invalid-data");
 try{
  const {data:revision,error:readError}=await supabase.from("experience_revisions").select("id,experience_id,operator_id,status,operator:operators(name,email,published,selection_status),experience:experiences(name,published,review_status)").eq("id",revisionId).maybeSingle();
  experienceId = revision?.experience_id;
  if(readError||!revision||revision.status!=="pending")return back("invalid-review-state");
  const operator=revision.operator as unknown as {name:string|null;email:string|null;published:boolean;selection_status:string}|null;
  const experience=revision.experience as unknown as {name:string;published:boolean;review_status:string}|null;
  if (!experience || !operator) return back(experienceRevisionBlocker(experience, operator) ?? "invalid-source-state");
  const blocker = experienceRevisionBlocker(experience, operator);
  // A published operator is required to apply a revision, not to request a correction.
  // Keep all other source-state guards in place for either decision.
  if (blocker && !(action === "request-changes" && blocker === "operator-not-published")) return back(blocker);
  const general=text(form.get("review_notes"),2000); const sections=reviewSections(form); const summary=reviewSummary(sections,general);
  if(action==="request-changes"){
   if(!summary)return back("review-note-required");
   const {error}=await supabase.from("experience_revisions").update({status:"rejected",review_notes:summary,review_sections:sections,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",revisionId).eq("status","pending"); if(error)throw error;
   await recordOperatorNotice({operatorId:revision.operator_id,category:"experience",eventKey:`experience-revision-changes:${revisionId}`,title:"Modifica esperienza: correzioni richieste",description:`Per “${experience.name}” sono state richieste alcune correzioni.`,targetPath:"/area-operatore?tab=esperienze"});
   if(operator.email)await sendReviewNotification({to:operator.email,experienceName:experience.name,operatorName:operator.name||"operatore BIMARIS",decision:"changes-requested",reviewNotes:summary});
   return back("changes-requested");
  }
  if(action==="approve-apply"){
   const {data:revisionMedia,error:mediaError}=await supabase.from("experience_revision_media").select("id,source_media_id,storage_path").eq("revision_id",revisionId);
   if(mediaError)return back("action-error");
   const promoted:PromotedMedia[]=[];
   const outcome=()=>experience.published
    ? back("approved-applied")
    : NextResponse.redirect(new URL(`/admin/esperienze/${encodeURIComponent(revision.experience_id)}?state=revision-approved-awaiting-publication#admin-decision`,request.url),303);
   let revisionApplied=false;
   try{
    for(const item of revisionMedia??[]){
     if(item.source_media_id)continue;
     const privatePath=String(item.storage_path||"");
     if(!privatePath)throw new Error("invalid-revision-media-path");
     const livePath=`${revision.operator_id}/${revision.experience_id}/${revisionId}-${item.id}-${filename(privatePath)}`;
     const copied=await supabase.storage.from(REVISION_MEDIA_BUCKET).copy(privatePath,livePath,{destinationBucket:LIVE_MEDIA_BUCKET});
     if(copied.error)throw copied.error;
     const updated=await supabase.from("experience_revision_media").update({storage_path:livePath}).eq("id",item.id).eq("revision_id",revisionId).eq("storage_path",privatePath);
     if(updated.error){await supabase.storage.from(LIVE_MEDIA_BUCKET).remove([livePath]);throw updated.error;}
     promoted.push({id:item.id,privatePath,livePath});
    }
    const {data:applied,error:applyError}=await supabase.rpc("admin_apply_experience_revision",{p_revision_id:revisionId,p_review_notes:general||null});
    if(applyError){
     for(const item of [...promoted].reverse())await supabase.from("experience_revision_media").update({storage_path:item.privatePath}).eq("id",item.id).eq("revision_id",revisionId).eq("storage_path",item.livePath);
     if(promoted.length)await supabase.storage.from(LIVE_MEDIA_BUCKET).remove(promoted.map(item=>item.livePath));
     return back(rpcState(applyError));
    }
    revisionApplied=true;
    if(promoted.length){
     const cleanup=await supabase.storage.from(REVISION_MEDIA_BUCKET).remove(promoted.map(item=>item.privatePath));
     if(cleanup.error)console.error("BIMARIS revision private media cleanup failed",cleanup.error);
    }
    const result=Array.isArray(applied)?applied[0]:applied; const name=typeof result?.experience_name==="string"?result.experience_name:experience.name;
    await recordOperatorNotice({operatorId:revision.operator_id,category:"experience",eventKey:`experience-revision-applied:${revisionId}`,title:"Modifica esperienza approvata",description:`La revisione di “${name}” è stata approvata e applicata.`,targetPath:"/area-operatore?tab=esperienze"});
    if(operator.email)await sendReviewNotification({to:operator.email,experienceName:name,operatorName:operator.name||"operatore BIMARIS",decision:"approved",alreadyPublished:experience.published,reviewNotes:general||null});
    return outcome();
   }catch(error){
    if(revisionApplied){
     console.error("BIMARIS post-approval revision follow-up failed",error);
     return outcome();
    }
    for(const item of [...promoted].reverse())await supabase.from("experience_revision_media").update({storage_path:item.privatePath}).eq("id",item.id).eq("revision_id",revisionId).eq("storage_path",item.livePath);
    if(promoted.length)await supabase.storage.from(LIVE_MEDIA_BUCKET).remove(promoted.map(item=>item.livePath));
    throw error;
   }
  }
  return back("invalid-data");
 }catch(error){console.error("BIMARIS experience revision review failed",error);return back("action-error");}
}
