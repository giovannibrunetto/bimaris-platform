import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./admin-dashboard.css";
import { loadPendingPublicationRevisions, loadReadyPublicationCounts } from "./ready-publication-counts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [appsRes, opsRes, pendingExpsRes, onlineExpsRes, revsRes, opRevsRes, eventsRes, allEventsRes, publicationCounts] = await Promise.all([
    db.from("operator_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    db.from("operators").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experiences").select("id").neq("experience_origin","bimaris").in("review_status", ["pending", "submitted"]).eq("published",false),
    db.from("experiences").select("id", { count: "exact", head: true }).eq("published", true),
    loadPendingPublicationRevisions(),
    db.from("operator_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("events").select("id", { count: "exact", head: true }).eq("verification_status", "pending").eq("published", false),
    db.from("events").select("id", { count: "exact", head: true }),
    loadReadyPublicationCounts(),
  ]);

  if ([appsRes,opsRes,pendingExpsRes,onlineExpsRes,revsRes,opRevsRes,eventsRes,allEventsRes].some(result => result.error)) {
    throw new Error("Impossibile caricare i contatori della dashboard amministrativa");
  }

  const pendingApps = appsRes.count ?? 0;
  const pendingRevs = revsRes.count ?? 0;
  const pendingProfileRevs = opRevsRes.count ?? 0;
  const pendingEvents = eventsRes.count ?? 0;
  const { eventsToPublish, experiencesToPublish, editorialToPublish, readyToPublish } = publicationCounts;
  const pendingRevisionIds=new Set((revsRes.data??[]).map(revision=>revision.experience_id));
  const pendingExperiences = (pendingExpsRes.data??[]).filter(item=>!pendingRevisionIds.has(item.id)).length;
  const pendingOperatorArea = pendingRevs + pendingExperiences + pendingProfileRevs;
  const onlineOperators = opsRes.count ?? 0;
  const onlineExperiences = onlineExpsRes.count ?? 0;
  const acquiredAppointments = allEventsRes.count ?? 0;

  const reviewBreakdown = [
    { count: pendingApps, singular: "candidatura", plural: "candidature" },
    { count: pendingProfileRevs, singular: "modifica al profilo", plural: "modifiche ai profili" },
    { count: pendingExperiences + pendingRevs, singular: "esperienza", plural: "esperienze" },
    { count: pendingEvents, singular: "appuntamento MAI", plural: "appuntamenti MAI" },
  ].filter(item => item.count > 0).map(item => `${item.count} ${item.count === 1 ? item.singular : item.plural}`).join(" · ");
  const workItems = [
    {href:"/admin/contenuti",label:"Contenuti da esaminare",description:reviewBreakdown || "Nessuna pratica in attesa",value:pendingApps+pendingOperatorArea+pendingEvents},
    {href:"/admin/attivita?view=ready",label:"Contenuti pronti da pubblicare",description:readyToPublish>0?`${experiencesToPublish} esperienze · ${eventsToPublish} appuntamenti · ${editorialToPublish} editoriali`:"Nessun contenuto pronto",value:readyToPublish},
  ];
  const statusItems = [
    { href: "/admin/operatori", label: "Operatori online", value: onlineOperators },
    { href: "/admin/attivita?tipo=esperienze", label: "Esperienze online", value: onlineExperiences },
    { href: "/admin/attivita?view=acquisiti", label: "Appuntamenti acquisiti", value: acquiredAppointments },
  ];

  return <div className="admin-dashboard">
    <section className="admin-dashboard__overview" aria-label="Riepilogo amministrativo">
      <div className="admin-dashboard__container">
        <div className="admin-dashboard__workspace">
          <section className="admin-dashboard__workpanel" aria-labelledby="admin-work-heading">
            <div className="admin-dashboard__panel-heading">
              <h2 id="admin-work-heading">Azioni richieste</h2>
            </div>
            <div className="admin-dashboard__tasklist">
              {workItems.map(item => <Link key={item.href} href={item.href} className="admin-dashboard__task">
                <span className="admin-dashboard__task-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className={`admin-dashboard__task-count${item.value > 0 ? " admin-dashboard__task-count--pending" : ""}`}>{item.value}</span>
                <span className="admin-dashboard__task-arrow" aria-hidden="true">→</span>
              </Link>)}
            </div>
          </section>

          <section className="admin-dashboard__sidepanel" aria-labelledby="admin-status-heading">
            <div className="admin-dashboard__panel-heading">
              <h2 id="admin-status-heading">Stato della piattaforma</h2>
            </div>
            <ul className="admin-dashboard__live-list">
              {statusItems.map(item => <li key={item.label}>
                <Link href={item.href} className="admin-dashboard__live-item">
                  <strong>{item.value}</strong><span>{item.label}</span><span aria-hidden="true">→</span>
                </Link>
              </li>)}
            </ul>
          </section>
          <section className="admin-dashboard__workpanel" aria-labelledby="admin-editorial-heading" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-dashboard__panel-heading">
              <h2 id="admin-editorial-heading">Archivio editoriale</h2>
            </div>
            <Link href="/admin/archivio-editoriale" className="admin-dashboard__task" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
              <span className="admin-dashboard__task-copy">
                <strong>Gestisci le schede Cultura</strong>
                <small>Bozze, anteprime e pubblicazione</small>
              </span>
              <span className="admin-dashboard__task-arrow" aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </div>
    </section>
  </div>;
}
