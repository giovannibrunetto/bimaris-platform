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
  operators: { name: string } | { name: string }[] | null;
};
function operatorName(v: Row["operators"]) {
  return Array.isArray(v) ? v[0]?.name ?? "Operatore non indicato" : v?.name ?? "Operatore non indicato";
}
function eventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data da verificare"
    : new Intl.DateTimeFormat("it-IT", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Rome" }).format(date);
}

export default async function AdminEventsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");
  const { data, error } = await db.from("events")
    .select("id,title,description,starts_at,source_label,operators(name)")
    .eq("verification_status", "pending")
    .order("starts_at", { ascending: true });
  if (error) throw new Error("Impossibile caricare gli eventi da verificare");
  const rows = (data ?? []) as Row[];

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
        <div className="admin-events__summary">
          <div><span className="admin-events__eyebrow">Coda di revisione</span><h2>In attesa di verifica</h2></div>
          <strong aria-label={`${rows.length} eventi in attesa`}>{rows.length} {rows.length === 1 ? "evento" : "eventi"}</strong>
        </div>
        <p className="admin-events__hint">Le schede di questa pagina provengono dal registro eventi. Non sono candidature, esperienze o revisioni di esperienze. L'azione «Approva e pubblica» rende pubblico l'evento: usala solo dopo la verifica completa.</p>
        {rows.length === 0
          ? <div className="admin-events__empty"><h3>Nessun evento da controllare</h3><p>La coda di verifica è vuota.</p></div>
          : <div className="admin-events__list">{rows.map(row => <article className="admin-events__card" key={row.id}>
              <div className="admin-events__metadata">
                <span><strong>Operatore</strong>{operatorName(row.operators)}</span>
                <span><strong>Fonte dichiarata</strong>{row.source_label?.trim() || "Non indicata"}</span>
              </div>
              <h3>{row.title}</h3>
              <p className="admin-events__date">{eventDate(row.starts_at)}</p>
              {row.description && <p className="admin-events__description">{row.description}</p>}
              <div className="admin-events__actions">
                <form method="post" action={`/api/admin/events/${row.id}/status`}>
                  <input type="hidden" name="action" value="approve" />
                  <button className="admin-events__approve" type="submit">Approva e pubblica</button>
                </form>
                <form method="post" action={`/api/admin/events/${row.id}/status`}>
                  <input type="hidden" name="action" value="reject" />
                  <button className="admin-events__reject" type="submit">Scarta</button>
                </form>
              </div>
            </article>)}</div>}
      </div>
    </section>
  </div>;
}
