import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [appsRes, opsRes, expsRes, revsRes, opRevsRes, itinsRes] = await Promise.all([
    db.from("operator_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    db.from("operators").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("experiences").select("id,published,review_status"),
    db.from("experience_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("operator_revisions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("itineraries").select("published"),
  ]);

  const pendingApps = appsRes.count ?? 0;
  const pendingRevs = revsRes.count ?? 0;
  const pendingProfileRevs = opRevsRes.count ?? 0;
  const exps = expsRes.data ?? [];
  const itins = itinsRes.data ?? [];
  const pendingExperiences = exps.filter((x: any) => x.review_status === "pending" || x.review_status === "submitted").length;
  const pendingOperatorArea = pendingRevs + pendingExperiences + pendingProfileRevs;
  const onlineOperators = opsRes.count ?? 0;
  const onlineExperiences = exps.filter((x: any) => x.published).length;

  const card = (href: string, title: string, n: number, text: string) => (
    <Link className="category" href={href} aria-label={`Apri ${title}`} style={{ display: "block", cursor: "pointer", position: "relative", border: n > 0 ? "2px solid #8f2f24" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
        <strong style={{ fontSize: 20 }}>{title}</strong>
        {n > 0 && <span style={{ display: "inline-flex", minWidth: 30, height: 30, padding: "0 8px", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#8f2f24", color: "white", fontWeight: 800 }}>{n}</span>}
      </div>
      <span style={{ display: "block", fontSize: 15, margin: "10px 0 7px" }}>{n > 0 ? `${n} elementi richiedono attenzione` : "Nessuna novità pendente"}</span>
      <small className="muted">{text}</small>
      <span style={{ display: "block", marginTop: 14, fontSize: 13, fontWeight: 800 }}>Apri sezione →</span>
    </Link>
  );

  const metric = (href: string, label: string, value: number, attention = false) => (
    <Link href={href} aria-label={`Apri ${label}`} style={{ display: "block", minWidth: 0, padding: "18px 16px", borderRadius: 18, background: attention && value > 0 ? "#fff7f4" : "rgba(255,255,255,.72)", border: attention && value > 0 ? "1px solid rgba(143,47,36,.35)" : "1px solid rgba(16,24,32,.08)", boxShadow: "0 8px 24px rgba(7,24,35,.04)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
      <strong style={{ display: "block", fontFamily: "Georgia,serif", fontSize: 32, lineHeight: 1, color: attention && value > 0 ? "#8f2f24" : "#0b2638", marginBottom: 7 }}>{value}</strong>
      <span style={{ fontSize: 13, lineHeight: 1.25, color: "#59636b", fontWeight: 700 }}>{label}</span>
    </Link>
  );

  return <>
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(34px,6vw,66px) 6vw", background: "radial-gradient(circle at 88% 8%,rgba(202,168,106,.20),transparent 30%),linear-gradient(135deg,#0b2638,#061624 64%,#02090f)", color: "#fff", borderBottom: "1px solid rgba(202,168,106,.28)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="kicker">Area privata · Amministrazione</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 500, fontSize: "clamp(38px,7vw,64px)", lineHeight: 1, letterSpacing: "-.02em", margin: "10px 0 12px", color: "#fff" }}>Dashboard BIMARIS</h1>
        <p style={{ maxWidth: 650, margin: 0, color: "#c8d1d6", fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.55 }}>Il centro operativo di BIMARIS. Le attività che richiedono attenzione sono raccolte qui.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}><Link className="button" href="/" style={{ padding: "11px 18px" }}>Apri il sito</Link><form method="post" action="/api/admin/logout"><button type="submit" style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid #caa86a", background: "#fff", color: "#17110d", fontWeight: 800, cursor: "pointer" }}>Esci</button></form></div>
      </div>
    </section>
    <section style={{ background: "var(--sand)", padding: "clamp(34px,6vw,64px) 6vw" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}><div className="kicker">Da gestire</div><h2 style={{ fontFamily: "Georgia,serif", fontWeight: 500, fontSize: "clamp(36px,6vw,54px)", margin: "7px 0 8px", lineHeight: 1 }}>Novità pendenti</h2><p style={{ maxWidth: 600, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>I contatori si aggiornano quando le relative pratiche vengono gestite.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 10 }}>{metric("/admin/candidature", "Candidature", pendingApps, true)}{metric("/admin/operatori", "Operatori / Esperienze", pendingOperatorArea, true)}{metric("/admin/operatori", "Operatori online", onlineOperators)}{metric("/admin/esperienze", "Esperienze online", onlineExperiences)}</div>
      </div>
    </section>
    <section className="section"><div className="section-head"><div><div className="kicker">Gestione</div><h2>Sezioni amministrative</h2></div><p>Il badge rosso indica che ci sono elementi da esaminare.</p></div><div className="category-grid">{card("/admin/candidature", "Candidature", pendingApps, "Nuove candidature e candidature ancora in valutazione.")}{card("/admin/operatori", "Operatori ed Esperienze", pendingOperatorArea, `${onlineOperators} operatori online · ${exps.length} esperienze. Include modifiche ai profili, nuove esperienze e revisioni da approvare.`)}{card("/admin/itinerari", "Itinerari", 0, `${itins.filter((x: any) => x.published).length} itinerari online su ${itins.length}.`)}</div></section>
  </>;
}
