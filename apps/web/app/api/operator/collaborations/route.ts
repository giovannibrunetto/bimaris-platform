import { NextRequest,NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";

function field(form:FormData,key:string,max=80){const value=form.get(key);return typeof value==="string"?value.trim().slice(0,max):"";}

export async function POST(request:NextRequest){
  const db=await createUserServerClient();
  if(!db)return NextResponse.redirect(new URL("/accedi",request.url),303);
  const {data:claims}=await db.auth.getClaims();
  const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;
  if(!userId)return NextResponse.redirect(new URL("/accedi",request.url),303);

  const form=await request.formData();
  const experienceId=field(form,"experience_id");
  const operatorId=field(form,"operator_id");
  const decision=field(form,"decision",16);
  if(!experienceId||!operatorId||!["accepted","rejected"].includes(decision)){
    return NextResponse.redirect(new URL("/area-operatore?collaboration=invalid",request.url),303);
  }

  const {data:membership}=await db.from("operator_memberships")
    .select("operator_id,role")
    .eq("operator_id",operatorId)
    .eq("user_id",userId)
    .maybeSingle();
  if(!membership||!["owner","manager"].includes(membership.role)){
    return NextResponse.redirect(new URL("/area-operatore?collaboration=forbidden",request.url),303);
  }

  const {error}=await db.rpc("respond_to_experience_collaboration",{
    p_experience_id:experienceId,
    p_operator_id:operatorId,
    p_decision:decision
  });
  return NextResponse.redirect(new URL(`/area-operatore?collaboration=${error?"error":decision}`,request.url),303);
}
