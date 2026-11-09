import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import CalendarImporter from "../CalendarImporter";

export const dynamic="force-dynamic";
export const revalidate=0;

type Operator={id:string;name:string;slug:string};
type Membership={role:string;operator_id:string;operators:Operator|Operator[]|null};
function related(v:Operator|Operator[]|null){return Array.isArray(v)?v[0]??null:v;}

export default async function CalendarImportPage({searchParams}:{searchParams:Promise<{operatore?:string}>}){
 const db=await createUserServerClient();if(!db)redirect("/accedi");
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)redirect("/accedi");
 const {data}=await db.from("operator_memberships").select("role,operator_id,operators(id,name,slug)").eq("user_id",userId);
 const rows=((data??[]) as Membership[]).map(r=>({role:r.role,operator_id:r.operator_id,operator:related(r.operators)})).filter(r=>r.operator&&["owner","manager"].includes(r.role)) as {role:string;operator_id:string;operator:Operator}[];
 const params=await searchParams;const requested=params.operatore;const active=rows.find(r=>r.operator_id===requested||r.operator.slug===requested)??rows[0]??null;
 return <>
  <section className="page-hero operator-calendar-hero" style={{paddingTop:"clamp(18px,2.5vw,28px)",paddingBottom:"clamp(18px,2.5vw,28px)"}}>
   <div className="operator-workspace-hero__inner"><div className="kicker">Area Operatore · Agenda</div>
   <h1 style={{margin:"6px 0 6px",color:"#fff",fontSize:"clamp(34px,4vw,52px)"}}>Importa il tuo <span>calendario</span></h1>
   <p style={{maxWidth:760,margin:0,color:"rgba(255,255,255,.88)"}}>Porta in BIMARIS gli appuntamenti che già condividi su WhatsApp, senza riscriverli uno per uno.</p></div>
  </section>
  <section className="section operator-calendar-workspace" style={{background:"var(--sand)",paddingTop:26}}><div className="container operator-workspace-content" style={{maxWidth:1180,display:"grid",gap:16}}>
   {rows.length===0?<div className="detail-panel"><h2>Nessuna attività gestibile</h2><p>Questo account non risulta collegato come responsabile di un operatore.</p></div>:<>
    <nav className="operator-activity-selector" aria-label="Seleziona attività"><strong style={{marginRight:4}}>Stai importando per:</strong>{rows.map(r=><a key={r.operator_id} href={`/area-operatore/calendario?operatore=${encodeURIComponent(r.operator_id)}`} aria-current={active?.operator_id===r.operator_id?"page":undefined} className="operator-activity-choice">{r.operator.name}</a>)}</nav>
    <nav className="operator-section-nav" aria-label="Navigazione area operatore"><div className="operator-section-nav__inner"><a className="operator-section-nav__link" href={`/area-operatore?operatore=${encodeURIComponent(active?.operator.slug??"")}`}>Area operatore</a><a className="operator-section-nav__link" aria-current="page" href={`/area-operatore/calendario?operatore=${encodeURIComponent(active?.operator.slug??"")}`}>Importa calendario</a><a className="operator-section-nav__link" href={`/area-operatore/network-b2b?operatore=${encodeURIComponent(active?.operator.slug??"")}`}>Network B2B</a></div></nav>
    {active&&<div className="operator-calendar-grid">
      <CalendarImporter operatorId={active.operator_id} operatorName={active.operator.name}/>
      <aside className="operator-calendar-aside" style={{margin:0,padding:"22px",position:"sticky",top:18,border:"1px solid rgba(202,168,106,.28)",borderRadius:22,background:"#fff",boxShadow:"0 14px 36px rgba(7,24,35,.05)"}}>
       <div className="eyebrow">Come funziona</div>
       <h3 style={{margin:"7px 0 14px",fontSize:24}}>Prima bozza, poi verifica</h3>
       <div style={{display:"grid",gap:12}}>
        <div><strong>1 · Incolla</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Copia il calendario o il messaggio WhatsApp.</p></div>
        <div><strong>2 · BIMARIS interpreta</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Riconosce date, orari e appuntamenti.</p></div>
        <div><strong>3 · Salva come bozza</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>I duplicati già presenti vengono ignorati.</p></div>
        <div><strong>4 · BIMARIS verifica</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>L'amministrazione controlla i dati prima della visibilità pubblica.</p></div>
       </div>
       <div style={{marginTop:18,padding:"12px 14px",borderRadius:12,background:"#E7E0D3",fontWeight:700,lineHeight:1.4}}>Nessun appuntamento viene pubblicato automaticamente.</div>
      </aside>
    </div>}
   </>}
  </div></section>
 </>;
}
