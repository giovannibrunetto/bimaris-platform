import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operator = { id:string; slug:string; name:string; category:string|null; published:boolean; selection_status:string };
type Membership = { role:string; operator_id:string; operators:Operator|Operator[]|null };
type Metric = { total:number; whatsapp:number; phone:number; directions:number; website:number; instagram:number; booking:number };
function textProperty(properties:Record<string,unknown>|null,key:string){const value=properties?.[key];return typeof value==="string"?value:null;}
function relatedOperator(value:Operator|Operator[]|null){return Array.isArray(value)?value[0]??null:value;}

export default async function OperatorAreaPage(){
 const userClient=await createUserServerClient(); if(!userClient) redirect("/accedi");
 const {data:claimsData}=await userClient.auth.getClaims(); const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
 if(!userId) redirect("/accedi");
 const {data:membershipsData}=await userClient.from("operator_memberships").select("role,operator_id,operators(id,slug,name,category,published,selection_status)").eq("user_id",userId);
 const memberships=(membershipsData??[]) as Membership[];
 const rows=memberships.map(row=>({role:row.role,operator_id:row.operator_id,operator:relatedOperator(row.operators)})).filter(row=>row.operator!==null) as {role:string;operator_id:string;operator:Operator}[];
 const slugs=rows.map(row=>row.operator.slug); const service=createServiceClient(); const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
 const {data:events}=service&&slugs.length?await service.from("analytics_events").select("event_name,properties").gte("created_at",since).in("event_name",["whatsapp_click","phone_click","directions_click","website_click","instagram_click","booking_click"]).limit(5000):{data:[]};
 const metrics=new Map<string,Metric>(slugs.map(slug=>[slug,{total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0}]));
 for(const event of events??[]){const properties=event.properties as Record<string,unknown>|null;const slug=textProperty(properties,"operator_id");const metric=slug?metrics.get(slug):undefined;if(!metric)continue;const action=textProperty(properties,"action_type")??({whatsapp_click:"whatsapp",phone_click:"phone",directions_click:"directions",website_click:"website",instagram_click:"instagram",booking_click:"booking"} as Record<string,string>)[event.event_name];if(action&&action in metric)(metric as unknown as Record<string,number>)[action]++;metric.total++;}
 return <><section className="page-hero"><div className="kicker">Area riservata operatori</div><h1>La tua attività su BIMARIS</h1><p>Consulta la presenza della tua attività e le azioni generate dalla piattaforma negli ultimi 30 giorni.</p></section><section className="section">{rows.length===0?<div className="detail-panel"><h2>Nessuna attività collegata</h2><p>Il tuo account è attivo, ma non è ancora associato a un operatore BIMARIS. L'associazione viene effettuata da BIMARIS dopo la verifica dell'attività.</p></div>:<div style={{display:"grid",gap:24}}>{rows.map(({role,operator_id,operator})=>{const metric=metrics.get(operator.slug)??{total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0};return <article className="detail-panel" key={operator_id}><div className="eyebrow">{operator.category??"Operatore"} · {role}</div><h2>{operator.name}</h2><p>Stato: <strong>{operator.published?"Online":"Non pubblicato"}</strong></p><div className="dashboard" style={{marginTop:22}}><div className="metric">Azioni<strong>{metric.total}</strong></div><div className="metric">WhatsApp<strong>{metric.whatsapp}</strong></div><div className="metric">Prenotazioni<strong>{metric.booking}</strong></div><div className="metric">Indicazioni<strong>{metric.directions}</strong></div></div><div style={{overflowX:"auto",marginTop:22}}><table className="table"><thead><tr><th>Telefono</th><th>Sito</th><th>Instagram</th></tr></thead><tbody><tr><td>{metric.phone}</td><td>{metric.website}</td><td>{metric.instagram}</td></tr></tbody></table></div>{operator.published&&<p style={{marginTop:20}}><a className="text-link" href={`/operatori/${operator.slug}`}>Apri la scheda pubblica →</a></p>}</article>})}</div>}</section></>;
}
