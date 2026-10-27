import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import CalendarImporter from "../CalendarImporter";

export const dynamic="force-dynamic";
export const revalidate=0;

type Operator={id:string;name:string};
type Membership={role:string;operator_id:string;operators:Operator|Operator[]|null};
function related(v:Operator|Operator[]|null){return Array.isArray(v)?v[0]??null:v;}

export default async function CalendarImportPage({searchParams}:{searchParams:Promise<{operatore?:string}>}){
 const db=await createUserServerClient();if(!db)redirect("/accedi");
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)redirect("/accedi");
 const {data}=await db.from("operator_memberships").select("role,operator_id,operators(id,name)").eq("user_id",userId);
 const rows=((data??[]) as Membership[]).map(r=>({role:r.role,operator_id:r.operator_id,operator:related(r.operators)})).filter(r=>r.operator&&["owner","manager"].includes(r.role)) as {role:string;operator_id:string;operator:Operator}[];
 const params=await searchParams;const requested=params.operatore;const active=rows.find(r=>r.operator_id===requested)??rows[0]??null;
 return <>
  <section className="page-hero" style={{paddingTop:"clamp(24px,4vw,42px)",paddingBottom:"clamp(24px,4vw,42px)"}}><div className="kicker">Area Operatore · Agenda</div><h1 style={{marginBottom:8}}>Importa il tuo calendario</h1><p style={{maxWidth:760}}>Porta in BIMARIS gli appuntamenti che già condividi su WhatsApp, senza riscriverli uno per uno.</p></section>
  <section className="section" style={{background:"var(--sand)",paddingTop:26}}><div className="container" style={{maxWidth:1120,display:"grid",gap:16}}>
   {rows.length===0?<div className="detail-panel"><h2>Nessuna attività gestibile</h2><p>Questo account non risulta collegato come responsabile di un operatore.</p></div>:<>
    <nav aria-label="Seleziona attività" style={{background:"#fff",border:"1px solid rgba(202,168,106,.28)",borderRadius:16,padding:"12px 16px",display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}><strong style={{marginRight:4}}>Stai importando per:</strong>{rows.map(r=><a key={r.operator_id} href={`/area-operatore/calendario?operatore=${encodeURIComponent(r.operator_id)}`} aria-current={active?.operator_id===r.operator_id?"page":undefined} style={{display:"inline-flex",alignItems:"center",padding:"7px 12px",borderRadius:999,textDecoration:"none",fontWeight:700,border:"1px solid rgba(202,168,106,.55)",background:active?.operator_id===r.operator_id?"#0c3448":"#fbfaf7",color:active?.operator_id===r.operator_id?"#fff":"#152b38"}}>{r.operator.name}</a>)}</nav>
    {active&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(280px,1fr)",gap:16,alignItems:"start"}}>
      <CalendarImporter operatorId={active.operator_id} operatorName={active.operator.name}/>
      <aside className="detail-panel" style={{margin:0,padding:"22px",position:"sticky",top:18}}>
       <div className="eyebrow">Come funziona</div>
       <h3 style={{margin:"7px 0 14px",fontSize:24}}>Prima bozza, poi verifica</h3>
       <div style={{display:"grid",gap:12}}>
        <div><strong>1 · Incolla</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Copia il calendario o il messaggio WhatsApp.</p></div>
        <div><strong>2 · BIMARIS interpreta</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Riconosce date, orari e appuntamenti.</p></div>
        <div><strong>3 · Salva come bozza</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>I duplicati già presenti vengono ignorati.</p></div>
        <div><strong>4 · BIMARIS verifica</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>L'amministrazione controlla i dati prima della visibilità pubblica.</p></div>
       </div>
       <div style={{marginTop:18,padding:"12px 14px",borderRadius:12,background:"#f7f1e7",fontWeight:700,lineHeight:1.4}}>Nessun appuntamento viene pubblicato automaticamente.</div>
      </aside>
    </div>}
   </>}
  </div></section>
 </>;
}
