import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./experience-revision.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Content = { name?: string | null; excerpt?: string | null; description?: string | null; duration_minutes?: number | null; price_from?: number | null; meeting_point?: string | null; latitude?: number | null; longitude?: number | null; location_kind?: "venue" | "departure" | null; territory_id?: string | null; territory_municipality_code?: string | null; interest_keys?: string[]; activity_keys?: string[] };
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
  const [{ data: livePhotos }, { data: proposedRows }, {data:liveInterests}, {data:liveActivities}, {data:livePartners}] = await Promise.all([
    db.from("experience_media").select("storage_path,alt_text,sort_order,is_cover").eq("experience_id", id).order("sort_order"),
    revision ? db.from("experience_revision_media").select("storage_path,alt_text,sort_order,is_cover,source_media_id").eq("revision_id", revision.id).order("sort_order") : Promise.resolve({ data: [] }),
    db.from("experience_discovery_intents").select("intent_key").eq("experience_id",id),
    db.from("experience_activity_links").select("activity_key").eq("experience_id",id).eq("operator_id",experience.operator_id),
    db.from("experience_operators").select("operator_id,activity_label,approval_status,operators(name)").eq("experience_id",id).eq("role","participant"),
  ]);
  const proposedPhotos: Photo[] = await Promise.all(((proposedRows ?? []) as Photo[]).map(async photo => {
    if (photo.source_media_id) return { ...photo, url: publicMediaUrl(photo.storage_path) };
    const { data, error } = await db.storage.from("experience-revision-media").createSignedUrl(photo.storage_path, 300);
    return { ...photo, url: error ? "" : (data?.signedUrl ?? "") };
  }));
  const next = (revision?.content ?? {}) as Content;
  const currentLabel=experience.published?"ONLINE ORA":"VERSIONE APPROVATA (NON PUBBLICATA)";
  const { state } = await searchParams;
  const stateMessage: Record<string, string> = { "approved-applied": "Modifica approvata e applicata.", "changes-requested": "Correzioni inviate all'operatore.", "review-note-required": "Indica almeno una correzione prima di rinviare la proposta.", "invalid-review-state": "La proposta non è più in attesa di revisione.", "invalid-source-state": "La revisione non può essere applicata: verifica lo stato di approvazione dell’esperienza e la disponibilità dell’operatore.", "action-error": "Operazione non riuscita.", "taxonomy-not-ready": "Approvazione bloccata: le modifiche agli interessi e alle attività richiedono il modulo database di applicazione atomica.", "collaboration-not-ready": "Approvazione bloccata: per cambiare il partner è necessario il consenso verificato e l’applicazione atomica della collaborazione." };

  const comparisonRows = ([["Nome", experience.name, next.name], ["Testo breve", experience.excerpt, next.excerpt], ["Descrizione", experience.description, next.description], ["Durata", experience.duration_minutes, next.duration_minutes], ["Prezzo da", experience.price_from, next.price_from], ["Punto di incontro", experience.meeting_point, next.meeting_point], ["Tipologia punto", experience.location_kind, next.location_kind], ["Latitudine", experience.latitude, next.latitude], ["Longitudine", experience.longitude, next.longitude], ["Codice ISTAT comune", experience.territory_municipality_code, next.territory_municipality_code]] as [string, unknown, unknown][]);
  const sorted=(values:string[])=>[...values].sort((a,b)=>a.localeCompare(b,"it"));
  const baselineInterests=sorted((liveInterests??[]).map(item=>item.intent_key));
  const baselineActivities=sorted((liveActivities??[]).map(item=>item.activity_key));
  const proposedInterests=sorted(Array.isArray(next.interest_keys)?next.interest_keys:baselineInterests);
  const proposedActivities=sorted(Array.isArray(next.activity_keys)?next.activity_keys:baselineActivities);
  const taxonomyRows: [string,string,string][]=[
    ["Interessi",baselineInterests.join(", ")||"—",proposedInterests.join(", ")||"—"],
    ["Attività collegate",baselineActivities.join(", ")||"—",proposedActivities.join(", ")||"—"],
  ];
  comparisonRows.push(...taxonomyRows);
  const modifiedRows = comparisonRows.filter(([, before, after]) => changed(before, after));

  const photoSignature = (photos: Photo[]) => JSON.stringify(photos.map(p => ({ storage_path:p.storage_path, alt_text:p.alt_text ?? null, sort_order:p.sort_order, is_cover:p.is_cover })));
  const photosChanged = photoSignature((livePhotos ?? []) as Photo[]) !== photoSignature((proposedRows ?? []) as Photo[]);

  return <><section className="revision-review-page">
    <header className="revision-review-page__header"><div><span className="revision-review-page__eyebrow">Revisione esperienza · {operator?.name ?? "Operatore"}</span><h2>{experience.name}</h2></div><nav aria-label="Navigazione revisione"><Link href={`/admin/esperienze/${id}`}>← Scheda esperienza</Link><Link href="/admin/operatori#pending-operators">Torna agli operatori</Link></nav></header>
    {state && <div role="status" style={{ maxWidth:1280, margin:"0 auto 16px", padding: 14, borderRadius:10, background: state==="approved-applied"||state==="changes-requested" ? "#edf7f1" : "#fff0ee", border: "1px solid #d7c7b6", color:"#173338" }}>{stateMessage[state] ?? "Esito non riconosciuto."}</div>}
    {!revision ? <div className="detail-panel"><h2>Nessuna revisione in attesa</h2><p>Per questa esperienza non risultano modifiche da esaminare.</p></div> : <article id="admin-review-comparison" className="detail-panel" style={{ padding: "clamp(16px,4vw,24px)", scrollMarginTop: 112 }}><div className="kicker">{operator?.name ?? "Operatore"} · modifica proposta</div><h2 style={{ marginTop: 6 }}>Confronto versione approvata / proposta</h2><p><Link href={`/admin/operatori/${experience.operator_id}`} className="text-link">Visualizza il dossier completo dell’operatore →</Link></p><p><small>Revisione inviata {revision.submitted_at ? new Date(revision.submitted_at).toLocaleString("it-IT") : "dall'operatore"}</small></p>
      <section className="revision-review-summary" aria-label="Modifiche da valutare">
        <h3>Modifiche da valutare <span className="revision-review-summary__count">{modifiedRows.length} {modifiedRows.length===1?"campo modificato":"campi modificati"}</span></h3>
        {modifiedRows.length===0&&<p>Nessuna differenza rilevata nei dati principali.{photosChanged ? " La proposta modifica le fotografie." : ""}</p>}
        <div className="revision-review-summary__rows">{modifiedRows.map(([label,before,after])=><div className="revision-review-summary__row" key={label}><h4>{label}</h4><div className="revision-review-summary__comparison"><div><small>{currentLabel}</small><p>{show(before)}</p></div><div><small>NUOVA PROPOSTA</small><p>{show(after)}</p></div></div></div>)}</div>

      </section>
      <section aria-label="Collaborazioni esistenti" className="revision-review-summary">
        <h3>Collaborazione collegata alla scheda originale</h3>
        {(livePartners??[]).length===0?<p>Nessun partner attualmente associato.</p>:<div>{(livePartners??[]).map((item,i)=>{
          const partner=item.operators as unknown as {name?:string}|{name?:string}[]|null;
          const name=Array.isArray(partner)?partner[0]?.name:partner?.name;
          return <p key={item.operator_id+i}><strong>{name??item.operator_id}</strong> — {item.activity_label||"Attività non specificata"} · {item.approval_status==="accepted"?"Confermata":item.approval_status==="pending"?"In attesa di consenso":"Rifiutata"}</p>;
        })}</div>}
        <p><small>La proposta attuale non cambia i partner: una nuova collaborazione necessita di accettazione autonoma prima della pubblicazione.</small></p>
      </section>
      {photosChanged && <details className="revision-gallery revision-review-summary__gallery"><summary>Confronto galleria fotografica — apri per verificare copertina e immagini</summary>
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
      </details>}
      <section id="admin-review-decision" className="revision-decisions" aria-label="Esito revisione esperienza" style={{scrollMarginTop:112}}>
        <div className="revision-section-heading"><h3>Decisione sulla modifica proposta</h3><p>L’approvazione applica le modifiche senza pubblicare automaticamente l’esperienza.</p></div>
        <div className="revision-review-actions revision-review-actions--compact">
          <form method="post" action="/api/admin/experience-revisions" className="revision-review-actions__simple-form">
            <input type="hidden" name="revision_id" value={revision.id}/>
            <button type="submit" className="revision-decision-card__button revision-decision-card__button--approve" name="action" value="approve-apply">Approva e invia</button>
          </form>
          <details className="revision-review-actions__changes revision-review-actions__changes--compact"><summary>Richiedi modifica</summary>
            <form method="post" action="/api/admin/experience-revisions" className="revision-decision-card">
              <p>Indica all’operatore cosa correggere prima di una nuova valutazione.</p>
              <input type="hidden" name="revision_id" value={revision.id}/>
              <label htmlFor="revision-general-note">Modifica richiesta<textarea id="revision-general-note" name="review_notes" rows={4} required placeholder="Descrivi la modifica da richiedere all’operatore"/></label>
              <button type="submit" className="revision-decision-card__button revision-decision-card__button--changes" name="action" value="request-changes">Invia richiesta</button>
            </form>
          </details>
        </div>
      </section>
    </article>}
  </section></>;
}
