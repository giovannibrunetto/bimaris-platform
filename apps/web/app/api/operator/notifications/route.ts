import {NextRequest,NextResponse} from "next/server";
import {createUserServerClient} from "@/lib/supabase/user-server";
import {createServiceClient} from "@/lib/supabase/server";
import {refreshB2BNotificationsFor} from "@/lib/b2b-notifications";
export const dynamic="force-dynamic";
type Notice={id:string;kind:"operator"|"b2b";category:string;title:string;description:string;url:string;createdAt:string;read:boolean};
const error=(status:number,message:string)=>NextResponse.json({error:message},{status});
async function authorized(operatorId:string){
 const client=await createUserServerClient(),service=createServiceClient();
 if(!client||!service)return {failure:error(503,"Servizio non disponibile")};
 const {data:claims,error:authError}=await client.auth.getClaims();
 const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;
 if(authError||!userId)return {failure:error(401,"Accedi per consultare le notifiche")};
 const {data:membership,error:memberError}=await client.from("operator_memberships").select("operator_id").eq("operator_id",operatorId).eq("user_id",userId).maybeSingle();
 if(memberError||!membership)return {failure:error(403,"Attività non autorizzata")};
 return {service};
}
export async function GET(request:NextRequest){
 const operatorId=request.nextUrl.searchParams.get("operatorId");
 if(!operatorId)return error(400,"Attività mancante");
 const ctx=await authorized(operatorId);
 if("failure" in ctx)return ctx.failure;
 const db=ctx.service!;
 try{await refreshB2BNotificationsFor(operatorId)}catch(cause){console.error("OP-NOTIFY B2B refresh",cause);}
 const [{data:events,error:eventError},{data:b2b,error:b2bError}]=await Promise.all([
  db.from("operator_notifications").select("id,category,title,description,target_path,created_at,read_at").eq("operator_id",operatorId).order("created_at",{ascending:false}).limit(40),
  db.from("b2b_match_notifications").select("id,partner_operator_id,match_score,first_detected_at,read_at").eq("operator_id",operatorId).order("first_detected_at",{ascending:false}).limit(40)
 ]);
 if(eventError||b2bError){console.error("OP-NOTIFY read error",eventError?.message??b2bError?.message);return error(503,"Notifiche temporaneamente non disponibili");}
 const ids=[...new Set((b2b??[]).map(n=>n.partner_operator_id))];
 const {data:operators,error:operatorError}=ids.length?await db.from("operators").select("id,name,published,selection_status").in("id",ids):{data:[],error:null};
 if(operatorError)return error(503,"Impossibile leggere le notifiche");
 const partnerNames=new Map((operators??[]).filter(p=>p.published&&p.selection_status==="selected").map(p=>[p.id,p.name]));
 const base:Notice[]=(events??[]).map(n=>{const url=new URL(n.target_path,"https://bimaris.internal");url.searchParams.set("operatore",operatorId);return {id:n.id,kind:"operator",category:n.category,title:n.title,description:n.description,url:url.pathname+url.search,createdAt:n.created_at,read:!!n.read_at};});
 const matches:Notice[]=(b2b??[]).filter(n=>partnerNames.has(n.partner_operator_id)).map(n=>({id:n.id,kind:"b2b",category:"collaboration",title:"Nuova opportunità B2B",description:`${partnerNames.get(n.partner_operator_id)} · Compatibilità ${n.match_score}%`,url:`/area-operatore/network-b2b?operatore=${encodeURIComponent(operatorId)}`,createdAt:n.first_detected_at,read:!!n.read_at}));
 const notices=[...base,...matches].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,40);
 return NextResponse.json({notifications:notices,unread:notices.filter(n=>!n.read).length},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest){
 const body=await request.json().catch(()=>null);
 const operatorId=typeof body?.operatorId==="string"?body.operatorId:"";
 if(!operatorId)return error(400,"Attività mancante");
 const ctx=await authorized(operatorId);
 if("failure" in ctx)return ctx.failure;
 if(body?.action!=="read"||!["b2b","operator"].includes(body?.kind)||typeof body?.notificationId!=="string"||!(/^[\da-f-]{36}$/i.test(body.notificationId)))return error(400,"Richiesta non valida");
 const table=body.kind==="b2b"?"b2b_match_notifications":"operator_notifications";
 const {error:writeError}=await ctx.service!.from(table).update({read_at:new Date().toISOString()}).eq("operator_id",operatorId).eq("id",body.notificationId).is("read_at",null);
 if(writeError)return error(503,"Impossibile aggiornare la notifica");
 return NextResponse.json({ok:true});
}
