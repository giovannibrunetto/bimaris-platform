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
  <section className="page-hero"><div className="kicker">Area Operatore · Agenda</div><h1>Importa il tuo calendario</h1><p>Trasforma in bozze BIMARIS i calendari che già condividi su WhatsApp, senza riscrivere ogni appuntamento.</p></section>
  <section className="section" style={{background:"var(--sand)"}}><div className="container" style={{maxWidth:960,display:"grid",gap:18}}>
   {rows.length===0?<div className="detail-panel"><h2>Nessuna attività gestibile</h2><p>Questo account non risulta collegato come responsabile di un operatore.</p></div>:<>
    {rows.length>1&&<nav aria-label="Seleziona attività" style={{background:"#fff",border:"1px solid rgba(202,168,106,.28)",borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><strong style={{marginRight:4}}>Attività</strong>{rows.map(r=><a key={r.operator_id} href={`/area-operatore/calendario?operatore=${encodeURIComponent(r.operator_id)}`} aria-current={active?.operator_id===r.operator_id?"page":undefined} style={{display:"inline-flex",alignItems:"center",padding:"8px 13px",borderRadius:999,textDecoration:"none",fontWeight:700,border:"1px solid rgba(202,168,106,.55)",background:active?.operator_id===r.operator_id?"#0c3448":"#fbfaf7",color:active?.operator_id===r.operator_id?"#fff":"#152b38"}}>{r.operator.name}</a>)}</nav>}
    {active&&<CalendarImporter operatorId={active.operator_id} operatorName={active.operator.name}/>} 
   </>}
   <div className="detail-panel"><div className="eyebrow">Come funziona</div><h3>Prima bozza, poi verifica</h3><p>BIMARIS estrae gli appuntamenti dal testo e li salva come bozze. L'amministrazione può controllare titolo, data, orario e contenuto prima di renderli visibili agli utenti. Il testo originale resta collegato all'importazione per consentire il controllo della fonte.</p></div>
  </div></section>
 </>;
}
