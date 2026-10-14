import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Application = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  category: string | null;
  location: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  description: string;
  status: string;
  review_notes: string | null;
  operator_id: string | null;
  created_at: string;
};

type Operator = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  address: string | null;
  published: boolean;
  selection_status: string;
  created_at: string;
};

type AnalyticsSummary = {
  period_days: number;
  page_views: number;
  visitors: number;
  sessions: number;
  application_starts: number;
  application_submits: number;
  previous_page_views: number;
  previous_visitors: number;
  top_pages: Array<{ path: string; views: number }>;
  events: Array<{ event: string; count: number }>;
  daily: Array<{ date: string; views: number; visitors: number }>;
  referrers: Array<{ referrer: string; count: number }>;
};

const emptyAnalytics: AnalyticsSummary = {
  period_days: 30,
  page_views: 0,
  visitors: 0,
  sessions: 0,
  application_starts: 0,
  application_submits: 0,
  previous_page_views: 0,
  previous_visitors: 0,
  top_pages: [],
  events: [],
  daily: [],
  referrers: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(value));
}

function delta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function statusLabel(value: string) {
  return ({ new: "Nuova", reviewing: "In valutazione", accepted: "Accettata", rejected: "Rifiutata" } as Record<string, string>)[value] ?? value;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client non configurato");

  const [{ data: applicationsData }, { data: operatorsData }, { data: analyticsData }] = await Promise.all([
    supabase
      .from("operator_applications")
      .select("id,business_name,contact_name,email,phone,whatsapp,category,location,address,website,instagram,description,status,review_notes,operator_id,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("operators")
      .select("id,slug,name,category,address,published,selection_status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("admin_analytics_summary", { p_days: 30 }),
  ]);

  const applications = (applicationsData ?? []) as Application[];
  const operators = (operatorsData ?? []) as Operator[];
  const analytics = (analyticsData ?? emptyAnalytics) as AnalyticsSummary;
  const { state } = await searchParams;

  const counts = applications.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const maxDailyViews = Math.max(1, ...analytics.daily.map(item => Number(item.views) || 0));
  const conversion = analytics.application_starts > 0
    ? (analytics.application_submits / analytics.application_starts) * 100
    : 0;

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Area privata</div>
        <h1>Dashboard BIMARIS</h1>
        <p>Gestione candidature, operatori selezionati e andamento del sito in un unico pannello.</p>
        <div className="actions">
          <Link className="button" href="/">Apri il sito</Link>
          <form method="post" action="/api/admin/logout">
            <button className="button secondary" type="submit">Esci</button>
          </form>
        </div>
      </section>

      {state && (
        <section style={{ padding: "22px 6vw 0" }}>
          <div className="detail-panel" style={{ padding: 16 }}>
            Operazione completata: <strong>{state}</strong>.
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Analytics · ultimi 30 giorni</div>
            <h2>Come viene usato BIMARIS</h2>
          </div>
          <p>I dati vengono registrati solo quando l'utente accetta i cookie analytics. Le visite dell'area <code>/admin</code> sono escluse.</p>
        </div>

        <div className="dashboard">
          <div className="metric"><span>Visualizzazioni pagina</span><strong>{analytics.page_views}</strong><small className="muted">{delta(analytics.page_views, analytics.previous_page_views)} sul periodo precedente</small></div>
          <div className="metric"><span>Visitatori</span><strong>{analytics.visitors}</strong><small className="muted">{delta(analytics.visitors, analytics.previous_visitors)} sul periodo precedente</small></div>
          <div className="metric"><span>Sessioni</span><strong>{analytics.sessions}</strong><small className="muted">sessioni con consenso analytics</small></div>
          <div className="metric"><span>Conversione candidature</span><strong>{conversion.toFixed(1)}%</strong><small className="muted">{analytics.application_submits} invii su {analytics.application_starts} avvii</small></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(280px,.6fr)", gap: 22, marginTop: 28 }}>
          <div className="detail-panel">
            <h3>Andamento giornaliero</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {analytics.daily.length > 0 ? analytics.daily.map(item => (
                <div key={item.date} style={{ display: "grid", gridTemplateColumns: "92px 1fr 70px", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(item.date))}</span>
                  <div style={{ height: 10, borderRadius: 99, background: "#edf0f2", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(2, (Number(item.views) / maxDailyViews) * 100)}%`, background: "#caa86a", borderRadius: 99 }} />
                  </div>
                  <strong style={{ fontSize: 13 }}>{item.views} visite</strong>
                </div>
              )) : <p className="muted">Nessun dato nel periodo.</p>}
            </div>
          </div>

          <div className="detail-panel">
            <h3>Pagine più viste</h3>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {analytics.top_pages.map(item => <li key={item.path} style={{ padding: "7px 0" }}><code>{item.path}</code> · <strong>{item.views}</strong></li>)}
            </ol>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
          <div className="detail-panel">
            <h3>Interazioni registrate</h3>
            <table className="table">
              <thead><tr><th>Evento</th><th>Totale</th></tr></thead>
              <tbody>{analytics.events.map(item => <tr key={item.event}><td>{item.event}</td><td>{item.count}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="detail-panel">
            <h3>Principali provenienze</h3>
            {analytics.referrers.length > 0 ? (
              <table className="table">
                <thead><tr><th>Referrer</th><th>Visite</th></tr></thead>
                <tbody>{analytics.referrers.map(item => <tr key={item.referrer}><td style={{ maxWidth: 380, overflowWrap: "anywhere" }}>{item.referrer}</td><td>{item.count}</td></tr>)}</tbody>
              </table>
            ) : <p className="muted">Nessun referrer disponibile nel periodo.</p>}
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Candidature</div>
            <h2>Valutazione operatori</h2>
          </div>
          <p>Nuove: {counts.new ?? 0} · In valutazione: {counts.reviewing ?? 0} · Accettate: {counts.accepted ?? 0} · Rifiutate: {counts.rejected ?? 0}</p>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {applications.length > 0 ? applications.map(application => (
            <article className="detail-panel" key={application.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div className="eyebrow">{application.category ?? "Categoria non indicata"} · {statusLabel(application.status)}</div>
                  <h3 style={{ marginBottom: 6 }}>{application.business_name}</h3>
                  <div className="muted">{application.location ?? "Località non indicata"} · ricevuta {formatDate(application.created_at)}</div>
                </div>
                {application.operator_id && <Link className="text-link" href={`/operatori/${operators.find(item => item.id === application.operator_id)?.slug ?? ""}`}>Scheda operatore →</Link>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, marginTop: 18 }}>
                <div><strong>Referente</strong><br />{application.contact_name}</div>
                <div><strong>Email</strong><br /><a href={`mailto:${application.email}`}>{application.email}</a></div>
                <div><strong>Telefono</strong><br />{application.phone ?? "—"}</div>
                <div><strong>WhatsApp</strong><br />{application.whatsapp ?? "—"}</div>
                <div><strong>Indirizzo</strong><br />{application.address ?? application.location ?? "—"}</div>
                <div><strong>Sito / Instagram</strong><br />{application.website ?? application.instagram ?? "—"}</div>
              </div>

              <p style={{ lineHeight: 1.65, marginTop: 18 }}>{application.description}</p>

              {(application.status === "new" || application.status === "reviewing") && (
                <form method="post" action="/api/admin/applications" style={{ display: "grid", gap: 12, marginTop: 18 }}>
                  <input type="hidden" name="application_id" value={application.id} />
                  <input type="hidden" name="business_name" value={application.business_name} />
                  <label>
                    Slug della scheda
                    <input name="slug" defaultValue={application.business_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")} />
                  </label>
                  <label>
                    Note / perché BIMARIS la seleziona
                    <textarea name="notes" defaultValue={application.review_notes ?? ""} style={{ width: "100%", minHeight: 90, border: "1px solid #cfd6db", borderRadius: 12, padding: 12 }} />
                  </label>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <button className="button ghost" name="action" value="reviewing" type="submit">In valutazione</button>
                    <button className="button" name="action" value="accept" type="submit">Approva</button>
                    <button className="button" name="action" value="accept_publish" type="submit">Approva e pubblica</button>
                    <button className="button ghost" name="action" value="reject" type="submit">Rifiuta</button>
                  </div>
                </form>
              )}
            </article>
          )) : <div className="detail-panel"><p>Nessuna candidatura presente.</p></div>}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Catalogo</div>
            <h2>Operatori creati</h2>
          </div>
          <p>{operators.filter(item => item.published).length} pubblicati su {operators.length} operatori presenti.</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Operatore</th><th>Categoria</th><th>Stato</th><th>Pubblicazione</th><th>Azioni</th></tr></thead>
            <tbody>
              {operators.map(operator => (
                <tr key={operator.id}>
                  <td><strong>{operator.name}</strong><br /><code>{operator.slug}</code></td>
                  <td>{operator.category ?? "—"}</td>
                  <td>{operator.selection_status}</td>
                  <td>{operator.published ? "Online" : "Non pubblicato"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {operator.published && <Link className="text-link" href={`/operatori/${operator.slug}`}>Apri</Link>}
                      <form method="post" action="/api/admin/applications">
                        <input type="hidden" name="operator_id" value={operator.id} />
                        <button className="button ghost" name="action" value={operator.published ? "unpublish_operator" : "publish_operator"} type="submit">
                          {operator.published ? "Nascondi" : "Pubblica"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
