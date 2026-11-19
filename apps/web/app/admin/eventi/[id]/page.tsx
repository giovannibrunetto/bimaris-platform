import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "../admin-events.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EventRow = {
  id: string; title: string; description: string | null;
  starts_at: string; ends_at: string | null; location: string | null;
  published: boolean; verification_status: string;
  source_type: string | null; source_label: string | null;
  source_url: string | null; import_batch_id: string | null;
  metadata: { price_eur?: unknown } | null;
  operators: { name: string } | { name: string }[] | null;
  territories: { name: string } | { name: string }[] | null;
};
function relationName(value: { name: string } | { name: string }[] | null) {
  return (Array.isArray(value) ? value[0] : value)?.name ?? "Non indicato";
}
function priceLabel(metadata: EventRow["metadata"]) {
  const price = metadata?.price_eur;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return "Non indicato";
  return price === 0 ? "Gratuito" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(price);
}
function dateLabel(value: string | null) {
  if (!value) return "Non indicata";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Da verificare" : new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full", timeStyle: "short", timeZone: "Europe/Rome",
  }).format(date);
}
function sourceLink(value: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch { return null; }
}
const sourceTypes: Record<string, string> = {
  whatsapp: "WhatsApp", website: "Sito web", web: "Sito web",
  manual: "Manuale", api: "API", instagram: "Instagram",
};

export default async function AdminEventReview({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const { data, error } = await db.from("events")
    .select("id,title,description,starts_at,ends_at,location,published,verification_status,source_type,source_label,source_url,import_batch_id,metadata,operators(name),territories(name)")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("Impossibile caricare la scheda dell'evento");
  if (!data) notFound();
  const event = data as EventRow;
  const source = sourceLink(event.source_url);
  const place = event.location?.trim();
  const territory = relationName(event.territories);
  const locality = place && territory !== "Non indicato" && !place.toLocaleLowerCase("it-IT").includes(territory.toLocaleLowerCase("it-IT"))
    ? `${place} · ${territory}` : place || territory;
  const pending = event.verification_status === "pending" && event.published === false;
  const approved = event.verification_status === "verified" && event.published === false;

  return <div className="admin-events">
    <header className="admin-events__hero">
      <div className="admin-events__container">
        <span className="admin-events__eyebrow">Area privata · Amministrazione · Scheda evento</span>
        <h1>Esamina evento</h1>
        <p>Verifica i dati di questa singola occorrenza prima di decidere. La revisione di un evento non sostituisce quella delle esperienze.</p>
        <nav className="admin-events__links" aria-label="Torna alla coda eventi">
          <Link href="/admin/eventi#pending-events">← Eventi da verificare</Link>
          <Link href="/admin">Centro operativo</Link>
        </nav>
      </div>
    </header>
    <section className="admin-events__body">
      <div className="admin-events__container admin-events__container--detail">
        <article className="admin-events__card admin-events__detail">
          <span className="admin-events__eyebrow">{pending ? "In attesa di verifica" : approved ? "Approvato · da pubblicare" : event.published ? "Pubblicato" : "Stato: " + event.verification_status}</span>
          <h2>{event.title}</h2>
          <p className="admin-events__detail-hint">La data e l'identificativo distinguono questa occorrenza da altri eventi con lo stesso titolo.</p>
          <dl className="admin-events__facts">
            <div><dt>Inizio</dt><dd>{dateLabel(event.starts_at)}</dd></div>
            <div><dt>Fine</dt><dd>{dateLabel(event.ends_at)}</dd></div>
            <div><dt>Località</dt><dd>{locality}</dd></div>
            <div><dt>Prezzo</dt><dd>{priceLabel(event.metadata)}</dd></div>
            <div><dt>Operatore</dt><dd>{relationName(event.operators)}</dd></div>
            <div><dt>Canale di acquisizione</dt><dd>{event.source_type ? sourceTypes[event.source_type.toLowerCase()] ?? event.source_type : "Non indicato"}</dd></div>
            <div><dt>Fonte dichiarata</dt><dd>{event.source_label?.trim() || "Non indicata"}</dd></div>
            <div><dt>URL fonte</dt><dd>{source ? <a href={source} target="_blank" rel="noopener noreferrer">Apri fonte esterna ↗</a> : "Non disponibile"}</dd></div>
            <div><dt>Identificativo evento</dt><dd className="admin-events__identifier">{event.id}</dd></div>
          </dl>
          <section className="admin-events__detail-description" aria-labelledby="event-description-heading">
            <h3 id="event-description-heading">Informazioni dell'evento</h3>
            <p>{event.description?.trim() || "Nessuna descrizione disponibile: controlla gli altri dati e la fonte prima di decidere."}</p>
          </section>
          {event.import_batch_id && <p className="admin-events__audit">Lotto di acquisizione: <code>{event.import_batch_id}</code></p>}
        </article>
        <section id="admin-event-decision" className="admin-events__decision" style={{ scrollMarginTop: 190 }} aria-label="Decisione amministratore">
          <h2>{pending ? "Decisione sulla verifica" : approved ? "Pubblicazione" : "Nessuna azione disponibile"}</h2>
          {pending ? <>
            <p>L'approvazione valida questo evento, ma <strong>non lo pubblica</strong>. Lo scarto esclude questa occorrenza dalla coda; nessuna delle due azioni modifica le esperienze dell'operatore.</p>
            <div className="admin-events__actions">
              <form method="post" action={`/api/admin/events/${event.id}/status`}>
                <input type="hidden" name="action" value="approve"/>
                <button className="admin-events__approve" type="submit">Approva evento</button>
              </form>
              <form method="post" action={`/api/admin/events/${event.id}/status`}>
                <input type="hidden" name="action" value="reject"/>
                <button className="admin-events__reject" type="submit">Scarta evento</button>
              </form>
            </div>
          </> : approved ? <>
            <p>L'evento è stato verificato, ma non è ancora visibile al pubblico. La pubblicazione è un'azione distinta.</p>
            <div className="admin-events__actions">
              <form method="post" action={`/api/admin/events/${event.id}/status`}>
                <input type="hidden" name="action" value="publish"/>
                <button className="admin-events__approve" type="submit">Pubblica evento</button>
              </form>
            </div>
          </> : <p>Lo stato attuale non consente altre decisioni da questa schermata.</p>}
        </section>
      </div>
    </section>
  </div>;
}
