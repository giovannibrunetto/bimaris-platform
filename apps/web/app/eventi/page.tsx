import { createServiceClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const revalidate=0;

type EventRow={id:string;title:string;description:string|null;starts_at:string;ends_at:string|null;location:string|null;source_label:string|null;source_url:string|null;operators:{name:string;slug:string}|{name:string;slug:string}[]|null};
function operator(v:EventRow["operators"]){return Array.isArray(v)?v[0]??null:v;}

export default async function EventsPage(){
  const db=createServiceClient();
  const now=new Date().toISOString();
  const {data}=db?await db.from("events").select("id,title,description,starts_at,ends_at,location,source_label,source_url,operators(name,slug)").eq("published",true).eq("verification_status","verified").gte("starts_at",now).order("starts_at",{ascending:true}).limit(60):{data:[]};
  const rows=(data??[]) as EventRow[];
  return <>
    <section className="page-hero"><div className="kicker">Agenda</div><h1>Eventi</h1><p>Appuntamenti verificati del territorio messinese, integrati nel patrimonio informativo di BIMARIS.</p></section>
    <section className="section" style={{background:"var(--sand)"}}><div className="container" style={{maxWidth:1050}}>
      {rows.length===0?<div className="detail-panel"><div className="eyebrow">Agenda BIMARIS</div><h3>Nessun appuntamento pubblicato al momento</h3><p>Gli eventi entrano in questa agenda solo dopo la verifica delle informazioni.</p></div>:<div style={{display:"grid",gap:14}}>{rows.map(row=>{const op=operator(row.operators);return <article key={row.id} style={{background:"#fff",borderRadius:18,padding:"20px clamp(18px,4vw,28px)",border:"1px solid rgba(11,38,56,.10)",boxShadow:"0 10px 28px rgba(7,24,35,.04)"}}><div className="eyebrow">{op?.name??row.source_label??"Evento"}</div><h2 style={{fontFamily:"Georgia,serif",fontWeight:500,fontSize:"clamp(25px,4vw,34px)",margin:"6px 0 8px"}}>{row.title}</h2><p style={{fontWeight:800,margin:"0 0 8px"}}>{new Intl.DateTimeFormat("it-IT",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(row.starts_at))}</p>{row.location&&<p style={{margin:"0 0 8px"}}>📍 {row.location}</p>}{row.description&&<p style={{whiteSpace:"pre-line",color:"var(--muted)",lineHeight:1.55,margin:"10px 0 0"}}>{row.description}</p>}{row.source_url&&<p style={{marginTop:14}}><a className="text-link" href={row.source_url} target="_blank" rel="noreferrer">Fonte ufficiale →</a></p>}</article>})}</div>}
    </div></section>
  </>;
}
