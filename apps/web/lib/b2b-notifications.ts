import {createServiceClient} from "@/lib/supabase/server";
import {scoreB2BMatch,type B2BProfile} from "@/lib/b2b";

type Operator={id:string;name:string;published:boolean;selection_status:string;territory_id:string|null};
type Profile=B2BProfile;
type Notification={id:string;operator_id:string;partner_operator_id:string;match_score:number;email_sent_at:string|null;email_claimed_at:string|null};

function escapeHtml(value:string){return value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]??ch));}
function eligible(op:Operator|undefined){return !!op&&op.published&&op.selection_status==="selected";}

/** Lightweight per-operator refresh on dashboard open; no email is sent here. */
export async function refreshB2BNotificationsFor(operatorId:string){
 const db=createServiceClient();
 if(!db)throw new Error("Supabase service unavailable");
 const [{data:mine,error:myError},{data:profiles,error:profileError},{data:operators,error:operatorError}]=await Promise.all([
   db.from("operator_b2b_profiles").select("*").eq("operator_id",operatorId).eq("enabled",true).maybeSingle(),
   db.from("operator_b2b_profiles").select("*").eq("enabled",true).neq("operator_id",operatorId),
   db.from("operators").select("id,name,published,selection_status,territory_id")
 ]);
 if(myError||profileError||operatorError)throw new Error("Unable to refresh B2B matches");
 const map=new Map(((operators??[]) as Operator[]).map(o=>[o.id,o]));
 const current=map.get(operatorId);
 if(!mine||!eligible(current))return 0;
 let created=0;
 for(const candidate of (profiles??[]) as Profile[]){
  const partner=map.get(candidate.operator_id);
  if(!eligible(partner))continue;
  const score=scoreB2BMatch(mine as Profile,candidate,!!current?.territory_id&&current.territory_id===partner!.territory_id);
  if(!score||score.score<55)continue;
  const {data,error}=await db.from("b2b_match_notifications").upsert({
    operator_id:operatorId,partner_operator_id:candidate.operator_id,match_score:score.score
  },{onConflict:"operator_id,partner_operator_id",ignoreDuplicates:true}).select("id");
  if(error)throw new Error(error.message);
  if(data?.length)created++;
 }
 return created;
}

/** Deterministic periodic reconciliation. Never sends emails from Preview or Staging. */
export async function reconcileB2BNotifications(){
 const db=createServiceClient();
 if(!db)throw new Error("Supabase service unavailable");
 const [{data:profiles,error:pe},{data:operators,error:oe}]=await Promise.all([
  db.from("operator_b2b_profiles").select("*").eq("enabled",true),
  db.from("operators").select("id,name,published,selection_status,territory_id")
 ]);
 if(pe||oe)throw new Error(pe?.message??oe?.message??"B2B read failed");
 const byId=new Map(((operators??[]) as Operator[]).map(o=>[o.id,o]));
 const active=(profiles??[] as Profile[]).filter(p=>eligible(byId.get(p.operator_id)));
 const activeIds=new Set(active.map(p=>p.operator_id));
 let created=0;
 for(const mine of active){
  const operator=byId.get(mine.operator_id)!;
  for(const other of active){
   if(other.operator_id===mine.operator_id)continue;
   const partner=byId.get(other.operator_id)!;
   const result=scoreB2BMatch(mine,other,!!operator.territory_id&&operator.territory_id===partner.territory_id);
   if(!result||result.score<55)continue;
   const {data,error}=await db.from("b2b_match_notifications")
     .upsert({operator_id:mine.operator_id,partner_operator_id:other.operator_id,match_score:result.score},
       {onConflict:"operator_id,partner_operator_id",ignoreDuplicates:true})
     .select("id");
   if(error)throw new Error(error.message);
   if(data?.length)created++;
  }
 }
 // Explicit opt-in and production-only sending. All Preview tests are always mail-silent.
 let emailed=0;
 const canEmail=process.env.VERCEL_ENV==="production"&&process.env.B2B_NOTIFICATIONS_SEND_EMAIL==="true"&&!!process.env.RESEND_API_KEY;
 if(canEmail){
  const {data:preferences,error:prefError}=await db.from("b2b_notification_preferences").select("operator_id").eq("email_enabled",true);
  if(prefError)throw new Error(prefError.message);
  const opted=new Set((preferences??[]).map(p=>p.operator_id));
  const {data:pending,error:pendingError}=await db.from("b2b_match_notifications").select("id,operator_id,partner_operator_id,match_score,email_sent_at,email_claimed_at").is("email_sent_at",null).order("first_detected_at",{ascending:true}).limit(100);
  if(pendingError)throw new Error(pendingError.message);
  for(const item of (pending??[]) as Notification[]){
   if(!opted.has(item.operator_id)||!activeIds.has(item.operator_id)||!eligible(byId.get(item.partner_operator_id)))continue;
   const {data:claimed,error:claimError}=await db.from("b2b_match_notifications").update({email_claimed_at:new Date().toISOString()})
      .eq("id",item.id).is("email_sent_at",null).or(`email_claimed_at.is.null,email_claimed_at.lt.${new Date(Date.now()-15*60*1000).toISOString()}`).select("id").maybeSingle();
   if(claimError)throw new Error(claimError.message);
   if(!claimed)continue;
   try{
    const {data:members}=await db.from("operator_memberships").select("user_id,role").eq("operator_id",item.operator_id).in("role",["owner","manager"]);
    const owner=members?.find(m=>m.role==="owner")??members?.[0];
    if(!owner)continue;
    const {data:user}=await db.auth.admin.getUserById(owner.user_id);
    const address=user.user?.email;
    if(!address)continue;
    const sender=process.env.BIMARIS_EMAIL_FROM??"BIMARIS <no-reply@auth.bimarisnet.it>";
    const partner=byId.get(item.partner_operator_id)!;
    const origin="https://www.bimarisnet.it";
    const url=origin+"/area-operatore/network-b2b";
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`bimaris-b2b-match-${item.id}`},
      body:JSON.stringify({from:sender,to:[address],subject:"BIMARIS · Nuova opportunità di collaborazione",html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1>Una nuova opportunità su BIMARIS</h1><p>${escapeHtml(partner.name)} potrebbe essere compatibile con la tua attività (compatibilità ${item.match_score}%).</p><p><a href="${url}">Consulta il Network B2B</a></p><p style="font-size:12px">Puoi disattivare questi avvisi dalla tua Area Operatore.</p></div>`})
    });
    if(!response.ok)throw new Error(`Resend response ${response.status}`);
    const {error:sentError}=await db.from("b2b_match_notifications").update({email_sent_at:new Date().toISOString()}).eq("id",item.id);
    if(sentError)throw new Error(sentError.message);
    emailed++;
   }catch(error){
    // Provider errors must not mark a notification as delivered.
    console.error("B2B notification email error",error instanceof Error?error.message:"unknown");
   }finally{
    // Remove claim if unsent; a future run may retry.
    const {error:releaseError}=await db.from("b2b_match_notifications").update({email_claimed_at:null}).eq("id",item.id).is("email_sent_at",null);
    if(releaseError)console.warn("B2B email claim cleanup failed",releaseError.message);
   }
  }
 }
 return {created,emailed,activeOperators:active.length};
}
