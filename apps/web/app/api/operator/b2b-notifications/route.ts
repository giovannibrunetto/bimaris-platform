import {NextRequest,NextResponse} from "next/server";
import {createUserServerClient} from "@/lib/supabase/user-server";
import {createServiceClient} from "@/lib/supabase/server";
import {refreshB2BNotificationsFor} from "@/lib/b2b-notifications";
export const dynamic="force-dynamic";

async function context(operatorId:string){
 const user=await createUserServerClient();const service=createServiceClient();
 if(!user||!service)return {error:NextResponse.json({error:"Service unavailable"},{status:503})};
 const {data:claims}=await user.auth.getClaims();
 const uid=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;
 if(!uid)return {error:NextResponse.json({error:"Unauthenticated"},{status:401})};
 const {data:member}=await user.from("operator_memberships").select("role").eq("user_id",uid).eq("operator_id",operatorId).maybeSingle();
 if(!member)return {error:NextResponse.json({error:"Forbidden"},{status:403})};
 return {service,role:member.role};
}
export async function GET(req:NextRequest){
 const operatorId=req.nextUrl.searchParams.get("operatorId");
 if(!operatorId)return NextResponse.json({error:"Missing operatorId"},{status:400});
 const ctx=await context(operatorId);if("error" in ctx)return ctx.error;
 const db=ctx.service!;
 // On-demand refresh covers new partners even before the scheduled daily scan.
 try{await refreshB2BNotificationsFor(operatorId)}catch(err){
  console.error("B2B notification refresh failed",err instanceof Error?err.message:"unknown");
 }
 const [{data:notifications,error:e1},{data:pref,error:e2}]=await Promise.all([
  db.from("b2b_match_notifications").select("id,partner_operator_id,match_score,first_detected_at,read_at").eq("operator_id",operatorId).order("first_detected_at",{ascending:false}).limit(30),
  db.from("b2b_notification_preferences").select("email_enabled").eq("operator_id",operatorId).maybeSingle()
 ]);
 if(e1||e2)return NextResponse.json({error:"Notification storage not ready"},{status:503});
 const partnerIds=[...new Set((notifications??[]).map(n=>n.partner_operator_id))];
 const {data:partners}=partnerIds.length?await db.from("operators").select("id,name,slug,published,selection_status").in("id",partnerIds):{data:[] as {id:string;name:string;slug:string;published:boolean;selection_status:string}[]};
 const partnerMap=new Map((partners??[]).map(p=>[p.id,p]));
 const visible=(notifications??[]).flatMap(n=>{
  const p=partnerMap.get(n.partner_operator_id);
  if(!p||!p.published||p.selection_status!=="selected")return [];
  return [{id:n.id,name:p.name,slug:p.slug,score:n.match_score,createdAt:n.first_detected_at,read:!!n.read_at}];
 });
 return NextResponse.json({notifications:visible,unread:visible.filter(n=>!n.read).length,emailEnabled:pref?.email_enabled===true});
}
export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>null);
 const operatorId=typeof body?.operatorId==="string"?body.operatorId:"";
 if(!operatorId)return NextResponse.json({error:"Missing operatorId"},{status:400});
 const ctx=await context(operatorId);if("error" in ctx)return ctx.error;
 const db=ctx.service!;
 if(body?.action==="preference"){
  if(!["owner","manager"].includes(ctx.role??""))return NextResponse.json({error:"Forbidden"},{status:403});
  if(typeof body?.emailEnabled!=="boolean")return NextResponse.json({error:"Invalid email preference"},{status:400});
  const {error}=await db.from("b2b_notification_preferences").upsert({operator_id:operatorId,email_enabled:body.emailEnabled,updated_at:new Date().toISOString()},{onConflict:"operator_id"});
  if(error)return NextResponse.json({error:"Preference update failed"},{status:500});
  return NextResponse.json({ok:true,emailEnabled:body.emailEnabled});
 }
 if(body?.action==="read"){
  const id=typeof body?.notificationId==="string"?body.notificationId:"";
  if(!id)return NextResponse.json({error:"Missing notification"},{status:400});
  const {error}=await db.from("b2b_match_notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("operator_id",operatorId).is("read_at",null);
  if(error)return NextResponse.json({error:"Could not mark read"},{status:500});
  return NextResponse.json({ok:true});
 }
 return NextResponse.json({error:"Unsupported action"},{status:400});
}
