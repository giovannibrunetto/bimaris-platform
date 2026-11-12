import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./experience-revision.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Content = { name?: string | null; excerpt?: string | null; description?: string | null; duration_minutes?: number | null; price_from?: number | null; meeting_point?: string | null; latitude?: number | null; longitude?: number | null; location_kind?: "venue" | "departure" | null; territory_id?: string | null; territory_municipality_code?: string | null };
type Photo = { storage_path: string; alt_text: string | null; sort_order: number; is_cover: boolean; source_media_id?: string | null; url?: string };
const publicMediaUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/experience-media/${path.split("/").map(encodeURIComponent).join("/")}`;
const changed = (a: unknown, b: unknown) => String(a ?? "") !== String(b ?? "");
const show = (v: unknown) => v === null || v === undefined || v === "" ? "—" : String(v);

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const { id } = await params;
  const db = createServiceClient();
  if (!db) throw new Error("Supabase service client non configurato");

  const { data: experience, error: experienceError } = await db.from("experiences").select("id,name,slug,published,operator_id,excerpt,description,duration_minutes,price_from,meeting_point,latitude,longitude,location_kind,territory_municipality_code").eq("id", id).maybeSingle();
  if (experienceError) { console.error("BIMARIS review experience lookup failed", experienceError); throw new Error("Impossibile caricare la scheda dell'esperienza."); }
  if (!experience) notFound();
  const { data: operator, error: operatorError } = await db.from("operators").select("name").eq("id", experience.operator_id).maybeSingle();
  if (operatorError) console.error("BIMARIS review operator lookup failed", operatorError);
  const { data: revision } = await db.from("experience_revisions").select("id,status,submitted_at,content").eq("experience_id", id).eq("status", "pending").order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  const [{ data: livePhotos }, { data: proposedRows }] = await Promise.all([
    db.from("experience_media").select("storage_path,alt_text,sort_order,is_cover").eq("experience_id", id).order("sort_order"),
    revision ? db.from("experience_revision_media").select("storage_path,alt_text,sort_order,is_cover,source_media_id").eq("revision_id", revision.id).order("sort_order") : Promise.resolve({ data: [] }),
  ]);
  const proposedPhotos: Photo[] = await Promise.all(((proposedRows ?? []) as Photo[]).map(async photo => {
    if (photo.source_media_id) return { ...photo, url: publicMediaUrl(photo.storage_path) };
    const { data, error } = await db.storage.from("experience-revision-media").createSignedUrl(photo.storage_path, 300);
    return { ...photo, url: error ? "" : (data?.signedUrl ?? "") };
  }));
  const next = (revision?.content ?? {}) as Content;
  const currentLabel=experience.published?"ONLINE ORA":"VERSIONE APPROVATA (NON PUBBLICATA)";
  const { state } = await searchParams;
  const stateMessage: Record<string, string> = { "approved-applied": "Modifica approvata e applicata.", "changes-requested": "Correzioni inviate all'operatore.", "review-note-required": "Indica almeno una correzione prima di rinviare la proposta.", "invalid-review-state": "La proposta non è più in attesa di revisione.", "invalid-source-state": "La versione pubblicata o l'operatore non sono più in uno stato compatibile con l'applicazione.", "action-error": "Operazione non riuscita." };

  return <><section style={{ background: "linear-gradient(135deg,#17120d,#080706)", color: "#fff", padding: "16px 6vw 18px" }}><div className="kicker" style={{ color: "#d8b778" }}>AREA PRIVATA · REVISIONE ESPERIENZA</div><h1 style={{ margin: "5px 0 10px", color: "#fff" }}>{experience.name}</h1><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="button" href={`/admin/esperienze/${id}`}>← Scheda esperienza</Link><Link className="button" href="/admin/revisioni-esperienze">Tutte le revisioni</Link></div></section><section style={{ padding: "20px 5vw 50px", background: "#f8f4ee" }}>
    {state && <div style={{ padding: 12, marginBottom: 14, background: "#fff", border: "1px solid #d7c7b6" }}>{stateMessage[state] ?? state}</div>}
    {!revision ? <div className="detail-panel"><h2>Nessuna revisione in attesa</h2><p>Per questa esperienza non risultano modifiche da esaminare.</p></div> : <article className="detail-panel" style={{ padding: "clamp(16px,4vw,24px)" }}><div className="kicker">{operator?.name ?? "Operatore"} · modifica proposta</div><h2 style={{ marginTop: 6 }}>Confronto versione approvata / proposta</h2><p><small>Revisione inviata {revision.submitted_at ? new Date(revision.submitted_at).toLocaleString("it-IT") : "dall'operatore"}</small></p>
      <div style={{ display: "grid", gap: 10, margin: "18px 0" }}>{[["Nome", experience.name, next.name], ["Testo breve", experience.excerpt, next.excerpt], ["Descrizione", experience.description, next.description], ["Durata", experience.duration_minutes, next.duration_minutes], ["Prezzo da", experience.price_from, next.price_from], ["Punto di incontro", experience.meeting_point, next.meeting_point], ["Tipologia punto", experience.location_kind, next.location_kind], ["Latitudine", experience.latitude, next.latitude], ["Longitudine", experience.longitude, next.longitude], ["Codice ISTAT comune", experience.territory_municipality_code, next.territory_municipality_code]].map(([label, before, after]) => <div key={String(label)} style={{ padding: 12, border: "1px solid rgba(0,0,0,.12)", borderRadius: 10 }}><strong>{String(label)} · {changed(before, after) ? "modificato" : "invariato"}</strong>{changed(before, after) && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 8 }}><div><small>{currentLabel}</small><p style={{ whiteSpace: "pre-wrap" }}>{show(before)}</p></div><div><small>PROPOSTA</small><p style={{ whiteSpace: "pre-wrap" }}>{show(after)}</p></div></div>}</div>)}</div>
      <section className="revision-gallery" aria-label="Confronto galleria fotografica">
        <div className="revision-section-heading">
          <h3>Confronto galleria fotografica</h3>
          <p>Controlla copertina, ordine e fotografie della versione approvata rispetto alla proposta.</p>
        </div>
        <div className="revision-gallery__comparison">
          {[{ title: currentLabel, photos: ((livePhotos ?? []) as Photo[]).map(p => ({...p,url:publicMediaUrl(p.storage_path)})) }, { title: "PROPOSTA OPERATORE", photos: proposedPhotos }].map(group =>
            <div className="revision-gallery__group" key={group.title}>
              <div className="revision-gallery__group-head"><strong>{group.title}</strong><span>{group.photos.length} foto</span></div>
              <div className="revision-gallery__photos">
                {group.photos.length===0&&<p>Nessuna fotografia.</p>}
                {group.photos.map((photo,i) =>
                  <figure key={photo.storage_path+`-${i}`} className="revision-gallery__photo">
                    {photo.url ? <img src={photo.url} alt={photo.alt_text ?? "Fotografia esperienza"} /> : <div className="revision-gallery__placeholder">Anteprima non disponibile</div>}
                    <figcaption>{photo.is_cover?"★ Copertina":"Foto"} · posizione {photo.sort_order+1}</figcaption>
                  </figure>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <section id="admin-review-decision" className="revision-decisions" aria-label="Esito revisione esperienza" style={{scrollMarginTop:112}}>
        <div className="revision-section-heading"><h3>Decisione sulla modifica proposta</h3><p>Scegli uno dei due esiti. L’approvazione applica la modifica alla versione approvata; la richiesta di correzioni la rinvia all’operatore.</p></div>
        <div className="revision-decisions__grid">
          <form method="post" action="/api/admin/experience-revisions" className="revision-decision-card">
            <h4>Approva la modifica</h4>
            <p>Applica le modifiche dopo averne verificato la correttezza.</p>
            <input type="hidden" name="revision_id" value={revision.id}/>
            <label htmlFor="revision-approval-note">Nota facoltativa</label>
            <textarea id="revision-approval-note" name="review_notes" rows={4} placeholder="Eventuali indicazioni sulla revisione approvata"/>
            <button className="revision-decision-card__button revision-decision-card__button--approve" name="action" value="approve-apply">Approva e applica</button>
          </form>
          <form method="post" action="/api/admin/experience-revisions" className="revision-decision-card">
            <h4>Richiedi correzioni</h4>
            <p>Specifica soltanto gli elementi che devono essere modificati prima di una nuova valutazione.</p>
            <input type="hidden" name="revision_id" value={revision.id}/>
            <div className="revision-decision-card__fields">
              <label htmlFor="revision-basics">Informazioni principali<textarea id="revision-basics" name="review_basics" rows={3} placeholder="Nome, frase di presentazione, informazioni generali"/></label>
              <label htmlFor="revision-description">Descrizione<textarea id="revision-description" name="review_description" rows={3} placeholder="Indica le modifiche richieste al testo"/></label>
              <label htmlFor="revision-details">Durata e prezzo<textarea id="revision-details" name="review_details" rows={3} placeholder="Eventuali correzioni a durata o prezzo"/></label>
              <label htmlFor="revision-general-note">Nota generale<textarea id="revision-general-note" name="review_notes" rows={3} placeholder="Altre indicazioni per l’operatore"/></label>
            </div>
            <button className="revision-decision-card__button revision-decision-card__button--changes" name="action" value="request-changes">Richiedi correzioni</button>
          </form>
        </div>
      </section>
    </article>}
  </section></>;
}
