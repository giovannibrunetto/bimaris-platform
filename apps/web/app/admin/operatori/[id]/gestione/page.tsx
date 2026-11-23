import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../operator-detail.css";

export const dynamic="force-dynamic";
export const revalidate=0;
function fmt(v:string|null){return v?new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v)):"—"}
function val(v:unknown){return v===null||v===undefined||v===""?"—":String(v)}
const inputStyle={width:"100%",padding:"11px 13px",border:"1px solid #d8cbbd",borderRadius:10,background:"#fff"};
const panel={padding:24,margin:0,background:"#fff",border:"1px solid #d7c7b6",boxShadow:"0 6px 20px rgba(57,39,21,.06)"};

export default async function Page({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{state?:string}>}){
  if(!(await isAuthorizedAdmin()))redirect("/admin/login");
  const {id}=await params;
  const q=await searchParams;
  const db=createServiceClient();
  if(!db)throw new Error("Supabase non configurato");
  const {data:o}=await db.from("operators").select("*").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
  if(!o)notFound();
  const [{data:apps},{data:members}]=await Promise.all([
    db.from("operator_applications").select("*").eq("operator_id",o.id).order("created_at",{ascending:false}),
    db.from("operator_memberships").select("user_id,role,created_at").eq("operator_id",o.id)
  ]);
  const notice=q.state==="saved"?"Modifiche salvate.":q.state==="published"?"Operatore pubblicato.":q.state==="unpublished"?"Operatore nascosto.":q.state==="error"?"Operazione non riuscita.":q.state==="publish-requires-selection"?"La pubblicazione richiede un operatore selezionato.":null;
  return <section className="admin-operator-detail" style={{background:"#f8f4ee",minHeight:"100vh",padding:"20px 6vw 70px"}}>
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <header className="admin-operator-detail__header" style={{padding:"20px",borderRadius:16}}>
        <Link className="admin-operator-detail__back" href={`/admin/operatori/${o.id}?tab=profilo`}>← Torna al profilo</Link>
        <div className="kicker" style={{color:"#edc88a"}}>Area amministrativa riservata</div>
        <h1 style={{margin:"6px 0 3px",fontSize:"clamp(25px,5vw,36px)"}}>Gestione profilo</h1>
        <p className="admin-operator-detail__subtitle" style={{margin:0}}>{o.name}</p>
      </header>
      {notice&&<div role="status" className="detail-panel" style={{padding:12,marginTop:12}}>{notice}</div>}
      <div className="admin-operator-detail__management-page">
        <h2 style={{fontSize:23,margin:"24px 0 10px"}}>Descrizione pubblica dell’operatore</h2>
        <form method="post" action="/api/admin/operators"><input type="hidden" name="operator_id" value={o.id}/><article className="detail-panel" style={{...panel,padding:18,marginTop:14}}><details><summary style={{cursor:"pointer",fontWeight:700,fontSize:17}}>Descrizione pubblica dell’operatore · Modifica</summary><div style={{marginTop:14}}><div className="kicker">Profilo pubblico</div><h3 style={{fontSize:22,margin:"6px 0 6px"}}>Descrizione BIMARIS dell'operatore</h3><p style={{margin:"0 0 14px",fontSize:13,opacity:.68}}>Testo editoriale destinato alla scheda pubblica dell'operatore.</p><label>Descrizione pubblica<textarea name="description" defaultValue={o.description??""} style={{...inputStyle,minHeight:110,resize:"vertical"}}/></label><div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><button className="button" name="action" value="save_editorial">Salva descrizione</button></div></div></details></article></form>
        <h2 style={{fontSize:23,margin:"24px 0 10px"}}>Gestione amministrativa</h2>
        <section className="admin-operator-detail__management" aria-label="Gestione operatore" style={{display:"grid",gap:12,marginTop:18}}>
 <article className="detail-panel" style={{...panel,padding:18}}>
  <div className="kicker">Gestione profilo</div>
  <details className="admin-operator-detail__visibility"><summary>Gestisci pubblicazione</summary><p>La scheda è attualmente <strong>{o.published?"pubblicata":"non pubblicata"}</strong>.</p><form method="post" action="/api/admin/operators"><input type="hidden" name="operator_id" value={o.id}/><button className="button ghost" name="action" value={o.published?"unpublish":"publish"}>{o.published?"Nascondi operatore":"Pubblica operatore"}</button></form></details>
  <details className="admin-operator-detail__metadata"><summary>Informazioni tecniche</summary><div className="admin-operator-detail__metadata-grid"><div><strong>Creato</strong><span>{fmt(o.created_at)}</span></div><div><strong>Aggiornato</strong><span>{fmt(o.updated_at)}</span></div><div><strong>Slug</strong><span>{o.slug}</span></div></div></details>
  <details className="admin-operator-detail__metadata"><summary>Account collegati ({(members??[]).length})</summary><div style={{marginTop:12}}>{(members??[]).length===0?<p>Nessun account collegato.</p>:(members??[]).map((m:any)=><div key={m.user_id} style={{padding:"8px 0",borderBottom:"1px solid #eee3d8",fontSize:13}}><strong>{m.role}</strong> · collegato {fmt(m.created_at)}<details style={{marginTop:5}}><summary style={{cursor:"pointer",opacity:.7}}>Dettagli tecnici</summary><code style={{fontSize:12,overflowWrap:"anywhere"}}>{m.user_id}</code></details></div>)}</div></details>
  <details className="admin-operator-detail__metadata"><summary>Note interne e selezione</summary><p style={{fontSize:13,opacity:.7}}>Informazione riservata agli amministratori, non pubblicata sul sito.</p><div style={{padding:"12px 14px",background:"#f8f4ee",border:"1px solid #e5d9cb",borderRadius:10,fontSize:14}}>{val(o.why_selected)}</div></details>
  <details className="admin-operator-detail__metadata"><summary>Candidature originali ({(apps??[]).length})</summary>{(apps??[]).map((a:any)=><div key={a.id} style={{padding:"8px 0",borderBottom:"1px solid #eee3d8"}}>{fmt(a.created_at)} · {val(a.status)} <Link className="text-link" href={`/admin/candidature/${a.id}`} style={{marginLeft:10}}>Visualizza candidatura →</Link></div>)}</details>
 </article></section>
      </div>
    </div>
  </section>;
}
