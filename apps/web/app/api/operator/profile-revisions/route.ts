import { rejectCrossSiteOperatorMutation } from "@/lib/operator-request-origin";
import { NextRequest,NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";
function value(form:FormData,key:string,max:number){const v=form.get(key);return typeof v==="string"?v.trim().slice(0,max):"";}
export async function POST(request:NextRequest){
 const originError = rejectCrossSiteOperatorMutation(request);
 if (originError) return originError;
 const db=await createUserServerClient();if(!db)return NextResponse.redirect(new URL("/accedi",request.url),303);
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)return NextResponse.redirect(new URL("/accedi",request.url),303);
 const form=await request.formData(),operatorId=value(form,"operator_id",80);if(!operatorId)return NextResponse.redirect(new URL("/area-operatore?profile=invalid",request.url),303);
 const {data:membership}=await db.from("operator_memberships").select("operator_id,role").eq("operator_id",operatorId).eq("user_id",userId).maybeSingle();if(!membership||!["owner","manager"].includes(membership.role))return NextResponse.redirect(new URL("/area-operatore?profile=forbidden",request.url),303);
 const service=createServiceClient();
 if(!service)return NextResponse.redirect(new URL("/area-operatore?profile=error",request.url),303);
 const {data:pendingRevisions,error:pendingError}=await service.from("operator_revisions").select("id").eq("operator_id",operatorId).eq("status","pending").limit(1);
 if(pendingError)return NextResponse.redirect(new URL("/area-operatore?profile=error",request.url),303);
 if((pendingRevisions??[]).length>0)return NextResponse.redirect(new URL("/area-operatore?profile=pending",request.url),303);
 const proposed_data={name:value(form,"name",200),category:value(form,"category",120)||null,address:value(form,"address",300)||null,phone:value(form,"phone",80)||null,whatsapp:value(form,"whatsapp",80)||null,email:value(form,"email",200)||null,website:value(form,"website",300)||null,instagram:value(form,"instagram",200)||null};
 const {data:currentOperator,error:operatorError}=await db.from("operators").select("name,category,address,phone,whatsapp,email,website,instagram").eq("id",operatorId).maybeSingle();
 if(operatorError||!currentOperator)return NextResponse.redirect(new URL("/area-operatore?profile=error",request.url),303);
 const keys=["name","category","address","phone","whatsapp","email","website","instagram"] as const;
 const unchanged=keys.every(key=>(proposed_data[key]??"").trim()===(currentOperator[key]??"").trim());
 if(unchanged)return NextResponse.redirect(new URL("/area-operatore?profile=unchanged",request.url),303);
 const {error}=await db.from("operator_revisions").insert({operator_id:operatorId,proposed_by:userId,status:"pending",proposed_data});
 return NextResponse.redirect(new URL(`/area-operatore?profile=${error?"error":"submitted"}`,request.url),303);
}
