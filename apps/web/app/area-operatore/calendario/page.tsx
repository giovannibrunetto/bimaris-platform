import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import CalendarImporter from "../CalendarImporter";

export const dynamic="force-dynamic";
export const revalidate=0;

type Operator={id:string;name:string};
type Membership={role:string;operator_id:string;operators:Operator|Operator[]|null};
function related(v:Operator|Operator[]|null){return Array.isArray(v)?v[0]??null:v;}

export default async function CalendarImportPage(){
 const db=await createUserServerClient();if(!db)redirect("/accedi");
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)redirect("/accedi");
 const {data}=await db.from("operator_memberships").select("role,operator_id,operators(id,name)").eq("user_id",userId);
 const rows=((data??[]) as Membership[]).map(r=>({role:r.role,operator_id:r.operator_id,operator:related(r.operators)})).filter(r=>r.operator&&["owner","manager"].includes(r.role)) as {role:string;operator_id:string;operator:Operator}[];
 return <>
  <section className="page-hero"><div className="kicker">Area Operatore · Agenda</div><h1>Importa il tuo calendario</h1><p>Trasforma in bozze BIMARIS i calendari che già condividi su WhatsApp, senza riscrivere ogni appuntamento.</p></section>
  <section className="section" style={{background:"var(--sand)"}}><div className="container" style={{maxWidth:960,display:"grid",gap:22}}>
   {rows.length===0?<div className="detail-panel"><h2>Nessuna attività gestibile</h2><p>Questo account non risulta collegato come responsabile di un operatore.</p></div>:rows.map(r=><CalendarImporter key={r.operator_id} operatorId={r.operator_id} operatorName={r.operator.name}/>)}
   <div className="detail-panel"><div className="eyebrow">Come funziona</div><h3>Prima bozza, poi verifica</h3><p>BIMARIS estrae gli appuntamenti dal testo e li salva come bozze. L'amministrazione può controllare titolo, data, orario e contenuto prima di renderli visibili agli utenti. Il testo originale resta collegato all'importazione per consentire il controllo della fonte.</p></div>
  </div></section>
 </>;
}
