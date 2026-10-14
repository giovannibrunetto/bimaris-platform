import { createServiceClient } from "@/lib/supabase/server";

async function getSummary(){
 const supabase=createServiceClient();
 if(!supabase) return null;
 const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
 const {data,error}=await supabase.from("analytics_events").select("event_name,path,anonymous_id,session_id,properties,created_at").gte("created_at",since).limit(5000);
 if(error||!data) return null;
 const users=new Set(data.map(e=>e.anonymous_id).filter(Boolean)).size;
 const sessions=new Set(data.map(e=>e.session_id).filter(Boolean)).size;
 const pageViews=data.filter(e=>e.event_name==="page_view").length;
 const contacts=data.filter(e=>["whatsapp_click","phone_click","website_click","directions_click"].includes(e.event_name)).length;
 const events=Object.entries(data.reduce<Record<string,number>>((a,e)=>(a[e.event_name]=(a[e.event_name]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,10);
 return {users,sessions,pageViews,contacts,events};
}

export default async function AnalyticsPage(){
 const live=await getSummary();
 const summary=live ?? {users:1284,sessions:1741,pageViews:4932,contacts:186,events:[["page_view",4932],["experience_view",2180],["map_open",710],["whatsapp_click",92],["directions_click",61]] as [string,number][]};
 return <><section className="page-hero"><div className="kicker">Admin</div><h1>BIMARIS Analytics</h1><p>{live?"Dati reali degli ultimi 30 giorni.":"Modalità demo: collega Supabase per visualizzare i dati reali."}</p></section><section className="section sand">
 <div className="dashboard"><div className="metric">Utenti unici<strong>{summary.users}</strong></div><div className="metric">Sessioni<strong>{summary.sessions}</strong></div><div className="metric">Page view<strong>{summary.pageViews}</strong></div><div className="metric">Contatti generati<strong>{summary.contacts}</strong></div></div>
 <div style={{marginTop:36}}><h2 style={{fontFamily:"Georgia,serif",fontSize:36}}>Eventi principali</h2><table className="table"><thead><tr><th>Evento</th><th>Occorrenze</th></tr></thead><tbody>{summary.events.map(([name,count])=><tr key={name}><td>{name}</td><td>{count}</td></tr>)}</tbody></table></div>
 </section></>;
}
