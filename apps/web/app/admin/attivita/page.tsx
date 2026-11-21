import AdminSectionHeader from "../AdminSectionHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../eventi/admin-events.css";
import {isReadyExperience,isReadyAppointment} from "../ready-to-publish";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OperatorState = { published: boolean };
type Experience = { operator: OperatorState | OperatorState[] | null; id:string; name:string; review_status:string; published:boolean; experience_origin:string };
type Appointment = { id:string; title:string; starts_at:string; published:boolean; verification_status:string; source_type:string|null };
function dateLabel(value: string) {
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"Data da verificare":new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(d);
}
export default async function ActivitiesRegister({searchParams}:{searchParams:Promise<{tipo?:string;view?:string}>}) {
  if(!(await isAuthorizedAdmin())) redirect("/admin/login");
  const {tipo,view}=await searchParams;
  const acquiredOnly = view === "acquisiti";
  const selected=acquiredOnly ? "appuntamenti" : tipo==="esperienze"||tipo==="appuntamenti"?tipo:"tutti";
  const readyOnly=view==="ready";
  const db=createServiceClient();
  if(!db) throw new Error("Supabase non configurato");
  const [experiencesResult,appointmentsResult,revisionsResult]=await Promise.all([
    db.from("experiences").select("id,name,review_status,published,experience_origin,operator:operators!experiences_operator_id_fkey(published)").order("created_at",{ascending:false}),
    db.from("events").select("id,title,starts_at,published,verification_status,source_type").order("starts_at",{ascending:false}),
    db.from("experience_revisions").select("experience_id,experiences!inner(experience_origin)").eq("status","pending").neq("experiences.experience_origin","bimaris"),
  ]);
  if(experiencesResult.error||appointmentsResult.error||revisionsResult.error) throw new Error("Impossibile caricare il registro delle attività");
  const allExperiences=(experiencesResult.data??[]) as Experience[];
  const allAppointments=(appointmentsResult.data??[]) as Appointment[];
  // Experiences and appointments retain independent approval workflows; this view only groups ready items.
  const pendingRevisionIds = new Set((revisionsResult.data ?? []).map(revision => revision.experience_id));
  const registryExperiences = allExperiences.filter(item => item.experience_origin === "bimaris"
    || (!pendingRevisionIds.has(item.id) && item.review_status !== "pending" && item.review_status !== "submitted"));
  const registryAppointments = allAppointments.filter(item => item.verification_status !== "pending" || item.published);
  const readyExperiences=registryExperiences.filter(item=>isReadyExperience(item,pendingRevisionIds));
  const experiences = readyOnly ? readyExperiences : registryExperiences;
  const appointments = readyOnly
    ? allAppointments.filter(isReadyAppointment)
    : acquiredOnly ? allAppointments : registryAppointments;
  const countOnlineExperiences=registryExperiences.filter(v=>v.published).length;
  const countPublishedAppointments=registryAppointments.filter(v=>v.published).length;
  const countReadyAppointments=allAppointments.filter(isReadyAppointment).length;
  return <div className="admin-events">
    <AdminSectionHeader
      title="Esperienze e appuntamenti"
      description="Consulta le attività nel registro. Le proposte e le modifiche in attesa si trovano in Da esaminare."
      actions={<><Link href="/admin/esperienze/nuova" className="admin-section-heading__primary">+ Crea esperienza</Link><Link href={acquiredOnly ? "/admin/contenuti?categoria=appuntamenti" : "/admin/contenuti"}>Da esaminare →</Link></>}
    />
    <section className="admin-events__body"><div className="admin-events__container">
      <div className="admin-events__register-stats" aria-label="Riepilogo registro">
        <div><strong>{registryExperiences.length}</strong><span>Esperienze nel registro</span><small>{countOnlineExperiences} online</small></div>
        <div><strong>{acquiredOnly ? allAppointments.length : registryAppointments.length}</strong><span>Appuntamenti acquisiti</span><small>{countPublishedAppointments} pubblicati</small></div>
        <div><strong>{readyExperiences.length+countReadyAppointments}</strong><span>Attività pronte da pubblicare</span><small>{readyExperiences.length} esperienze · {countReadyAppointments} appuntamenti</small></div>
      </div>
      <nav className="admin-events__filters" aria-label="Filtra il registro">
        <Link href="/admin/attivita" aria-current={!readyOnly&&selected==="tutti"?"page":undefined}>Tutti</Link>
        <Link href="/admin/attivita?tipo=esperienze" aria-current={!readyOnly&&selected==="esperienze"?"page":undefined}>Esperienze</Link>
        <Link href={acquiredOnly ? "/admin/attivita?view=acquisiti" : "/admin/attivita?tipo=appuntamenti"} aria-current={!readyOnly&&selected==="appuntamenti"?"page":undefined}>{acquiredOnly ? "Tutti gli appuntamenti acquisiti" : "Appuntamenti"}</Link>
        <Link href="/admin/attivita?view=ready" aria-current={readyOnly?"page":undefined}>Da pubblicare ({readyExperiences.length+countReadyAppointments})</Link>
      </nav>
      {(readyOnly||selected!=="appuntamenti")&&<section className="admin-events__queue-group" aria-labelledby="registry-experiences">
        <h2 id="registry-experiences">Esperienze <small>{experiences.length}</small></h2>
        <div className="admin-events__list">{experiences.map(item=>{
          const operator = Array.isArray(item.operator) ? item.operator[0] : item.operator;
          const approvedUnpublished = item.review_status === "approved" && !item.published;
          const canPublish = isReadyExperience(item,pendingRevisionIds);
          return <article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">{item.experience_origin==="bimaris"?"Curata da BIMARIS":"Proposta operatore"} · {item.published?"Online":"Non pubblicata"} · {({draft:"Bozza",approved:"Approvata",rejected:"Da correggere",pending:"In attesa",submitted:"In attesa"} as Record<string,string>)[item.review_status] ?? item.review_status}</span><h3>{item.name}</h3>
            {approvedUnpublished && !canPublish && <p className="admin-events__date">Da pubblicare dopo la pubblicazione del profilo operatore.</p>}
          </div>
          <Link className="admin-events__examine" href={`/admin/esperienze/${item.id}${canPublish ? "#admin-decision" : ""}`}>
            {canPublish ? "Vai alla pubblicazione" : "Vedi esperienza"} →
          </Link>
        </article>;
        })}{experiences.length===0&&<div className="admin-events__empty">Nessuna esperienza nel registro.</div>}</div>
      </section>}
      {(readyOnly||selected!=="esperienze")&&<section className="admin-events__queue-group" aria-labelledby="registry-appointments">
        <h2 id="registry-appointments">Appuntamenti acquisiti <small>{appointments.length}</small></h2>
        <div className="admin-events__list">{appointments.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">{item.published?"Pubblicato":item.verification_status==="pending"?"Da verificare":item.verification_status==="rejected"?"Scartato":"Verificato · non pubblicato"} · {item.source_type?.trim()||"Origine non indicata"}</span>
            <h3>{item.title}</h3><p className="admin-events__date">{dateLabel(item.starts_at)}</p>
            {!item.published && item.verification_status === "pending" && <Link className="text-link" href="/admin/contenuti?categoria=appuntamenti">Vai alla coda di verifica →</Link>}
          </div>
          {(item.verification_status !== "pending" || item.published) && <Link className="admin-events__examine" href={`/admin/eventi/${item.id}${!item.published && item.verification_status === "verified" ? "#admin-event-decision" : ""}`}>
            {!item.published && item.verification_status === "verified" ? "Vai alla pubblicazione" : "Vedi appuntamento"} →
          </Link>}
        </article>)}{appointments.length===0&&<div className="admin-events__empty">Nessun appuntamento per questo filtro.</div>}</div>
      </section>}
      <p className="admin-events__hint">Registro di consultazione: esperienze e appuntamenti sono presentati insieme, ma restano salvati nei rispettivi archivi fino alla validazione tecnica dell'integrazione MAI.</p>
    </div></section>
  </div>;
}
