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

  const metrics=[
    {href:"/admin/candidature",label:"Candidature da gestire",value:pendingApps,attention:true},
    {href:"/admin/operatori",label:"Operatori / Esperienze da gestire",value:pendingOperatorArea,attention:true},
    {href:"/admin/eventi",label:"Eventi da verificare",value:pendingEvents,attention:true},
    {href:"/admin/operatori",label:"Operatori online",value:onlineOperators,attention:false},
    {href:"/admin/esperienze",label:"Esperienze online",value:onlineExperiences,attention:false},
    {href:"/admin/itinerari",label:"Itinerari online",value:onlineItineraries,attention:false},
  ];

  return <div className="admin-dashboard">
    <section className="admin-dashboard__intro" aria-labelledby="admin-dashboard-title">
      <div className="admin-dashboard__container">
        <span className="admin-dashboard__eyebrow">Area privata · Amministrazione</span>
        <div className="admin-dashboard__intro-layout">
          <div>
            <h1 id="admin-dashboard-title">Dashboard BIMARIS</h1>
            <p>Il centro operativo della piattaforma. Qui trovi le attività da esaminare e gli indicatori principali.</p>
          </div>
          <div className="admin-dashboard__intro-actions">
            <Link className="admin-dashboard__site-link" href="/">Apri il sito</Link>
            <form method="post" action="/api/admin/logout"><button type="submit">Esci</button></form>
          </div>
        </div>
      </div>
    </section>
    <section className="admin-dashboard__overview" aria-labelledby="admin-dashboard-overview-title">
      <div className="admin-dashboard__container">
        <div className="admin-dashboard__section-head">
          <span className="admin-dashboard__eyebrow">Quadro operativo</span>
          <h2 id="admin-dashboard-overview-title">Gestione BIMARIS</h2>
          <p>Le attività in attesa di intervento sono evidenziate. Ogni riquadro apre la relativa sezione amministrativa.</p>
        </div>
        <div className="admin-dashboard__metrics">
          {metrics.map(m=><Link key={m.label} href={m.href} className={`admin-dashboard__metric${m.attention&&m.value>0?" admin-dashboard__metric--attention":""}`} aria-label={`Apri ${m.label}`}>
            <strong>{m.value}</strong><span>{m.label}</span>
            {m.attention&&m.value>0&&<small>Da esaminare</small>}
          </Link>)}
        </div>
        <nav className="admin-dashboard__quicklinks" aria-label="Accesso rapido alla gestione">
          <Link href="/admin/candidature">Candidature</Link>
          <Link href="/admin/operatori">Operatori ed Esperienze</Link>
          <Link href="/admin/eventi">Eventi</Link>
          <Link href="/admin/itinerari">Itinerari</Link>
        </nav>
      </div>
    </section>
  </div>;

}
