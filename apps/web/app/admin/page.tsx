import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import "./admin-dashboard.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [appsRes, opsRes, pendingExpsRes, onlineExpsRes, revsRes, opRevsRes, onlineItinsRes, eventsRes] = await Promise.all([
    db.from("operator_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    db.from("operators").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experiences").select("id", { count: "exact", head: true }).in("review_status", ["pending", "submitted"]),
    db.from("experiences").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experience_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("operator_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("itineraries").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("events").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
  ]);

  const pendingApps = appsRes.count ?? 0;
  const pendingRevs = revsRes.count ?? 0;
  const pendingProfileRevs = opRevsRes.count ?? 0;
  const pendingEvents = eventsRes.count ?? 0;
  const pendingExperiences = pendingExpsRes.count ?? 0;
  const pendingOperatorArea = pendingRevs + pendingExperiences + pendingProfileRevs;
  const onlineOperators = opsRes.count ?? 0;
  const onlineExperiences = onlineExpsRes.count ?? 0;
  const onlineItineraries = onlineItinsRes.count ?? 0;

  const pendingTotal=pendingApps+pendingOperatorArea+pendingEvents;
  const workItems=[
    {href:"/admin/operatori#pending-operators",label:"Operatori ed esperienze",description:"Proposte, modifiche e profili in attesa di valutazione",value:pendingOperatorArea},
    {href:"/admin/eventi#pending-events",label:"Eventi da verificare",description:"Controlli editoriali e validazione degli eventi",value:pendingEvents},
    {href:"/admin/candidature?filter=pending#pending-candidatures",label:"Candidature",description:"Nuove richieste di accesso alla rete BIMARIS",value:pendingApps},
  ];
  const liveItems=[
    {href:"/admin/operatori",label:"Operatori online",value:onlineOperators},
    {href:"/admin/esperienze",label:"Esperienze online",value:onlineExperiences},
    {href:"/admin/itinerari",label:"Itinerari online",value:onlineItineraries},
  ];

  return <div className="admin-dashboard">
    <section className="admin-dashboard__intro" aria-labelledby="admin-dashboard-title">
      <div className="admin-dashboard__container admin-dashboard__intro-layout">
        <div className="admin-dashboard__intro-copy">
          <span className="admin-dashboard__eyebrow">BIMARIS / Pannello di controllo</span>
          <h1 id="admin-dashboard-title">Centro operativo</h1>
          <p>Attività da esaminare, stato della piattaforma e accesso agli strumenti di gestione.</p>
        </div>
        <div className="admin-dashboard__intro-actions">
          <Link className="admin-dashboard__site-link" href="/">Apri il sito</Link>
          <form method="post" action="/api/admin/logout"><button type="submit">Esci</button></form>
        </div>
      </div>
    </section>

    <section className="admin-dashboard__overview" aria-label="Riepilogo amministrativo">
      <div className="admin-dashboard__container">
        <div className="admin-dashboard__summary">
          <div className="admin-dashboard__summary-copy">
            <span className="admin-dashboard__eyebrow">Riepilogo operativo</span>
            <h2>Le priorità di oggi</h2>
            <p>{pendingTotal===0?"Nessuna attività attualmente in attesa nei tre ambiti monitorati.":"Attività in attesa di valutazione nei tre ambiti monitorati."}</p>
          </div>
          <div className="admin-dashboard__total" aria-label={`${pendingTotal} attività in attesa`}>
            <strong>{pendingTotal}</strong>
            <span>Da gestire</span>
          </div>
        </div>

        <div className="admin-dashboard__workspace">
          <section className="admin-dashboard__workpanel" aria-labelledby="admin-work-heading">
            <div className="admin-dashboard__panel-heading">
              <div><span className="admin-dashboard__overline">01 / Azioni richieste</span><h3 id="admin-work-heading">In attesa di intervento</h3></div>
              <span className="admin-dashboard__count-label">{pendingTotal} attività in attesa</span>
            </div>
            <div className="admin-dashboard__tasklist">
              {workItems.map((item,i)=><Link key={item.href} href={item.href} className="admin-dashboard__task">
                <span className="admin-dashboard__task-index">{String(i+1).padStart(2,"0")}</span>
                <span className="admin-dashboard__task-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                <span className={`admin-dashboard__task-count${item.value>0?" admin-dashboard__task-count--pending":""}`}>{item.value}</span>
                <span className="admin-dashboard__task-arrow" aria-hidden="true">→</span>
              </Link>)}
            </div>
            <p className="admin-dashboard__panel-footnote">I conteggi indicano elementi in attesa, non il numero di operatori complessivi.</p>
          </section>

          <aside className="admin-dashboard__sidepanel" aria-labelledby="admin-status-heading">
            <div className="admin-dashboard__panel-heading"><div><span className="admin-dashboard__overline">02 / Stato piattaforma</span><h3 id="admin-status-heading">Contenuti online</h3></div></div>
            <div className="admin-dashboard__live-list">
              {liveItems.map(item=><Link key={item.label} href={item.href} className="admin-dashboard__live-item">
                <strong>{item.value}</strong><span>{item.label}</span><span aria-hidden="true">↗</span>
              </Link>)}
            </div>
          </aside>
        </div>

      </div>
    </section>
  </div>;

}
