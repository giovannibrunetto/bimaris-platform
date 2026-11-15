import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../eventi/admin-events.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Experience = { id:string; name:string; review_status:string; published:boolean; experience_origin:string };
type Appointment = { id:string; title:string; starts_at:string; published:boolean; verification_status:string; source_type:string|null };
function dateLabel(value: string) {
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"Data da verificare":new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(d);
}
export default async function ActivitiesRegister({searchParams}:{searchParams:Promise<{tipo?:string;view?:string}>}) {
  if(!(await isAuthorizedAdmin())) redirect("/admin/login");
  const {tipo,view}=await searchParams;
  const selected=tipo==="esperienze"||tipo==="appuntamenti"?tipo:"tutti";
  const readyOnly=view==="ready";
  const db=createServiceClient();
  if(!db) throw new Error("Supabase non configurato");
  const [experiencesResult,appointmentsResult]=await Promise.all([
    db.from("experiences").select("id,name,review_status,published,experience_origin").order("created_at",{ascending:false}),
    db.from("events").select("id,title,starts_at,published,verification_status,source_type").order("starts_at",{ascending:false}),
  ]);
  if(experiencesResult.error||appointmentsResult.error) throw new Error("Impossibile caricare il registro delle attività");
  const allExperiences=(experiencesResult.data??[]) as Experience[];
  const allAppointments=(appointmentsResult.data??[]) as Appointment[];
  // The reviewed-but-unpublished view concerns imported appointments only: experience publication
  // has an independent workflow; do not imply they share the same DB status model yet.
  const experiences=readyOnly?[]:allExperiences;
  const appointments=readyOnly?allAppointments.filter(v=>v.verification_status==="verified"&&!v.published):allAppointments;
  const countOnlineExperiences=allExperiences.filter(v=>v.published).length;
  const countPublishedAppointments=allAppointments.filter(v=>v.published).length;
  const countPendingAppointments=allAppointments.filter(v=>v.verification_status==="pending"&&!v.published).length;
  const countReadyAppointments=allAppointments.filter(v=>v.verification_status==="verified"&&!v.published).length;
  return <div className="admin-events">
    <header className="admin-events__hero"><div className="admin-events__container">
      <span className="admin-events__eyebrow">Amministrazione / Stato piattaforma</span>
      <h1>Esperienze e appuntamenti</h1>
      <p>Un unico registro di consultazione. Ogni contenuto mantiene il suo dossier, lo stato reale e la fonte: gli appuntamenti acquisiti non vengono duplicati come esperienze.</p>
      <nav className="admin-events__links"><Link href="/admin">← Centro operativo</Link><Link href="/admin/contenuti">Contenuti da esaminare</Link></nav>
    </div></header>
    <main className="admin-events__body"><div className="admin-events__container">
      <div className="admin-events__register-stats" aria-label="Riepilogo registro">
        <div><strong>{allExperiences.length}</strong><span>Esperienze totali</span><small>{countOnlineExperiences} online</small></div>
        <div><strong>{allAppointments.length}</strong><span>Appuntamenti acquisiti</span><small>{countPublishedAppointments} pubblicati</small></div>
        <div><strong>{countPendingAppointments}</strong><span>Appuntamenti da verificare</span></div>
        <div><strong>{countReadyAppointments}</strong><span>Approvati da pubblicare</span></div>
      </div>
      <nav className="admin-events__filters" aria-label="Filtra il registro">
        <Link href="/admin/attivita" aria-current={!readyOnly&&selected==="tutti"?"page":undefined}>Tutti</Link>
        <Link href="/admin/attivita?tipo=esperienze" aria-current={!readyOnly&&selected==="esperienze"?"page":undefined}>Esperienze</Link>
        <Link href="/admin/attivita?tipo=appuntamenti" aria-current={!readyOnly&&selected==="appuntamenti"?"page":undefined}>Appuntamenti</Link>
        <Link href="/admin/attivita?view=ready" aria-current={readyOnly?"page":undefined}>Da pubblicare ({countReadyAppointments})</Link>
      </nav>
      {!readyOnly&&selected!=="appuntamenti"&&<section className="admin-events__queue-group" aria-labelledby="registry-experiences">
        <h2 id="registry-experiences">Esperienze <small>{experiences.length}</small></h2>
        <div className="admin-events__list">{experiences.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">{item.experience_origin==="bimaris"?"Curata da BIMARIS":"Proposta operatore"} · {item.published?"Online":"Non pubblicata"} · {item.review_status}</span><h3>{item.name}</h3></div>
          <Link className="admin-events__examine" href={`/admin/esperienze/${item.id}`}>Apri dossier →</Link>
        </article>)}{experiences.length===0&&<div className="admin-events__empty">Nessuna esperienza nel registro.</div>}</div>
      </section>}
      {(readyOnly||selected!=="esperienze")&&<section className="admin-events__queue-group" aria-labelledby="registry-appointments">
        <h2 id="registry-appointments">Appuntamenti acquisiti <small>{appointments.length}</small></h2>
        <div className="admin-events__list">{appointments.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">{item.published?"Pubblicato":item.verification_status==="pending"?"Da verificare":item.verification_status==="rejected"?"Scartato":"Verificato · non pubblicato"} · {item.source_type?.trim()||"Origine non indicata"}</span>
            <h3>{item.title}</h3><p className="admin-events__date">{dateLabel(item.starts_at)}</p>
          </div>
          <Link className="admin-events__examine" href={`/admin/eventi/${item.id}`}>Apri dossier →</Link>
        </article>)}{appointments.length===0&&<div className="admin-events__empty">Nessun appuntamento per questo filtro.</div>}</div>
      </section>}
      <p className="admin-events__hint">Registro di consultazione: esperienze e appuntamenti sono presentati insieme, ma restano salvati nei rispettivi archivi fino alla validazione tecnica dell'integrazione MAI.</p>
    </div></main>
  </div>;
}
