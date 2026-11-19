import AdminSectionHeader from "../AdminSectionHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../eventi/admin-events.css";
import "./review-queue.css";
import { experienceFieldChanges, experienceReviewFields } from "@/lib/experience-review-fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Application = { id: string; business_name: string; status: string };
type Exp = { id: string; name: string; operator_id: string | null; review_status: string; experience_origin: string };
type RevisionExperience = { name: string } & Record<string, unknown>;
type ExpRevision = {
  id: string;
  experience_id: string;
  content: Record<string, unknown> | null;
  experiences: RevisionExperience | RevisionExperience[] | null;
};
type ProfileRevision = { id: string; operator_id: string; operators: { name: string } | { name: string }[] | null };
type Event = { id: string; title: string; starts_at: string; source_type: string | null };
function relatedName(v: { name: string } | { name: string }[] | null) {
  return (Array.isArray(v) ? v[0] : v)?.name ?? "Operatore";
}
function dated(v: string) {
  const date = new Date(v);
  return Number.isNaN(date.getTime()) ? "Data da verificare" :
    new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(date);
}
export default async function ContentReview({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [applicationsRes, profilesRes, expsRes, revisionsRes, eventsRes] = await Promise.all([
    db.from("operator_applications").select("id,business_name,status").in("status", ["new", "reviewing"]).order("created_at", { ascending: false }),
    db.from("operator_revisions").select("id,operator_id,operators(name)").eq("status","pending").order("created_at",{ascending:false}),
    db.from("experiences").select("id,name,operator_id,review_status,experience_origin").neq("experience_origin","bimaris").in("review_status",["pending","submitted"]).order("created_at",{ascending:false}),
    db.from("experience_revisions").select(`id,experience_id,content,experiences!inner(experience_origin,${experienceReviewFields})`).eq("status","pending").neq("experiences.experience_origin","bimaris"),
    db.from("events").select("id,title,starts_at,source_type").eq("verification_status","pending").eq("published",false).order("starts_at",{ascending:true}),
  ]);
  if (applicationsRes.error || profilesRes.error || expsRes.error || revisionsRes.error || eventsRes.error) {
    throw new Error("Impossibile caricare le attività da esaminare");
  }
  const applications = (applicationsRes.data ?? []) as Application[];
  const profiles = (profilesRes.data ?? []) as ProfileRevision[];
  const experiences = (expsRes.data ?? []) as Exp[];
  const revisions = (revisionsRes.data ?? []) as ExpRevision[];
  const appointments = (eventsRes.data ?? []) as Event[];
  const experienceCount = experiences.length + revisions.length;
  const categories = [
    { key: "candidature", label: "Candidature", count: applications.length },
    { key: "profili", label: "Modifiche ai profili", count: profiles.length },
    { key: "esperienze", label: "Esperienze", count: experienceCount },
    { key: "appuntamenti", label: "Appuntamenti MAI", count: appointments.length },
  ];
  const { categoria } = await searchParams;
  const selected = categories.find(item => item.key === categoria)
    ?? categories.find(item => item.count > 0)
    ?? categories[0];

  return <div className="admin-events admin-content-review">
    <AdminSectionHeader
      title="Contenuti da esaminare"
      description="Qui trovi candidature, modifiche ai profili e attività in attesa di verifica. Le esperienze sono attività proposte dagli operatori, come visite o laboratori. Gli appuntamenti sono eventi con una data specifica provenienti da fonti esterne. Il MAI è il canale previsto per acquisirli."
      actions={<Link href="/admin">← Centro operativo</Link>}
    />
    <section className="admin-events__body"><div className="admin-events__container review-queue">
      <nav className="review-queue__categories" aria-label="Categorie da esaminare">
        {categories.map(category => <Link
          key={category.key}
          href={`/admin/contenuti?categoria=${category.key}`}
          aria-current={category.key === selected.key ? "page" : undefined}
          scroll={false}
        >
          <span>{category.label}</span>
          <span className="review-queue__count">{category.count}</span>
        </Link>)}
      </nav>
      {selected.key === "candidature" && <section className="review-queue__panel" aria-label={selected.label}>
        <div className="review-queue__content">
        <div className="admin-events__list">
          {applications.map(item => <article key={item.id} className="admin-events__card admin-events__card--compact">
            <div className="admin-events__card-main">
              <span className="admin-events__eyebrow">{item.status === "reviewing" ? "In valutazione" : "Nuova candidatura"}</span>
              <h3>{item.business_name}</h3>
              <p>Verifica i dati dell’attività e decidi se accogliere la candidatura.</p>
            </div>
            <Link className="admin-events__examine" href={`/admin/candidature/${item.id}`}>
              {item.status === "reviewing" ? "Continua valutazione →" : "Esamina candidatura →"}
            </Link>
          </article>)}
          {applications.length === 0 && <p className="admin-events__empty">Nessuna candidatura in attesa.</p>}
        </div>
        <p><Link className="text-link" href="/admin/candidature?filter=closed">Storico candidature →</Link></p>
        </div>
      </section>}
      {selected.key === "profili" && <section className="review-queue__panel" aria-label={selected.label}>
        <div className="review-queue__content">
        <div className="admin-events__list">{profiles.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">Modifica profilo</span><h3>{relatedName(item.operators)}</h3><p>Confronta il profilo attuale con le modifiche proposte e decidi se approvarle.</p></div>
          <Link className="admin-events__examine" href={`/admin/operatori/${item.operator_id}/revisioni-profilo`}>Esamina →</Link>
        </article>)}</div>
        {profiles.length === 0 && <p className="admin-events__empty">Nessuna modifica al profilo in attesa.</p>}
        </div>
      </section>}
      {selected.key === "esperienze" && <section className="review-queue__panel" aria-label={selected.label}>
        <div className="review-queue__content">
        <div className="admin-events__list">
          {experiences.map(item=><article className="admin-events__card admin-events__card--compact" key={`exp-${item.id}`}>
            <div className="admin-events__card-main"><span className="admin-events__eyebrow">Esperienza · Nuova proposta</span><h3>{item.name}</h3><p>Controlla descrizione, luogo, prezzo e foto prima di decidere sulla proposta.</p></div>
            <Link className="admin-events__examine" href={`/admin/esperienze/${item.id}#admin-decision`}>Esamina proposta →</Link>
          </article>)}
          {revisions.map(item=>{
            const current = Array.isArray(item.experiences) ? item.experiences[0] : item.experiences;
            const fields = current && item.content ? experienceFieldChanges(current, item.content).map(([label]) => label) : [];
            return <article className="admin-events__card admin-events__card--compact" key={`rev-${item.id}`}>
            <div className="admin-events__card-main"><span className="admin-events__eyebrow">Esperienza · Modifica</span><h3>{relatedName(item.experiences)}</h3><p>{fields.length > 0 ? `Campi modificati: ${fields.join(", ")}. Confronta le versioni prima di decidere.` : "Apri il confronto per verificare le differenze, comprese le foto."}</p></div>
            <Link className="admin-events__examine" href={`/admin/esperienze/${encodeURIComponent(item.experience_id)}/revisione#revision-changes-title`}>Confronta modifica →</Link>
          </article>;
          })}
          {experienceCount === 0 && <p className="admin-events__empty">Nessuna esperienza in attesa.</p>}
        </div>
        <p><Link className="text-link" href="/admin/attivita?tipo=esperienze">Registro esperienze e creazione →</Link></p>
        </div>
      </section>}
      {selected.key === "appuntamenti" && <section className="review-queue__panel" aria-label={selected.label}>
        <div className="review-queue__content">
        <div className="admin-events__list">
          {appointments.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">Appuntamento · {item.source_type?.trim() || "Origine non indicata"}</span><h3>{item.title}</h3><p className="admin-events__date">{dated(item.starts_at)}</p><p>Verifica data, luogo e fonte prima di confermare l’appuntamento.</p></div>
          <Link className="admin-events__examine" href={`/admin/eventi/${item.id}#admin-event-decision`}>Verifica appuntamento →</Link>
        </article>)}
          {appointments.length === 0 && <p className="admin-events__empty">Nessun appuntamento in attesa.</p>}
        </div>
        <p><Link className="text-link" href="/admin/attivita?tipo=appuntamenti">Registro appuntamenti e pubblicazione →</Link></p>
        </div>
      </section>}
      <p className="admin-events__hint">La verifica non comporta pubblicazione automatica. Puoi approvare, scartare o pubblicare dalla scheda della singola pratica.</p>
    </div></section>
  </div>;
}
