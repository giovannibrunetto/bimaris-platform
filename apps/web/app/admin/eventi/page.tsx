import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./admin-event-review.css";

export const dynamic="force-dynamic";
export const revalidate=0;

type Row={id:string;title:string;description:string|null;starts_at:string;source_type:string|null;source_label:string|null;source_url:string|null;operators:{name:string}|{name:string}[]|null};
function operatorName(v:Row["operators"]){return Array.isArray(v)?v[0]?.name??"Operatore non specificato":v?.name??"Operatore non specificato";}
function sourceTypeLabel(value:string|null){return ({whatsapp:"Segnalazione WhatsApp",web:"Fonte web",website:"Sito web",manual:"Inserimento manuale",import:"Importazione"} as Record<string,string>)[value??""]??"Fonte dichiarata";}

export default async function AdminEventsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
 if(!(await isAuthorizedAdmin()))redirect("/admin/login");
 const db=createServiceClient();if(!db)throw new Error("Supabase non configurato");
 const [{data,error}]=await Promise.all([
  db.from("events").select("id,title,description,starts_at,source_type,source_label,source_url,operators(name)")
   .eq("verification_status","pending").order("starts_at",{ascending:true})
 ]);
 const rows=(data??[]) as Row[];
 const {status}=await searchParams;
 const feedback=status==="approved"?"Evento approvato e pubblicato.":status==="rejected"?"Segnalazione scartata.":status==="error"?"Operazione non riuscita. Verifica lo stato prima di riprovare.":status==="invalid"?"Azione non valida.":null;
 return <div className="admin-event-review">
  <section className="admin-event-review__intro">
   <div className="admin-event-review__container">
    <span className="admin-event-review__eyebrow">Centro operativo / Segnalazioni calendario</span>
    <h1>Eventi da verificare</h1>
    <p>Questa coda contiene soltanto gli appuntamenti acquisiti come segnalazioni evento. Le nuove esperienze e le modifiche degli operatori si valutano in una sezione distinta.</p>
    <div className="admin-event-review__actions">
     <span className="admin-event-review__count">{rows.length} {rows.length===1?"segnalazione in attesa":"segnalazioni in attesa"}</span>
     <Link href="/admin/operatori#pending-operators">Operatori ed esperienze da esaminare</Link>
     <Link href="/admin">Dashboard</Link>
    </div>
   </div>
  </section>
  <section className="admin-event-review__main" id="pending-events">
   <div className="admin-event-review__container">
    <p className="admin-event-review__rule"><strong>Attenzione:</strong> «Approva e pubblica» rende l'evento visibile nel calendario. Prima controlla data, fonte, descrizione e possibili segnalazioni duplicate. Non equivale all'approvazione di un'esperienza.</p>
    {feedback&&<p className="admin-event-review__feedback" role="status">{feedback}</p>}
    {error?<div className="admin-event-review__empty" role="alert"><h2>Impossibile caricare gli eventi</h2><p>Non è stato possibile verificare la coda. Nessuna operazione è stata eseguita.</p></div>
    :rows.length===0?<div className="admin-event-review__empty"><h2>Nessuna segnalazione da verificare</h2><p>La coda degli eventi è vuota. Le esperienze in valutazione rimangono nella sezione operatori.</p></div>
    :<div className="admin-event-review__list">{rows.map(row=><article key={row.id} className="admin-event-review__card">
      <div className="admin-event-review__card-top">
       <div>
        <span className="admin-event-review__source">{sourceTypeLabel(row.source_type)} · {operatorName(row.operators)}</span>
        <h2>{row.title}</h2>
       </div>
       <span className="admin-event-review__status">Da verificare</span>
      </div>
      <dl className="admin-event-review__facts">
       <div><dt>Data e ora</dt><dd>{new Intl.DateTimeFormat("it-IT",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(row.starts_at))}</dd></div>
       <div><dt>Fonte</dt><dd>{row.source_label||sourceTypeLabel(row.source_type)}{row.source_url&&<span> · <a href={row.source_url} target="_blank" rel="noreferrer noopener">Apri fonte esterna</a></span>}</dd></div>
      </dl>
      {row.description&&<section className="admin-event-review__description" aria-label="Descrizione ricevuta"><strong>Descrizione della segnalazione</strong><p>{row.description}</p></section>}
      <div className="admin-event-review__decision">
       <form method="post" action={`/api/admin/events/${row.id}/status`}>
        <input type="hidden" name="action" value="approve"/>
        <button className="admin-event-review__approve" type="submit">Approva e pubblica</button>
       </form>
       <form method="post" action={`/api/admin/events/${row.id}/status`}>
        <input type="hidden" name="action" value="reject"/>
        <button className="admin-event-review__reject" type="submit">Scarta segnalazione</button>
       </form>
      </div>
     </article>)}</div>}
   </div>
  </section>
 </div>;
}
