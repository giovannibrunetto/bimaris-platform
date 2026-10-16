import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import AdminBarChart from "@/components/AdminBarChart";

const interestLabels: Record<string,string>={"cultura":"Cultura","miti-leggende":"Miti e leggende","borghi":"Borghi","sapori":"Sapori","esperienze":"Esperienze","itinerari":"Itinerari","mappa":"Mappa"};
async function getSummary(){
 const supabase=createServiceClient(); if(!supabase)return null;
 const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
 const {data,error}=await supabase.from("analytics_events").select("event_name,path,anonymous_id,session_id,user_id,properties,created_at").gte("created_at",since).limit(5000); if(error||!data)return null;
 const users=new Set(data.map(e=>e.anonymous_id).filter(Boolean)).size; const sessions=new Set(data.map(e=>e.session_id).filter(Boolean)).size; const registered=new Set(data.map(e=>e.user_id).filter(Boolean)).size;
 const pageViews=data.filter(e=>e.event_name==="page_view").length; const contacts=data.filter(e=>["whatsapp_click","phone_click","website_click","directions_click","booking_click"].includes(e.event_name)).length;
 const events=Object.entries(data.reduce<Record<string,number>>((a,e)=>(a[e.event_name]=(a[e.event_name]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,10) as [string,number][];
 const pages=Object.entries(data.filter(e=>e.event_name==="page_view").reduce<Record<string,number>>((a,e)=>(a[e.path||"/"]=(a[e.path||"/"]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({label,value}));
 const interestCounts=data.reduce<Record<string,number>>((a,e)=>{const key=typeof e.properties?.interest_key==="string"?e.properties.interest_key:"";if(key)a[key]=(a[key]||0)+1;return a;},{});
 const interests=Object.entries(interestCounts).sort((a,b)=>b[1]-a[1]).map(([key,value])=>({label:interestLabels[key]??key,value}));
 const intentEvents=new Set(["directions_click","booking_click","whatsapp_click","phone_click","website_click","favorite_added","map_marker_click"]);
 const intentCounts=data.filter(e=>intentEvents.has(e.event_name)).reduce<Record<string,number>>((a,e)=>{const key=typeof e.properties?.interest_key==="string"?e.properties.interest_key:"";if(key)a[key]=(a[key]||0)+1;return a;},{});
 const intent=Object.entries(intentCounts).sort((a,b)=>b[1]-a[1]).map(([key,value])=>({label:interestLabels[key]??key,value}));
 const dailyMap=new Map<string,number>(); for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dailyMap.set(d.toISOString().slice(0,10),0)} data.filter(e=>e.event_name==="page_view").forEach(e=>{const key=String(e.created_at).slice(0,10);if(dailyMap.has(key))dailyMap.set(key,(dailyMap.get(key)||0)+1)});
 const daily=Array.from(dailyMap.entries()).map(([date,value])=>({label:new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"short"}).format(new Date(date)),value}));
 return {users,sessions,registered,pageViews,contacts,events,pages,interests,intent,daily};
}
export default async function AnalyticsPage(){
 if(!(await isAdminAuthenticated()))redirect("/admin/login"); const live=await getSummary();
 const summary=live??{users:0,sessions:0,registered:0,pageViews:0,contacts:0,events:[] as [string,number][],pages:[] as {label:string,value:number}[],interests:[] as {label:string,value:number}[],intent:[] as {label:string,value:number}[],daily:[] as {label:string,value:number}[]};
 return <><section className="page-hero"><div className="kicker">Area privata</div><h1>BIMARIS Analytics</h1><p>Dati reali degli ultimi 30 giorni, inclusi interessi aggregati degli utenti anonimi che hanno accettato gli analytics.</p></section><section className="section sand">
 <div className="dashboard"><div className="metric">Visitatori unici<strong>{summary.users}</strong></div><div className="metric">Sessioni<strong>{summary.sessions}</strong></div><div className="metric">Registrati rilevati<strong>{summary.registered}</strong></div><div className="metric">Contatti / intenti<strong>{summary.contacts}</strong></div></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:22,marginTop:30}}><AdminBarChart title="Cosa interessa ai visitatori" items={summary.interests}/><AdminBarChart title="Interessi ad alta intenzione" items={summary.intent}/></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:22,marginTop:22}}><AdminBarChart title="Visualizzazioni giornaliere" items={summary.daily}/><AdminBarChart title="Pagine più viste" items={summary.pages}/></div>
 <div style={{marginTop:22}}><AdminBarChart title="Interazioni principali" items={summary.events.map(([label,value])=>({label,value}))}/></div>
 <div style={{marginTop:36}}><h2 style={{fontFamily:"Georgia,serif",fontSize:36}}>Dettaglio eventi</h2><table className="table"><thead><tr><th>Evento</th><th>Occorrenze</th></tr></thead><tbody>{summary.events.map(([name,count])=><tr key={name}><td>{name}</td><td>{count}</td></tr>)}</tbody></table></div>
 </section></>;
}
