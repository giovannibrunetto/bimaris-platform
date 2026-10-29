import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

function text(form:FormData,key:string,max=2000){const v=form.get(key);return typeof v==="string"?v.trim().slice(0,max):""}
function back(request:NextRequest,id:string,state:string){return NextResponse.redirect(new URL(`/admin/operatori/${id}?state=${encodeURIComponent(state)}`,request.url),303)}

export async function POST(request:NextRequest){
 if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const form=await request.formData(); const id=text(form,"operator_id",80); const action=text(form,"action",40); if(!id)return back(request,id,"invalid");
 const db=createServiceClient(); if(!db)return back(request,id,"service-error");
 try{
  if(action==="save_profile"){
   const nextEmail=text(form,"email",200)||null;
   const payload={name:text(form,"name",200),category:text(form,"category",120)||null,address:text(form,"address",300)||null,phone:text(form,"phone",80)||null,whatsapp:text(form,"whatsapp",80)||null,email:nextEmail,website:text(form,"website",500)||null,instagram:text(form,"instagram",500)||null,premium:form.get("premium")==="on",updated_at:new Date().toISOString()};

   if(nextEmail){
    const {data:members,error:membersError}=await db.from("operator_memberships").select("user_id,role").eq("operator_id",id); if(membersError)throw membersError;
    if((members??[]).length>1)throw new Error("Operator has multiple linked accounts; auth reconciliation requires explicit account selection");
    const linkedUserId=members?.[0]?.user_id;
    if(linkedUserId){
     const {data:linkedAuth,error:getAuthError}=await db.auth.admin.getUserById(linkedUserId); if(getAuthError)throw getAuthError;
     if(linkedAuth.user?.email!==nextEmail){
      const {data:users,error:listError}=await db.auth.admin.listUsers({page:1,perPage:1000}); if(listError)throw listError;
      const existing=users.users.find((u)=>u.email?.toLowerCase()===nextEmail.toLowerCase());
      if(existing&&existing.id!==linkedUserId){
       const role=members?.[0]?.role||"owner";
       const {error:addError}=await db.from("operator_memberships").upsert({operator_id:id,user_id:existing.id,role},{onConflict:"operator_id,user_id"}); if(addError)throw addError;
       const {error:removeError}=await db.from("operator_memberships").delete().eq("operator_id",id).eq("user_id",linkedUserId); if(removeError)throw removeError;
       // The orphaned Auth user is intentionally retained here. Account deletion is a separate audited/destructive action.
      }else if(!existing){
       const {error:authError}=await db.auth.admin.updateUserById(linkedUserId,{email:nextEmail,email_confirm:true}); if(authError)throw authError;
      }
     }
    }
   }

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