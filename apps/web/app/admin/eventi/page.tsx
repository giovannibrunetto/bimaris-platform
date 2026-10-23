import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const revalidate=0;

type Row={id:string;title:string;description:string|null;starts_at:string;source_label:string|null;operators:{name:string}|{name:string}[]|null};
function operatorName(v:Row["operators"]){return Array.isArray(v)?v[0]?.name??"Operatore":v?.name??"Operatore";}

export default async function AdminEventsPage(){
 if(!(await isAdminAuthenticated()))redirect("/admin/login");
 const db=createServiceClient();if(!db)throw new Error("Supabase non configurato");
 const {data}=await db.from("events").select("id,title,description,starts_at,source_label,operators(name)").eq("verification_status","pending").order("starts_at",{ascending:true});
 const rows=(data??[]) as Row[];
 return <>
  <section className="page-hero"><div className="kicker">Admin · Agenda</div><h1>Eventi da verificare</h1><p>Appuntamenti importati dagli operatori. Nulla viene pubblicato finché non viene approvato.</p></section>
  <section className="section" style={{background:"var(--sand)"}}><div className="container" style={{maxWidth:1050}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:18,flexWrap:"wrap"}}><strong>{rows.length} in attesa</strong><Link className="text-link" href="/admin">← Dashboard</Link></div>
   {rows.length===0?<div className="detail-panel"><h2>Nessun evento da controllare</h2><p>La coda di verifica è vuota.</p></div>:<div style={{display:"grid",gap:14}}>{rows.map(row=><article key={row.id} style={{background:"#fff",border:"1px solid rgba(11,38,56,.10)",borderRadius:18,padding:20,boxShadow:"0 10px 28px rgba(7,24,35,.04)"}}>
    <div className="eyebrow">{operatorName(row.operators)}</div><h2 style={{fontFamily:"Georgia,serif",fontWeight:500,margin:"6px 0"}}>{row.title}</h2><p style={{margin:"0 0 8px",fontWeight:800}}>{new Intl.DateTimeFormat("it-IT",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(row.starts_at))}</p>{row.description&&<pre style={{whiteSpace:"pre-wrap",font:"inherit",lineHeight:1.5,color:"#59636b",background:"#fbfaf7",padding:14,borderRadius:12}}>{row.description}</pre>}<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}><form method="post" action={`/api/admin/events/${row.id}/status`}><input type="hidden" name="action" value="approve"/><button className="button" type="submit" style={{border:0,cursor:"pointer"}}>Approva e pubblica</button></form><form method="post" action={`/api/admin/events/${row.id}/status`}><input type="hidden" name="action" value="reject"/><button type="submit" style={{padding:"11px 16px",borderRadius:999,border:"1px solid rgba(143,47,36,.35)",background:"#fff7f4",color:"#8f2f24",fontWeight:800,cursor:"pointer"}}>Scarta</button></form></div>
   </article>)}</div>}
  </div></section>
 </>;
}
