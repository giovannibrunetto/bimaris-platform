import {NextRequest,NextResponse} from "next/server";
import {getVerifiedSuperAdmin} from "@/lib/admin-mfa-guard";
import {rejectCrossSiteAdminMutation} from "@/lib/admin-request-origin";
import {createServiceClient} from "@/lib/supabase/server";
import {isReadyExperience,isReadyAppointment} from "@/app/admin/ready-to-publish";
import {loadReadyEditorial} from "@/app/admin/ready-editorial";
import {POST as experiencePost} from "../../experiences/route";
import {POST as appointmentPost} from "../../events/[id]/status/route";
import {POST as editorialPost} from "../../editoriale/route";
import {POST as historicalPost} from "../../editoriale/racconti/route";

const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const reply=(ok:boolean,reason?:string,status=ok?200:409)=>NextResponse.json({ok,reason},{status,headers:{"Cache-Control":"no-store"}});
const explanations:Record<string,string>={"missing-classification":"Classificazione territoriale mancante.","operator-not-published":"Operatore non selezionato o non pubblicato.","invalid-review-state":"Stato di approvazione cambiato.","invalid-data":"Dati non validi.","action-error":"Operazione non confermata.","stale":"Stato cambiato.","error":"Pubblicazione non confermata.","conflitto":"La versione della bozza è cambiata.","campi":"Campi obbligatori mancanti.","fonti":"Fonti non valide.","protetto":"Racconto protetto.","luogo":"Collegamento culturale non valido."};

export async function POST(request:NextRequest){
 const rejected=rejectCrossSiteAdminMutation(request);
 if(rejected)return rejected;
 if(!(await getVerifiedSuperAdmin()))return reply(false,"Accesso non autorizzato.",403);
 // Prelaunch preview only; no implicit activation in Production.
 if(process.env.VERCEL_ENV==="production")return reply(false,"Pubblicazione multipla non abilitata in Production.",403);
 const payload=await request.json().catch(()=>null);
 const category=payload?.category,id=payload?.id,version=payload?.version;
 if(!["experiences","appointments","editorial"].includes(category)||typeof id!=="string"||!uuid.test(id))return reply(false,"Richiesta non valida.",400);
 const db=createServiceClient();
 if(!db)return reply(false,"Database non disponibile.",503);
 // Invoke the original single-item handlers under the same verified request context.
 // Do not follow redirects or perform independent publication writes.
 function single(path:string,fields:Record<string,string>){
  const headers=new Headers();
  for(const key of ["origin","sec-fetch-site","cookie"]){const value=request.headers.get(key);if(value)headers.set(key,value);}
  return new NextRequest(new URL(path,request.url),{method:"POST",headers,body:new URLSearchParams(fields)});
 }
 try{
  let response:NextResponse;
  if(category==="experiences"){
   const [item,revisions]=await Promise.all([
    db.from("experiences").select("id,review_status,published,experience_origin,operator:operators!experiences_operator_id_fkey(published)").eq("id",id).maybeSingle(),
    db.from("experience_revisions").select("experience_id,experiences!inner(experience_origin)").eq("experience_id",id).eq("status","pending").neq("experiences.experience_origin","bimaris")
   ]);
   if(item.error||revisions.error)return reply(false,"Verifica dello stato non riuscita.",503);
   if(!item.data||!isReadyExperience(item.data,new Set((revisions.data??[]).map(row=>row.experience_id))))return reply(false,"Esperienza non più pronta.");
   response=await experiencePost(single("/api/admin/experiences",{action:"publish",experience_id:id}));
  }else if(category==="appointments"){
   const {data,error}=await db.from("events").select("published,verification_status").eq("id",id).maybeSingle();
   if(error)return reply(false,"Verifica dello stato non riuscita.",503);
   if(!data||!isReadyAppointment(data))return reply(false,"Appuntamento non più pronto.");
   response=await appointmentPost(single("/api/admin/events/"+id+"/status",{action:"publish"}),{params:Promise.resolve({id})});
  }else{
   if(!Number.isSafeInteger(version)||version<0)return reply(false,"Versione mancante o non valida.",400);
   const item=(await loadReadyEditorial(db)).find(row=>row.id===id&&row.version===version);
   if(!item)return reply(false,"Scheda non più pronta o versione cambiata.");
   const fields={action:"publish",workspace:id,version:String(version),sezione:item.model};
   response=item.model==="historical"?await historicalPost(single("/api/admin/editoriale/racconti",fields)):await editorialPost(single("/api/admin/editoriale",fields));
  }
  if(response.status===403)return reply(false,"Accesso non autorizzato.",403);
  const location=response.headers.get("location");
  if(response.status!==303||!location)return reply(false,"Pubblicazione non confermata.");
  const url=new URL(location,request.url);
  if(url.pathname==="/admin/login")return reply(false,"Sessione non valida.",403);
  const state=url.searchParams.get(category==="experiences"?"state":category==="appointments"?"status":"esito")??"";
  const success=category==="experiences"?"experience-published":category==="appointments"?"published":"publish";
  return state===success?reply(true):reply(false,explanations[state]||"Pubblicazione non confermata; verifica la scheda.");
 }catch(error){
  console.error("Bulk publication item failed",category,error instanceof Error?error.name:"unknown");
  return reply(false,"Pubblicazione non confermata; verifica lo stato prima di riprovare.",503);
 }
}
