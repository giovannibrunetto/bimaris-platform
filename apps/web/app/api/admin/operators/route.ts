import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

function text(form:FormData,key:string,max=2000){const v=form.get(key);return typeof v==="string"?v.trim().slice(0,max):""}
function back(request:NextRequest,id:string,state:string){return NextResponse.redirect(new URL(`/admin/operatori/${id}?state=${encodeURIComponent(state)}`,request.url),303)}

export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return NextResponse.json({ok:false,error:"invalid_site"},{status:403});
  if(origin){
    try{if(new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({ok:false,error:"invalid_origin"},{status:403});}
    catch{return NextResponse.json({ok:false,error:"invalid_origin"},{status:403});}
  }
  if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(); const id=text(form,"operator_id",80); const action=text(form,"action",40); if(!id)return back(request,id,"invalid");
 const db=createServiceClient(); if(!db)return back(request,id,"service-error");
 try{
  if(action==="save_profile"){
   const nextEmail=text(form,"email",200)||null;
   const payload={name:text(form,"name",200),category:text(form,"category",120)||null,address:text(form,"address",300)||null,phone:text(form,"phone",80)||null,whatsapp:text(form,"whatsapp",80)||null,email:nextEmail,website:text(form,"website",500)||null,instagram:text(form,"instagram",500)||null,premium:form.get("premium")==="on",updated_at:new Date().toISOString()};

   // The operator contact email is editorial/public data only.
   // Supabase Auth identities and operator memberships are managed separately.

   const {error}=await db.from("operators").update(payload).eq("id",id); if(error)throw error; return back(request,id,"saved");
  }
  if(action==="save_editorial"){
   const payload={description:text(form,"description",5000)||null,updated_at:new Date().toISOString()};
   const {error}=await db.from("operators").update(payload).eq("id",id); if(error)throw error; return back(request,id,"saved");
  }
  if(action==="publish"){
   const {data:operator,error:readError}=await db.from("operators").select("selection_status").eq("id",id).maybeSingle();
   if(readError)throw readError;
   if(!operator||operator.selection_status!=="selected")return back(request,id,"publish-requires-selection");
   const {error}=await db.from("operators").update({published:true,updated_at:new Date().toISOString()}).eq("id",id).eq("selection_status","selected"); if(error)throw error; return back(request,id,"published");
  }
  if(action==="unpublish"){
   const {error}=await db.from("operators").update({published:false,updated_at:new Date().toISOString()}).eq("id",id); if(error)throw error; return back(request,id,"unpublished");
  }
  return back(request,id,"invalid");
 }catch(error){console.error("BIMARIS admin operator update failed",error);return back(request,id,"error")}
}