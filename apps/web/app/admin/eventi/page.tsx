import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import "./admin-events.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  source_label: string | null;
  source_type: string | null;
  operators: { name: string } | { name: string }[] | null;
};
function operatorName(v: Row["operators"]) {
  return Array.isArray(v) ? v[0]?.name ?? "Operatore non indicato" : v?.name ?? "Operatore non indicato";
}
function sourceTypeLabel(v: string | null) {
  const labels: Record<string, string> = { whatsapp: "WhatsApp", website: "Sito web", web: "Sito web", manual: "Manuale", api: "API", instagram: "Instagram" };
  if (!v?.trim()) return "Origine non indicata";
  return labels[v.toLowerCase()] ?? v;
}
function eventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data da verificare"
    : new Intl.DateTimeFormat("it-IT", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Rome" }).format(date);
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { status } = await searchParams;
  const notifications: Record<string, string> = {
    approved: "Evento approvato. Non è ancora pubblicato.",
    rejected: "Evento scartato.",
    published: "Evento pubblicato.",
    stale: "L’evento è già stato modificato o non è più in questo stato. Aggiorna la coda.",
    invalid: "Operazione non valida.",
    error: "Operazione non riuscita. Riprova o verifica lo stato dell’evento.",
  };
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");
  const [{ data, error }, { data: approvedData, error: approvedError }] = await Promise.all([
    db.from("events").select("id,title,description,starts_at,source_label,source_type,operators(name)")
      .eq("verification_status", "pending").eq("published", false).order("starts_at", { ascending: true }),
    db.from("events").select("id,title,description,starts_at,source_label,source_type,operators(name)")
      .eq("verification_status", "verified").eq("published", false).order("starts_at", { ascending: true }),
  ]);
  if (error || approvedError) throw new Error("Impossibile caricare le code degli eventi");
  const rows = (data ?? []) as Row[];
  const approvedRows = (approvedData ?? []) as Row[];

  return <div className="admin-events">
    <header className="admin-events__hero">
      <div className="admin-events__container">
        <div className="admin-events__eyebrow">Amministrazione / Verifica eventi</div>
        <h1>Eventi da verificare</h1>
        <p>Questa coda contiene le schede evento in attesa di controllo. Le proposte e le modifiche delle esperienze degli operatori si esaminano in una sezione separata.</p>
        <nav className="admin-events__links" aria-label="Navigazione amministrativa">
          <Link href="/admin">← Centro operativo</Link>
          <Link href="/admin/operatori">Operatori ed esperienze</Link>
        </nav>
      </div>
    </header>
    <section className="admin-events__body" aria-label="Coda eventi">
      <div className="admin-events__container">
        {status && notifications[status] && <p role="status" className="admin-events__notice">{notifications[status]}</p>}
        <div className="admin-events__summary">
          <div><span className="admin-events__eyebrow">Coda di revisione</span><h2>In attesa di verifica</h2></div>
          <strong aria-label={`${rows.length} eventi in attesa`}>{rows.length} {rows.length === 1 ? "evento" : "eventi"}</strong>
        </div>
        <p className="admin-events__hint">Il registro eventi è distinto dalle candidature e dalle esperienze degli operatori. L'approvazione non pubblica l'evento: è necessaria una successiva azione esplicita.</p>
        {rows.length === 0
          ? <div className="admin-events__empty"><h3>Nessun evento da controllare</h3><p>La coda di verifica è vuota.</p></div>
          : <div className="admin-events__list">{rows.map(row => <article className="admin-events__card" key={row.id}>
              <div className="admin-events__metadata">
                <span><strong>Operatore</strong>{operatorName(row.operators)}</span>
                <span><strong>Canale di acquisizione</strong>{sourceTypeLabel(row.source_type)}</span>
                <span><strong>Fonte dichiarata</strong>{row.source_label?.trim() || "Non indicata"}</span>
              </div>
              <h3>{row.title}</h3>
              <p className="admin-events__date">{eventDate(row.starts_at)}</p>
              {row.description && <p className="admin-events__description">{row.description}</p>}
              <div className="admin-events__actions">
                <form method="post" action={`/api/admin/events/${row.id}/status`}>
                  <input type="hidden" name="action" value="approve" />
                  <button className="admin-events__approve" type="submit">Approva</button>
                </form>
                <form method="post" action={`/api/admin/events/${row.id}/status`}>
                  <input type="hidden" name="action" value="reject" />
                  <button className="admin-events__reject" type="submit">Scarta</button>
                </form>
              </div>
            </article>)}</div>}
        <section className="admin-events__approved" aria-labelledby="approved-events-heading">
          <div className="admin-events__summary">
            <div><span className="admin-events__eyebrow">Seconda fase</span><h2 id="approved-events-heading">Approvati, da pubblicare</h2></div>
            <strong>{approvedRows.length} {approvedRows.length === 1 ? "evento" : "eventi"}</strong>
          </div>
          {approvedRows.length === 0
            ? <div className="admin-events__empty"><h3>Nessun evento pronto per la pubblicazione</h3><p>Gli eventi approvati appariranno qui fino alla pubblicazione.</p></div>
            : <div className="admin-events__list">{approvedRows.map(row => <article className="admin-events__card" key={row.id}>
                <div className="admin-events__metadata">
                  <span><strong>Operatore</strong>{operatorName(row.operators)}</span>
                  <span><strong>Canale di acquisizione</strong>{sourceTypeLabel(row.source_type)}</span>
                <span><strong>Fonte dichiarata</strong>{row.source_label?.trim() || "Non indicata"}</span>
                </div>
                <h3>{row.title}</h3>
                <p className="admin-events__date">{eventDate(row.starts_at)}</p>
                {row.description && <p className="admin-events__description">{row.description}</p>}
                <div className="admin-events__actions">
                  <form method="post" action={`/api/admin/events/${row.id}/status`}>
                    <input type="hidden" name="action" value="publish" />
                    <button className="admin-events__approve" type="submit">Pubblica</button>
                  </form>
                </div>
              </article>)}</div>}
        </section>
      </div>
    </section>
  </div>;
}
