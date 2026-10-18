import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import AdminBarChart from "@/components/AdminBarChart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnalyticsSummary = { page_views:number; visitors:number; sessions:number; application_starts:number; application_submits:number; daily:Array<{date:string;views:number}> };
const emptyAnalytics: AnalyticsSummary = {page_views:0,visitors:0,sessions:0,application_starts:0,application_submits:0,daily:[]};

export default async function AdminPage(){
 if (!(await isAdminAuthenticated())) redirect("/admin/login");
 const supabase=createServiceClient();
 if(!supabase) throw new Error("Supabase service client non configurato");
 const [{data:applications},{data:operators},{data:experiences},{data:revisions},{data:itineraries},{data:analyticsData}]=await Promise.all([
  supabase.from("operator_applications").select("status"),
  supabase.from("operators").select("published"),
  supabase.from("experiences").select("published"),
  supabase.from("experience_revisions").select("status").eq("status","pending"),
  supabase.from("itineraries").select("published"),
  supabase.rpc("admin_analytics_summary",{p_days:30}),
 ]);
 const analytics=(analyticsData??emptyAnalytics) as AnalyticsSummary;
 const appRows=applications??[]; const opRows=operators??[]; const expRows=experiences??[]; const revisionRows=revisions??[]; const itinRows=itineraries??[];
 const pending=appRows.filter((x:any)=>x.status==="new"||x.status==="reviewing").length;
 const conversion=analytics.application_starts>0?(analytics.application_submits/analytics.application_starts)*100:0;
 const daily=analytics.daily.map(item=>({label:new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"short"}).format(new Date(item.date)),value:Number(item.views)||0}));
 const sections=[
  {href:"/admin/operatori",title:"Operatori e candidature",value:`${pending} da valutare`,text:`${opRows.filter((x:any)=>x.published).length} operatori pubblicati su ${opRows.length}.`},
  {href:"/admin/esperienze",title:"Esperienze",value:`${expRows.filter((x:any)=>x.published).length} online`,text:`${expRows.length} esperienze presenti nel catalogo.`},
  {href:"/admin/revisioni-esperienze",title:"Modifiche alle esperienze",value:`${revisionRows.length} da revisionare`,text:"Proposte di modifica alle esperienze già pubblicate, senza interrompere la versione online."},
  {href:"/admin/itinerari",title:"Itinerari",value:`${itinRows.filter((x:any)=>x.published).length} online`,text:`${itinRows.length} percorsi presenti.`},
  {href:"/admin/analytics",title:"Analytics",value:`${analytics.page_views} visualizzazioni`,text:`${analytics.visitors} visitatori negli ultimi 30 giorni.`},
 ];
 return <>
  <section className="page-hero"><div className="kicker">Area privata</div><h1>Dashboard BIMARIS</h1><p>Una vista sintetica dello stato della piattaforma. La gestione dettagliata è organizzata nelle singole sezioni.</p><div className="actions"><Link className="button" href="/">Apri il sito</Link><form method="post" action="/api/admin/logout"><button className="button secondary" type="submit">Esci</button></form></div></section>
  <section className="section sand"><div className="section-head"><div><div className="kicker">Situazione generale</div><h2>Controllo rapido</h2></div><p>I dati operativi e i grafici di dettaglio restano nelle rispettive aree.</p></div>
   <div className="dashboard"><div className="metric"><span>Visite pagina · 30 gg</span><strong>{analytics.page_views}</strong></div><div className="metric"><span>Visitatori · 30 gg</span><strong>{analytics.visitors}</strong></div><div className="metric"><span>Candidature da valutare</span><strong>{pending}</strong></div><div className="metric"><span>Revisioni esperienze</span><strong>{revisionRows.length}</strong></div><div className="metric"><span>Conversione candidature</span><strong>{conversion.toFixed(1)}%</strong></div></div>
   <div style={{marginTop:28}}><AdminBarChart title="Andamento visite · ultimi 30 giorni" items={daily}/></div>
  </section>
  <section className="section"><div className="section-head"><div><div className="kicker">Gestione</div><h2>Sezioni amministrative</h2></div><p>Entra solo nell'area su cui devi lavorare.</p></div><div className="category-grid">{sections.map(item=><Link className="category" href={item.href} key={item.href} style={{display:"block"}}><strong style={{display:"block",fontSize:20,marginBottom:8}}>{item.title}</strong><span style={{display:"block",fontSize:15,marginBottom:7}}>{item.value}</span><small className="muted">{item.text}</small></Link>)}</div></section>
 </>;
}
