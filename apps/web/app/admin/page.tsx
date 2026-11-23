import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./admin-dashboard.css";
import {isReadyExperience} from "./ready-to-publish";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [appsRes, opsRes, pendingExpsRes, onlineExpsRes, revsRes, opRevsRes, eventsRes, approvedEventsRes, allEventsRes, approvedExperiencesRes] = await Promise.all([
    db.from("operator_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    db.from("operators").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experiences").select("id", { count: "exact", head: true }).neq("experience_origin","bimaris").in("review_status", ["pending", "submitted"]),
    db.from("experiences").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experience_revisions").select("id,experience_id,experiences!inner(experience_origin)", { count: "exact" }).eq("status", "pending").neq("experiences.experience_origin", "bimaris"),
    db.from("operator_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("events").select("id", { count: "exact", head: true }).eq("verification_status", "pending").eq("published", false),
    db.from("events").select("id", { count: "exact", head: true }).eq("verification_status", "verified").eq("published", false),
    db.from("events").select("id", { count: "exact", head: true }),
    db.from("experiences").select("id,experience_origin,operator:operators!experiences_operator_id_fkey(published)").eq("review_status","approved").eq("published",false),
  ]);

  if ([appsRes,opsRes,pendingExpsRes,onlineExpsRes,revsRes,opRevsRes,eventsRes,approvedEventsRes,allEventsRes,approvedExperiencesRes].some(result => result.error)) {
    throw new Error("Impossibile caricare i contatori della dashboard amministrativa");
  }

  const pendingApps = appsRes.count ?? 0;
  const pendingRevs = revsRes.count ?? 0;
  const pendingProfileRevs = opRevsRes.count ?? 0;
  const pendingEvents = eventsRes.count ?? 0;
  const eventsToPublish = approvedEventsRes.count ?? 0;
  const pendingRevisionIds=new Set((revsRes.data??[]).map(revision=>revision.experience_id));
  const experiencesToPublish=(approvedExperiencesRes.data??[]).filter(item=>isReadyExperience({id:item.id,review_status:"approved",published:false,experience_origin:item.experience_origin,operator:item.operator as {published:boolean}|{published:boolean}[]|null},pendingRevisionIds)).length;
  const readyToPublish=eventsToPublish+experiencesToPublish;
  const pendingExperiences = pendingExpsRes.count ?? 0;
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
    {href:"/admin/attivita?view=ready",label:"Attività pronte da pubblicare",description:readyToPublish>0?`${experiencesToPublish} esperienze · ${eventsToPublish} appuntamenti`:"Nessuna attività pronta",value:readyToPublish},
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
              <Link href="/admin/archivio-editoriale">Archivio editoriale</Link>
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
        </div>
      </div>
    </section>
  </div>;
}
