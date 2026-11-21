import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import CalendarImporter from "../CalendarImporter";
import OperatorWorkspaceSwitcher from "../OperatorWorkspaceSwitcher";
import "../operator-subpages.css";

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
 const params=await searchParams;const requested=params.operatore;const active=requested?rows.find(r=>r.operator_id===requested||r.operator.slug===requested)??null:rows[0]??null;
 return <main className="operator-subpage"><div className="operator-subpage__shell">
  <header className="operator-subpage__heading"><div className="eyebrow">Area Operatore · Calendario</div><h1>Importa calendario</h1><p>Incolla gli appuntamenti da WhatsApp: BIMARIS li salva come bozze da verificare.</p></header>
   {rows.length===0?<div className="detail-panel"><h2>Nessuna attività gestibile</h2><p>Questo account non risulta collegato come responsabile di un operatore.</p></div>:<>
    {active&&<OperatorWorkspaceSwitcher activities={rows.map(r=>({id:r.operator_id,slug:r.operator.slug,name:r.operator.name}))} selectedSlug={active.operator.slug}/>}
    {active&&<div className="operator-subpage__calendar-grid">
      <CalendarImporter operatorId={active.operator_id} operatorName={active.operator.name}/>
      <aside className="operator-calendar-help">
       <div className="eyebrow">Come funziona</div>
       <h2 style={{margin:"7px 0 14px",fontSize:24}}>Prima bozza, poi verifica</h2>
       <div style={{display:"grid",gap:12}}>
        <div><strong>1 · Incolla</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Copia il calendario o il messaggio WhatsApp.</p></div>
        <div><strong>2 · BIMARIS interpreta</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>Riconosce date, orari e appuntamenti.</p></div>
        <div><strong>3 · Salva come bozza</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>I duplicati già presenti vengono ignorati.</p></div>
        <div><strong>4 · BIMARIS verifica</strong><p style={{margin:"3px 0 0",color:"var(--muted)"}}>L'amministrazione controlla i dati prima della visibilità pubblica.</p></div>
       </div>
       <div className="operator-calendar-help__note" style={{marginTop:18,padding:"12px 14px",borderRadius:12,fontWeight:700,lineHeight:1.4}}>Nessun appuntamento viene pubblicato automaticamente.</div>
      </aside>
    </div>}
   </>}
  </div></main>;
}
