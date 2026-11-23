import Link from "next/link";
import "./operator-detail.css";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic"; export const revalidate=0;
function fmt(v:string|null){return v?new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v)):"—"}
function val(v:unknown){return v===null||v===undefined||v===""?"—":String(v)}
const inputStyle={width:"100%",padding:"11px 13px",border:"1px solid #d8cbbd",borderRadius:10,background:"#fff"};
const panel={padding:24,margin:0,background:"#fff",border:"1px solid #d7c7b6",boxShadow:"0 6px 20px rgba(57,39,21,.06)"};
function analyticsWindowStart(){return new Date(Date.now()-30*24*60*60*1000).toISOString();}
export default async function Page({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{state?:string;tab?:string}>}){
 if(!(await isAuthorizedAdmin()))redirect("/admin/login"); const {id}=await params; const q=await searchParams; const tab=["profilo","esperienze","attivita"].includes(q.tab??"")?q.tab!:"profilo"; const db=createServiceClient(); if(!db)throw new Error("Supabase non configurato");
 const {data:o}=await db.from("operators").select("*,territory:territories(name)").or(`id.eq.${id},slug.eq.${id}`).maybeSingle(); if(!o)notFound();
 const since=analyticsWindowStart();
 const [{data:apps},{data:experiences},{data:members},{data:events},{data:revisions}]=await Promise.all([
  db.from("operator_applications").select("*").eq("operator_id",o.id).order("created_at",{ascending:false}),
  db.from("experiences").select("id,slug,name,published,review_status,featured,created_at").eq("operator_id",o.id).order("created_at",{ascending:false}),
  db.from("operator_memberships").select("user_id,role,created_at").eq("operator_id",o.id),
  db.from("analytics_events").select("event_name,properties,created_at").gte("created_at",since).order("created_at",{ascending:false}).limit(5000),
  db.from("experience_revisions").select("id,status,draft_step,submitted_at,reviewed_at,applied_at,created_at,experience:experiences(id,name)").eq("operator_id",o.id).order("created_at",{ascending:false})
 ]);
 const operatorEvents=(events??[]).filter((e:any)=>e.properties?.operator_id===o.slug); const action=(n:string)=>operatorEvents.filter((e:any)=>(e.properties?.action_type??e.event_name)===n||e.event_name===`${n}_click`).length;
 const fromExperience=operatorEvents.filter((e:any)=>e.properties?.source_type==="experience").length; const fromOperator=operatorEvents.filter((e:any)=>e.properties?.source_type==="operator").length;
 const notice=q.state==="saved"?"Modifiche salvate.":q.state==="published"?"Operatore pubblicato.":q.state==="unpublished"?"Operatore nascosto.":q.state==="error"?"Operazione non riuscita.":null;
 const tabs=[["profilo","Profilo"],["esperienze",`Esperienze (${(experiences??[]).length})`],["attivita","Statistiche"]];
 const applicationProposal=(apps??[]).find((a:any)=>a.description?.trim())?.description?.trim()??"";
 const reviewLabel=(status:string)=>status==="approved"?"Approvata":status==="pending"?"In revisione":status==="rejected"?"Da correggere":"Bozza";
 return <section className="admin-operator-detail" style={{background:"#f8f4ee",minHeight:"100vh",padding:"20px 6vw 70px"}}><div style={{maxWidth:1100,margin:"0 auto"}}>
 <header className="admin-operator-detail__header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,flexWrap:"wrap",padding:"18px 20px",background:"#fff",border:"1px solid #d7c7b6",borderRadius:14,boxShadow:"0 4px 14px rgba(57,39,21,.05)"}}><div><Link className="admin-operator-detail__back" href="/admin/operatori">← Torna agli operatori</Link><div style={{fontSize:10,fontWeight:800,letterSpacing:'.16em',textTransform:"uppercase",color:"#b77b2f",marginBottom:5}}>Dossier operatore · {o.operator_code??"Codice in assegnazione"}</div><div className="admin-operator-detail__identity"><h1 style={{margin:0,fontFamily:"Georgia,serif",fontWeight:500,fontSize:"clamp(28px,4vw,38px)",lineHeight:1,color:"#17110d"}}>{o.name}</h1><span className={`admin-operator-detail__status ${o.published?"is-online":"is-offline"}`} style={{padding:"4px 9px",borderRadius:999,background:o.published?"#e8f3e8":"#f1ece6",fontSize:11,fontWeight:700}}>{o.published?"Pubblicato":"Non pubblicato"}</span><span className="admin-operator-detail__plan" style={{padding:"4px 9px",borderRadius:999,background:o.premium?"#f4e3b8":"#f1ece6",fontSize:11,fontWeight:700}}>{o.premium?"Premium":"Standard"}</span></div><p className="admin-operator-detail__subtitle" style={{margin:"6px 0 0",fontSize:13,color:"#76695d"}}>{val(o.category)} · {val(o.territory?.name)}</p></div></header>
 {notice&&<div className="detail-panel" style={{padding:12,marginTop:12}}>{notice}</div>}
 <nav aria-label="Sezioni della scheda operatore" className="admin-operator-detail__tabs" style={{display:"flex",gap:4,flexWrap:"wrap",margin:"14px 0 24px",padding:4,background:"#e9dfd3",border:"1px solid #d1bfac",borderRadius:12,width:"100%"}}>{tabs.map(([key,label])=><Link key={key} aria-current={tab===key?"page":undefined} href={`/admin/operatori/${o.id}?tab=${key}`} style={{padding:"9px 15px",borderRadius:9,fontWeight:700,fontSize:13,background:tab===key?"#17110d":"transparent",color:tab===key?"#fff":"#3a3028"}}>{label}</Link>)}</nav>
 {tab==="profilo"&&<article className="detail-panel admin-operator-detail__profile" style={{...panel,maxWidth:1100}}>
  <div className="admin-operator-detail__profile-top"><div className="kicker">Informazioni dell’operatore</div>{o.published&&<Link className="admin-operator-detail__public-link" href={`/operatori/${o.slug}`} target="_blank" rel="noopener noreferrer">Visualizza scheda pubblica ↗</Link>}</div>
  <h2 style={{fontSize:28,margin:"7px 0 20px"}}>Dati e contatti</h2>
  <p className="admin-operator-detail__reference" style={{fontSize:13,color:"#76695d"}}><span>Codice <strong>{o.operator_code??"—"}</strong></span><span>Partita IVA <strong>{o.vat_number??"Non indicata"}</strong></span></p>
  <div className="admin-operator-detail__read-only" aria-label="Dati attuali dell’operatore">
    {([["Nome",o.name],["Categoria",o.category],["Indirizzo",o.address],["Telefono",o.phone],["WhatsApp",o.whatsapp],["Email",o.email],["Sito",o.website],["Instagram",o.instagram],["Piano",o.premium?"Premium":"Standard"]] as [string,unknown][]).map(([label,value])=><div className="admin-operator-detail__read-row" key={label}><span>{label}</span><strong>{val(value)}</strong></div>)}
  </div>
  <details className="admin-operator-detail__edit-disclosure">
    <summary>Modifica dati</summary>
    <form method="post" action="/api/admin/operators" className="admin-operator-detail__edit-form"><input type="hidden" name="operator_id" value={o.id}/>
      <p className="admin-operator-detail__edit-note">Le modifiche vengono applicate solo premendo «Salva modifiche».</p>
      <div className="admin-operator-detail__fields" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
        <label>Nome<input style={inputStyle} name="name" defaultValue={o.name} required/></label>
        <label>Categoria<input style={inputStyle} name="category" defaultValue={o.category??""}/></label>
        <label style={{gridColumn:"1/-1"}}>Indirizzo<input style={inputStyle} name="address" defaultValue={o.address??""}/></label>
        <label>Telefono<input style={inputStyle} name="phone" defaultValue={o.phone??""}/></label>
        <label>WhatsApp<input style={inputStyle} name="whatsapp" defaultValue={o.whatsapp??""}/></label>
        <label style={{gridColumn:"1/-1"}}>Email<input style={inputStyle} name="email" type="email" defaultValue={o.email??""}/></label>
        <label>Sito<input style={inputStyle} name="website" defaultValue={o.website??""}/></label>
        <label>Instagram<input style={inputStyle} name="instagram" defaultValue={o.instagram??""}/></label>
      </div>
      <label className="admin-operator-detail__premium-check"><input type="checkbox" name="premium" defaultChecked={o.premium}/> Operatore Premium</label>
      <div className="admin-operator-detail__edit-actions"><Link className="button ghost" href={`/admin/operatori/${o.id}?tab=profilo`}>Annulla</Link><button className="button" name="action" value="save_profile">Salva modifiche</button></div>
    </form>
  </details>
 </article>}
 {tab==="profilo"&&<div className="admin-operator-detail__manage-link"><div><strong>Gestione profilo</strong><p>Descrizione pubblica, pubblicazione, accessi e dati amministrativi.</p></div><Link className="button ghost" href={`/admin/operatori/${o.id}/gestione`}>Apri gestione profilo →</Link></div>}

 {tab==="esperienze"&&<div style={{display:"grid",gap:14}}><div><div className="kicker">Contenuti proposti</div><h2 style={{fontSize:30,margin:"5px 0 4px"}}>Esperienze</h2></div>{applicationProposal&&<article className="detail-panel" style={{...panel,padding:16,borderLeft:"3px solid #dca74e"}}><details><summary style={{cursor:"pointer",fontWeight:700}}>Proposta iniziale dalla candidatura</summary><div style={{marginTop:12}}><div className="kicker">Proposta dalla candidatura</div><h3 style={{fontSize:20,margin:"6px 0 5px"}}>{applicationProposal}</h3><p style={{margin:0,fontSize:13,opacity:.68}}>Idea presentata in fase di candidatura. Non è ancora un'esperienza BIMARIS completa.</p></div></details></article>}{(experiences??[]).map((e:any)=><article className="detail-panel" key={e.id} style={{...panel,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,flexWrap:"wrap"}}><div><h3 style={{margin:"0 0 5px",fontSize:19}}>{e.name}</h3><div style={{fontSize:13,opacity:.68}}>{e.published?"Online":"Non pubblicata"} · {reviewLabel(e.review_status)}{e.featured?" · In evidenza":""}</div></div><Link className="button ghost" href={`/admin/esperienze/${e.id}`}>Apri esperienza</Link></article>)}{(experiences??[]).length===0&&<div className="detail-panel" style={panel}><strong>Esperienze create: 0</strong><p style={{margin:"6px 0 0",opacity:.7}}>L'operatore non ha ancora creato una scheda esperienza completa.</p></div>}<article className="detail-panel" style={{...panel,padding:18}}><div className="kicker">Revisioni esperienze</div><h3 style={{margin:"6px 0 10px",fontSize:20}}>Cronologia revisioni</h3>{(revisions??[]).map((r:any)=><div key={r.id} style={{padding:"8px 0",borderBottom:"1px solid #eee3d8",fontSize:13}}><strong>{r.experience?.name??"Esperienza"}</strong> · {r.status} · creata {fmt(r.created_at)}{r.applied_at?` · applicata ${fmt(r.applied_at)}`:""}</div>)}{(revisions??[]).length===0&&<p style={{margin:0,fontSize:13,opacity:.68}}>Nessuna revisione successiva registrata.</p>}</article></div>}
 {tab==="attivita"&&<div><div className="kicker">Performance del profilo</div><h2 style={{fontSize:30,margin:"5px 0 4px"}}>Statistiche del profilo · ultimi 30 giorni</h2><p style={{marginTop:0,opacity:.7}}>Interazioni e contatti generati da BIMARIS verso il profilo di questo operatore e le sue esperienze.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginTop:18}}>{[["Totale contatti",operatorEvents.length],["WhatsApp",action("whatsapp")],["Prenotazioni",action("booking")],["Indicazioni",action("directions")],["Telefono",action("phone")],["Sito",action("website")],["Instagram",action("instagram")],["Altre azioni",Math.max(0,operatorEvents.length-action("whatsapp")-action("booking")-action("directions")-action("phone")-action("website")-action("instagram"))]].map(([l,n])=><div className="detail-panel" key={String(l)} style={{...panel,textAlign:"center",padding:18}}><strong style={{display:"block",fontSize:30,fontFamily:"Georgia,serif"}}>{n}</strong><span style={{fontSize:13}}>{l}</span></div>)}</div><article className="detail-panel" style={{...panel,marginTop:14,padding:18}}><strong>Origine azioni</strong><div style={{display:"flex",gap:30,marginTop:10,flexWrap:"wrap"}}><div>{fromOperator} · Scheda operatore</div><div>{fromExperience} · Esperienze</div></div></article></div>}


 </div></section>;
}
