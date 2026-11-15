import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../eventi/admin-events.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Exp = { id: string; name: string; operator_id: string | null; review_status: string; experience_origin: string };
type ExpRevision = { id: string; experience_id: string; experiences: { name: string; experience_origin: string } | { name: string; experience_origin: string }[] | null };
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
export default async function ContentReview({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const { tipo } = await searchParams;
  const chosen = ["profili","esperienze","appuntamenti"].includes(tipo ?? "") ? tipo : "tutti";
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [profilesRes, expsRes, revisionsRes, eventsRes] = await Promise.all([
    db.from("operator_revisions").select("id,operator_id,operators(name)").eq("status","pending").order("created_at",{ascending:false}),
    db.from("experiences").select("id,name,operator_id,review_status,experience_origin").neq("experience_origin","bimaris").in("review_status",["pending","submitted"]).order("created_at",{ascending:false}),
    db.from("experience_revisions").select("id,experience_id,experiences!inner(name,experience_origin)").eq("status","pending").neq("experiences.experience_origin","bimaris"),
    db.from("events").select("id,title,starts_at,source_type").eq("verification_status","pending").eq("published",false).order("starts_at",{ascending:true}),
  ]);
  if (profilesRes.error || expsRes.error || revisionsRes.error || eventsRes.error) {
    throw new Error("Impossibile caricare le attività da esaminare");
  }
  const profiles = (profilesRes.data ?? []) as ProfileRevision[];
  const experiences = (expsRes.data ?? []) as Exp[];
  const revisions = (revisionsRes.data ?? []) as ExpRevision[];
  const appointments = (eventsRes.data ?? []) as Event[];
  const total = profiles.length + experiences.length + revisions.length + appointments.length;
  const options = [
    {id:"tutti",label:"Tutti",amount:total},
    {id:"profili",label:"Profili",amount:profiles.length},
    {id:"esperienze",label:"Esperienze",amount:experiences.length+revisions.length},
    {id:"appuntamenti",label:"Appuntamenti",amount:appointments.length},
  ];
  const show = (id: string) => chosen === "tutti" || chosen === id;
  return <div className="admin-events">
    <header className="admin-events__hero"><div className="admin-events__container">
      <span className="admin-events__eyebrow">Amministrazione / Azioni richieste</span>
      <h1>Contenuti da esaminare</h1>
      <p>Un solo punto d'ingresso per revisioni dei profili, proposte degli operatori e appuntamenti acquisiti. Le procedure di esame rimangono protette e distinte.</p>
      <nav className="admin-events__links" aria-label="Navigazione amministrativa">
        <Link href="/admin">← Centro operativo</Link>
        <Link href="/admin/attivita">Esperienze e appuntamenti</Link>
      </nav>
    </div></header>
    <section className="admin-events__body"><div className="admin-events__container">
      <nav className="admin-events__filters" aria-label="Filtra contenuti da esaminare">
        {options.map(option=><Link key={option.id} href={option.id==="tutti"?"/admin/contenuti":`/admin/contenuti?tipo=${option.id}`} aria-current={chosen===option.id?"page":undefined}>
          {option.label} <span>{option.amount}</span>
        </Link>)}
      </nav>
      {total===0&&<div className="admin-events__empty"><h3>Nessun contenuto in attesa</h3><p>Non ci sono revisioni o nuove proposte da esaminare.</p></div>}
      {show("profili")&&profiles.length>0&&<section className="admin-events__queue-group" aria-labelledby="review-profiles"><h2 id="review-profiles">Profili operatore <small>{profiles.length}</small></h2>
        <div className="admin-events__list">{profiles.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">Modifica profilo</span><h3>{relatedName(item.operators)}</h3></div>
          <Link className="admin-events__examine" href={`/admin/operatori/${item.operator_id}/revisioni-profilo`}>Esamina →</Link>
        </article>)}</div>
      </section>}
      {show("esperienze")&&(experiences.length>0||revisions.length>0)&&<section className="admin-events__queue-group" aria-labelledby="review-experiences"><h2 id="review-experiences">Esperienze <small>{experiences.length+revisions.length}</small></h2>
        <div className="admin-events__list">
          {experiences.map(item=><article className="admin-events__card admin-events__card--compact" key={`exp-${item.id}`}>
            <div className="admin-events__card-main"><span className="admin-events__eyebrow">Nuova proposta</span><h3>{item.name}</h3></div>
            <Link className="admin-events__examine" href={`/admin/esperienze/${item.id}#admin-decision`}>Esamina →</Link>
          </article>)}
          {revisions.map(item=><article className="admin-events__card admin-events__card--compact" key={`rev-${item.id}`}>
            <div className="admin-events__card-main"><span className="admin-events__eyebrow">Modifica esperienza</span><h3>{relatedName(item.experiences)}</h3></div>
            <Link className="admin-events__examine" href={`/admin/revisione-esperienza?id=${encodeURIComponent(item.experience_id)}`}>Esamina →</Link>
          </article>)}
        </div>
      </section>}
      {show("appuntamenti")&&appointments.length>0&&<section className="admin-events__queue-group" aria-labelledby="review-appointments"><h2 id="review-appointments">Appuntamenti <small>{appointments.length}</small></h2>
        <div className="admin-events__list">{appointments.map(item=><article className="admin-events__card admin-events__card--compact" key={item.id}>
          <div className="admin-events__card-main"><span className="admin-events__eyebrow">{item.source_type?.trim() || "Origine non indicata"}</span><h3>{item.title}</h3><p className="admin-events__date">{dated(item.starts_at)}</p></div>
          <Link className="admin-events__examine" href={`/admin/eventi/${item.id}`}>Esamina →</Link>
        </article>)}</div>
      </section>}
      {chosen!=="tutti"&&((chosen==="profili"&&profiles.length===0)||(chosen==="esperienze"&&experiences.length+revisions.length===0)||(chosen==="appuntamenti"&&appointments.length===0))&&
        <div className="admin-events__empty"><h3>Nessun elemento in questa categoria</h3><p>Puoi consultare le altre categorie dalla barra dei filtri.</p></div>}
      <p className="admin-events__hint">La verifica non comporta pubblicazione automatica. Approvazioni, scarti e pubblicazioni si effettuano esclusivamente nei rispettivi dossier.</p>
    </div></section>
  </div>;
}
