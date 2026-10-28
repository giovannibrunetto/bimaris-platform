import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Content = { name?: string | null; excerpt?: string | null; description?: string | null; duration_minutes?: number | null; price_from?: number | null };
type Photo = { storage_path: string; alt_text: string | null; sort_order: number; is_cover: boolean };
const mediaUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/experience-media/${path.split("/").map(encodeURIComponent).join("/")}`;
const changed = (a: unknown, b: unknown) => String(a ?? "") !== String(b ?? "");
const show = (v: unknown) => v === null || v === undefined || v === "" ? "—" : String(v);

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; state?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id, state } = await searchParams;
  if (!id) notFound();
  const db = createServiceClient();
  if (!db) throw new Error("Supabase service client non configurato");

  const { data: experience } = await db.from("experiences").select("id,name,slug,excerpt,description,duration_minutes,price_from,operator_id").eq("id", id).maybeSingle();
  if (!experience) notFound();
  const [{ data: operator }, { data: revision }] = await Promise.all([
    db.from("operators").select("name").eq("id", experience.operator_id).maybeSingle(),
    db.from("experience_revisions").select("id,status,submitted_at,content").eq("experience_id", id).eq("status", "pending").order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const [{ data: livePhotos }, { data: proposedPhotos }] = await Promise.all([
    db.from("experience_media").select("storage_path,alt_text,sort_order,is_cover").eq("experience_id", id).order("sort_order"),
    revision ? db.from("experience_revision_media").select("storage_path,alt_text,sort_order,is_cover").eq("revision_id", revision.id).order("sort_order") : Promise.resolve({ data: [] }),
  ]);
  const next = (revision?.content ?? {}) as Content;
  const stateMessage: Record<string, string> = { "approved-applied": "Modifica approvata e applicata.", "changes-requested": "Correzioni inviate all'operatore.", "review-note-required": "Indica almeno una correzione prima di rinviare la proposta.", "invalid-review-state": "La proposta non è più in attesa di revisione.", "invalid-source-state": "La versione pubblicata o l'operatore non sono più in uno stato compatibile con l'applicazione.", "action-error": "Operazione non riuscita." };

  return <><section style={{ background: "linear-gradient(135deg,#17120d,#080706)", color: "#fff", padding: "16px 6vw 18px" }}><div className="kicker" style={{ color: "#d8b778" }}>AREA PRIVATA · REVISIONE ESPERIENZA</div><h1 style={{ margin: "5px 0 10px", color: "#fff" }}>{experience.name}</h1><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="button" href={`/admin/esperienze/${id}`}>← Scheda esperienza</Link><Link className="button" href="/admin/operatori">Operatori ed Esperienze</Link></div></section><section style={{ padding: "20px 5vw 50px", background: "#f8f4ee" }}>
    {state && <div style={{ padding: 12, marginBottom: 14, background: "#fff", border: "1px solid #d7c7b6" }}>{stateMessage[state] ?? state}</div>}
    {!revision ? <div className="detail-panel"><h2>Nessuna revisione in attesa</h2><p>Per questa esperienza non risultano modifiche da esaminare.</p></div> : <article className="detail-panel" style={{ padding: "clamp(16px,4vw,24px)" }}><div className="kicker">{operator?.name ?? "Operatore"} · modifica proposta</div><h2 style={{ marginTop: 6 }}>Confronto versione pubblicata / proposta</h2><p><small>Revisione inviata {revision.submitted_at ? new Date(revision.submitted_at).toLocaleString("it-IT") : "dall'operatore"}</small></p>
      <div style={{ display: "grid", gap: 10, margin: "18px 0" }}>{[["Nome", experience.name, next.name], ["Testo breve", experience.excerpt, next.excerpt], ["Descrizione", experience.description, next.description], ["Durata", experience.duration_minutes, next.duration_minutes], ["Prezzo da", experience.price_from, next.price_from]].map(([label, before, after]) => <div key={String(label)} style={{ padding: 12, border: "1px solid rgba(0,0,0,.12)", borderRadius: 10 }}><strong>{String(label)} · {changed(before, after) ? "modificato" : "invariato"}</strong>{changed(before, after) && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 8 }}><div><small>ONLINE ORA</small><p style={{ whiteSpace: "pre-wrap" }}>{show(before)}</p></div><div><small>PROPOSTA</small><p style={{ whiteSpace: "pre-wrap" }}>{show(after)}</p></div></div>}</div>)}</div>
      <h3>Confronto galleria fotografica</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>{[{ title: "ONLINE ORA", photos: (livePhotos ?? []) as Photo[] }, { title: "PROPOSTA OPERATORE", photos: (proposedPhotos ?? []) as Photo[] }].map(group => <div key={group.title}><strong>{group.title} · {group.photos.length} foto</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 8 }}>{group.photos.map(photo => <figure key={photo.storage_path} style={{ margin: 0 }}><img src={mediaUrl(photo.storage_path)} alt={photo.alt_text ?? "Fotografia esperienza"} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }} /><figcaption style={{ fontSize: 11 }}>{photo.is_cover ? "★ Copertina" : "Foto"} · posizione {photo.sort_order + 1}</figcaption></figure>)}</div></div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 24 }}><form method="post" action="/api/admin/experience-revisions" className="form" style={{ padding: 0 }}><input type="hidden" name="revision_id" value={revision.id}/><label className="wide">Nota facoltativa<textarea name="review_notes" /></label><button className="button" name="action" value="approve-apply">Approva e applica</button></form><form method="post" action="/api/admin/experience-revisions" className="form" style={{ padding: 0 }}><input type="hidden" name="revision_id" value={revision.id}/><label className="wide">Informazioni principali<textarea name="review_basics" /></label><label className="wide">Descrizione<textarea name="review_description" /></label><label className="wide">Durata e prezzo<textarea name="review_details" /></label><label className="wide">Nota generale<textarea name="review_notes" /></label><button className="button ghost" name="action" value="request-changes">Richiedi correzioni</button></form></div>
    </article>}
  </section></>;
}
