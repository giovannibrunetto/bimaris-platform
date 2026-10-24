import {NextRequest,NextResponse} from "next/server";
import {createUserServerClient} from "@/lib/supabase/user-server";

export async function POST(request:NextRequest){
 const db=await createUserServerClient();if(!db)return NextResponse.json({error:"Accesso richiesto."},{status:401});
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)return NextResponse.json({error:"Accesso richiesto."},{status:401});
 const body=await request.json().catch(()=>null) as {experience_id?:string;operator_id?:string;partner_operator_id?:string;activity_label?:string}|null;
 const experienceId=body?.experience_id?.trim()??"",operatorId=body?.operator_id?.trim()??"",partnerId=body?.partner_operator_id?.trim()??"",activity=(body?.activity_label?.trim()??"").slice(0,160);
 if(!experienceId||!operatorId||!partnerId||!activity||operatorId===partnerId)return NextResponse.json({error:"Dati collaborazione non validi."},{status:400});
 const {data:membership}=await db.from("operator_memberships").select("role").eq("operator_id",operatorId).eq("user_id",userId).maybeSingle();
 if(!membership||!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Non autorizzato."},{status:403});
 const {data:experience}=await db.from("experiences").select("id,operator_id,published,review_status").eq("id",experienceId).eq("operator_id",operatorId).maybeSingle();
 if(!experience||experience.published||!["draft","rejected"].includes(experience.review_status))return NextResponse.json({error:"L'esperienza non può essere modificata in questo stato."},{status:409});
 const {data:partner}=await db.from("operators").select("id").eq("id",partnerId).maybeSingle();if(!partner)return NextResponse.json({error:"Operatore partner non trovato."},{status:404});
 const {error}=await db.from("experience_operators").upsert({experience_id:experienceId,operator_id:partnerId,role:"participant",activity_label:activity,approval_status:"pending",approved_at:null,invited_by_operator_id:operatorId,updated_at:new Date().toISOString()},{onConflict:"experience_id,operator_id"});
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({ok:true});
}
