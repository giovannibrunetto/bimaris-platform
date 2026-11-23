import { experienceRevisionBlocker } from "@/lib/experience-revision-blocker";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import "./experience-revision.css";
import { experienceFieldComparison } from "@/lib/experience-review-fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Content = { name?: string | null; excerpt?: string | null; description?: string | null; duration_minutes?: number | null; price_from?: number | null; meeting_point?: string | null; latitude?: number | null; longitude?: number | null; location_kind?: "venue" | "departure" | null; territory_id?: string | null; territory_municipality_code?: string | null };
type Photo = { id?: string; storage_path: string; alt_text: string | null; sort_order: number; is_cover: boolean; source_media_id?: string | null; url?: string };
const publicMediaUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/experience-media/${path.split("/").map(encodeURIComponent).join("/")}`;
const show = (v: unknown) => v === null || v === undefined || v === "" ? "—" : String(v);

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const { id } = await params;
  const db = createServiceClient();
  if (!db) throw new Error("Supabase service client non configurato");

  const { data: experience, error: experienceError } = await db.from("experiences").select("id,name,slug,published,review_status,operator_id,excerpt,description,duration_minutes,price_from,meeting_point,latitude,longitude,location_kind,territory_municipality_code").eq("id", id).maybeSingle();
  if (experienceError) { console.error("BIMARIS review experience lookup failed", experienceError); throw new Error("Impossibile caricare la scheda dell'esperienza."); }
  if (!experience) notFound();
  const { data: operator, error: operatorError } = await db.from("operators").select("name,published,selection_status").eq("id", experience.operator_id).maybeSingle();
  if (operatorError) console.error("BIMARIS review operator lookup failed", operatorError);
  const { data: revision } = await db.from("experience_revisions").select("id,status,submitted_at,content").eq("experience_id", id).eq("status", "pending").order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  const [{ data: livePhotos }, { data: proposedRows }] = await Promise.all([
    db.from("experience_media").select("id,storage_path,alt_text,sort_order,is_cover").eq("experience_id", id).order("sort_order"),
    revision ? db.from("experience_revision_media").select("storage_path,alt_text,sort_order,is_cover,source_media_id").eq("revision_id", revision.id).order("sort_order") : Promise.resolve({ data: [] }),
  ]);
  const proposedPhotos: Photo[] = await Promise.all(((proposedRows ?? []) as Photo[]).map(async photo => {
    if (photo.source_media_id) return { ...photo, url: publicMediaUrl(photo.storage_path) };
    const { data, error } = await db.storage.from("experience-revision-media").createSignedUrl(photo.storage_path, 300);
    return { ...photo, url: error ? "" : (data?.signedUrl ?? "") };
  }));
  const next = (revision?.content ?? {}) as Content;
  const allFields = experienceFieldComparison(experience, next);
  const changedFields = allFields.filter(([, , , changed]) => changed);
  const originalPhotos: Photo[] = ((livePhotos ?? []) as Photo[]).map(p => ({ ...p, url: publicMediaUrl(p.storage_path) }));
  // A retained image refers to its existing experience_media.id, not its storage path:
  // two different records may point to the same underlying image.
  const photoKey = (photo: Photo) => photo.source_media_id ?? photo.id ?? photo.storage_path;
  const beforePhotos = new Map(originalPhotos.map(photo => [photoKey(photo), photo]));
  const afterPhotos = new Map(proposedPhotos.map(photo => [photoKey(photo), photo]));
  const addedPhotos = proposedPhotos.filter(photo => !beforePhotos.has(photoKey(photo)));
  const removedPhotos = originalPhotos.filter(photo => !afterPhotos.has(photoKey(photo)));
  const updatedPhotos = proposedPhotos.flatMap(photo => {
    const before = beforePhotos.get(photoKey(photo));
    return before && (before.sort_order !== photo.sort_order || before.is_cover !== photo.is_cover || before.alt_text !== photo.alt_text)
      ? [{ before, after: photo }] : [];
  });
  const photoChangesCount = addedPhotos.length + removedPhotos.length + updatedPhotos.length;
  const currentLabel=experience.published?"ONLINE ORA":"VERSIONE APPROVATA (NON PUBBLICATA)";
  const blocker = operatorError ? "operator-status-unavailable" : experienceRevisionBlocker(experience, operator);
  const { state } = await searchParams;
  const stateMessage: Record<string, string> = { "approved-applied": "Modifica approvata e applicata.", "changes-requested": "Correzioni inviate all'operatore.", "review-note-required": "Indica almeno una correzione prima di rinviare la proposta.", "invalid-review-state": "La proposta non è più in attesa di revisione.", "invalid-source-state": "Modifica non applicata. Lo stato dell’esperienza o dell’operatore è cambiato. Verifica le schede collegate e riapri il confronto.", "experience-not-approved": "Modifica non applicata. La versione di base dell’esperienza deve essere approvata.", "operator-not-selected": "Modifica non applicata. L’operatore deve essere selezionato prima di applicare la revisione.", "operator-not-published": "Modifica non applicata. L’operatore deve essere pubblicato prima di applicare la revisione.", "invalid-data": "Modifica non applicata. I dati della revisione non sono validi.", "action-error": "Operazione non riuscita." };

  return <div className="revision-workspace">
    <div className="revision-workspace__heading">
      <div className="revision-workspace__heading-copy">
        <span className="revision-workspace__eyebrow">Revisione esperienza</span>
        <h1>{experience.name}</h1>
        <p>{operator?.name ?? "Operatore"} · {revision?.submitted_at ? `Proposta del ${new Date(revision.submitted_at).toLocaleDateString("it-IT", {timeZone:"Europe/Rome"})}` : "Modifica proposta"}</p>
      </div>
      <nav className="revision-workspace__links" aria-label="Navigazione revisione">
        <Link href="/admin/contenuti?categoria=esperienze">← Esperienze da esaminare</Link>
        <Link href={`/admin/esperienze/${id}`}>Scheda esperienza</Link>
        <Link href={`/admin/operatori/${experience.operator_id}`}>Dossier operatore</Link>
      </nav>
    </div>
    <section className="revision-workspace__content">
    {state && <div id="revision-outcome" role="status" style={{ padding: 16, marginBottom: 14, scrollMarginTop: "6rem", background: "#fff", border: "1px solid #d7c7b6" }}>
      <p>{stateMessage[state] ?? "Esito della revisione non disponibile."}</p>
      {state === "approved-applied"
        ? experience.published
          ? <Link className="text-link" href={`/esperienze/${experience.slug}`}>Visualizza l’esperienza pubblicata →</Link>
          : <Link className="text-link" href={`/admin/esperienze/${id}?state=revision-approved-awaiting-publication#admin-decision`}>Vai alla pubblicazione →</Link>
        : state === "operator-not-selected" || state === "operator-not-published"
        ? <Link className="text-link" href={`/admin/operatori/${experience.operator_id}`}>Apri il dossier operatore →</Link>
        : state === "experience-not-approved"
          ? <Link className="text-link" href={`/admin/esperienze/${id}`}>Apri la scheda esperienza →</Link>
          : <Link className="text-link" href="/admin/contenuti?categoria=esperienze">Torna alle esperienze da esaminare →</Link>}
    </div>}
    {!revision ? <div id="prima-modifica" className="detail-panel"><h2>Nessuna revisione in attesa</h2><p>Per questa esperienza non risultano modifiche da esaminare.</p></div> : <article className="detail-panel revision-workspace__panel">
      <section className="revision-changes" aria-labelledby="revision-changes-title">
        <div className="revision-section-heading"><h3 id="revision-changes-title">Solo le modifiche da esaminare</h3>
          <p>{changedFields.length} {changedFields.length===1?"campo modificato":"campi modificati"} · {photoChangesCount} {photoChangesCount===1?"modifica fotografica":"modifiche fotografiche"}. I campi invariati sono nascosti.</p>
        </div>
        {changedFields.length===0&&photoChangesCount===0&&<p id="prima-modifica" className="revision-changes__empty">Nessuna differenza rilevata rispetto alla versione approvata. Controlla i dettagli prima di decidere.</p>}
        <div className="revision-changes__fields">
          {changedFields.map(([label,before,after], index)=><section key={label} id={index === 0 ? "prima-modifica" : undefined} className="revision-changes__field">
            <h4>{label}</h4>
            <div className="revision-changes__values">
              <div><small>{currentLabel}</small><p>{show(before)}</p></div>
              <div><small>PROPOSTA OPERATORE</small><p>{show(after)}</p></div>
            </div>
          </section>)}
        </div>
        {photoChangesCount>0&&<section id={changedFields.length === 0 ? "prima-modifica" : undefined} className="revision-gallery" aria-label="Fotografie interessate dalla revisione">
          <div className="revision-section-heading"><h3>Fotografie modificate</h3><p>Solo gli elementi aggiunti, rimossi o cambiati di posizione o copertina.</p></div>
          <div className="revision-gallery__changes">
            {addedPhotos.map((photo,i)=><figure className="revision-gallery__photo" key={photo.storage_path+"-add-"+i}>
              <strong>Aggiunta {photo.is_cover?"· nuova copertina":""}</strong>
              {photo.url?<img src={photo.url} alt={photo.alt_text??"Nuova fotografia"}/>:<div className="revision-gallery__placeholder">Anteprima non disponibile</div>}
              <figcaption>Posizione proposta {photo.sort_order+1}</figcaption>
            </figure>)}
            {removedPhotos.map((photo,i)=><figure className="revision-gallery__photo" key={photo.storage_path+"-remove-"+i}>
              <strong>Rimossa {photo.is_cover?"· copertina precedente":""}</strong>
              {photo.url?<img src={photo.url} alt={photo.alt_text??"Fotografia rimossa"}/>:<div className="revision-gallery__placeholder">Anteprima non disponibile</div>}
              <figcaption>Posizione precedente {photo.sort_order+1}</figcaption>
            </figure>)}
            {updatedPhotos.map(({before,after},i)=><figure className="revision-gallery__photo" key={after.storage_path+"-update-"+i}>
              <strong>{before.is_cover!==after.is_cover?"Copertina modificata":before.sort_order!==after.sort_order?"Ordine modificato":"Didascalia modificata"}</strong>
              {after.url?<img src={after.url} alt={after.alt_text??"Fotografia modificata"}/>:<div className="revision-gallery__placeholder">Anteprima non disponibile</div>}
              <figcaption>Posizione {before.sort_order+1} → {after.sort_order+1} · {before.is_cover?"Copertina prima":"Foto prima"} → {after.is_cover?"Copertina proposta":"Foto proposta"}</figcaption>
            </figure>)}
          </div>
        </section>}
      </section>
      <details className="revision-full-comparison">
        <summary>Mostra confronto completo e gallerie</summary>
        <p className="revision-full-comparison__hint">Consulta tutti i campi e le fotografie soltanto quando serve un controllo approfondito.</p>
        <div className="revision-full-comparison__fields">
          {allFields.map(([label,before,after,changed])=><div className="revision-full-comparison__field" key={label}>
            <strong>{label} · {changed ? "modificato" : "invariato"}</strong>
            <div className="revision-changes__values">
              <div><small>{currentLabel}</small><p>{show(before)}</p></div>
              <div><small>PROPOSTA OPERATORE</small><p>{show(after)}</p></div>
            </div>
          </div>)}
        </div>
        <section className="revision-gallery" aria-label="Confronto completo delle fotografie">
          <div className="revision-section-heading"><h3>Gallerie fotografiche complete</h3><p>Copertina, ordine e fotografie prima e dopo la proposta.</p></div>
          <div className="revision-gallery__comparison">
            {[{title:currentLabel,photos:originalPhotos},{title:"PROPOSTA OPERATORE",photos:proposedPhotos}].map(group=>
              <div className="revision-gallery__group" key={group.title}>
                <div className="revision-gallery__group-head"><strong>{group.title}</strong><span>{group.photos.length} foto</span></div>
                <div className="revision-gallery__photos">
                  {group.photos.length===0&&<p>Nessuna fotografia.</p>}
                  {group.photos.map((photo,i)=><figure className="revision-gallery__photo" key={photo.storage_path+"-"+i}>
                    {photo.url?<img src={photo.url} alt={photo.alt_text??"Fotografia esperienza"}/>:<div className="revision-gallery__placeholder">Anteprima non disponibile</div>}
                    <figcaption>{photo.is_cover?"★ Copertina":"Foto"} · posizione {photo.sort_order+1}</figcaption>
                  </figure>)}
                </div>
              </div>)}
          </div>
        </section>
      </details>
      <section id="admin-review-decision" className="revision-decisions" aria-label="Esito revisione esperienza" style={{scrollMarginTop:112}}>
        <div className="revision-section-heading"><h3>Decisione sulla modifica proposta</h3><p>{blocker === "operator-not-published" ? "L’operatore non è online: puoi richiedere correzioni, ma non approvare e applicare la modifica." : blocker ? "Prima di decidere, risolvi il blocco indicato qui sotto. Nessuna modifica è stata applicata." : "Scegli uno dei due esiti. L’approvazione applica la modifica alla versione approvata; la richiesta di correzioni la rinvia all’operatore."}</p></div>
        {blocker && blocker !== "operator-not-published" ? <div className="revision-decision-card" role="status">
          <h4>Decisione al momento bloccata</h4>
          <p>{blocker === "operator-status-unavailable" ? "Non è stato possibile verificare lo stato dell’operatore. Ricarica la pagina per riprovare." : stateMessage[blocker]}</p>
          {blocker === "experience-not-approved"
            ? <Link className="text-link" href={`/admin/esperienze/${id}`}>Apri la scheda esperienza →</Link>
            : blocker !== "operator-status-unavailable" && <Link className="text-link" href={`/admin/operatori/${experience.operator_id}`}>Apri il dossier operatore →</Link>}
        </div> : <div className="revision-decisions__grid">
          {blocker === "operator-not-published" ? <div className="revision-decision-card" role="status"><h4>Approvazione non disponibile</h4><p>L’operatore non è online. Puoi richiedere correzioni ora, ma potrai approvare e applicare la proposta solo dopo la pubblicazione del profilo.</p><Link className="text-link" href={`/admin/operatori/${experience.operator_id}`}>Apri il dossier operatore →</Link></div> : <form method="post" action="/api/admin/experience-revisions" className="revision-decision-card">
            <h4>Approva la modifica</h4>
            <p>Applica le modifiche dopo averne verificato la correttezza.</p>
            <input type="hidden" name="revision_id" value={revision.id}/>
            <label htmlFor="revision-approval-note">Nota facoltativa</label>
            <textarea id="revision-approval-note" name="review_notes" rows={4} placeholder="Eventuali indicazioni sulla revisione approvata"/>
            <button className="revision-decision-card__button revision-decision-card__button--approve" name="action" value="approve-apply">Approva e applica</button>
          </form>}
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
        </div>}
      </section>
    </article>}
    </section>
  </div>;
}
