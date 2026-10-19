import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

function text(form:FormData,key:string,max=2000){const v=form.get(key);return typeof v==="string"?v.trim().slice(0,max):""}
function back(request:NextRequest,operatorId:string,state:string){return NextResponse.redirect(new URL(`/admin/operatori/${operatorId}?tab=profilo&state=${encodeURIComponent(state)}`,request.url),303)}

export async function POST(request:NextRequest){
 if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(); const revisionId=text(form,"revision_id",80); const operatorId=text(form,"operator_id",80); const action=text(form,"action",40); const notes=text(form,"review_notes",2000);
 if(!revisionId||!operatorId)return back(request,operatorId,"invalid");
 const db=createServiceClient(); if(!db)return back(request,operatorId,"service-error");
 try{
  const {data:revision,error:readError}=await db.from("operator_revisions").select("id,operator_id,status").eq("id",revisionId).eq("operator_id",operatorId).maybeSingle();
  if(readError||!revision||revision.status!=="pending")return back(request,operatorId,"revision-invalid");
  if(action==="approve"){
   const {error}=await db.rpc("admin_apply_operator_revision",{p_revision_id:revisionId,p_review_notes:notes||null}); if(error)throw error;
   return back(request,operatorId,"profile-approved");
  }
  if(action==="reject"){
   if(!notes)return back(request,operatorId,"notes-required");
   const {error}=await db.from("operator_revisions").update({status:"rejected",review_notes:notes,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",revisionId).eq("status","pending"); if(error)throw error;
   return back(request,operatorId,"profile-rejected");
  }
  return back(request,operatorId,"invalid");
 }catch(error){console.error("BIMARIS operator revision review failed",error);return back(request,operatorId,"error")}
}
