import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { googleMapsPlaceUrl } from "@/lib/google-maps-place-url";
import EditorialDraftForm from "./EditorialDraftForm";
import EditorialPlaceField from "./EditorialPlaceField";
import "./editoriale.css";

export const dynamic = "force-dynamic";
const base = "/admin/archivio-editoriale";
const api = "/api/admin/editoriale";
const notices: Record<string, string> = {
  create:"Bozza aperta.", save:"Bozza salvata.", photo:"Foto aggiunta alla bozza.",
  publish:"Scheda pubblicata.", withdraw:"Scheda ritirata.", archive:"Scheda archiviata.",
  conflitto:"La scheda è cambiata. Verifica la versione corrente prima di riprovare.",
  campi:"Per pubblicare, salva titolo e testo. Per una scheda nuova, seleziona un suggerimento Google oppure inserisci le coordinate.", dati:"Controlla i dati inseriti.",
  mappa:"Inserisci latitudine e longitudine valide, oppure seleziona un suggerimento Google Maps.",
  foto:"Carica un JPEG, PNG o WebP fino a 3 MiB con testo alternativo.", errore:"Operazione non riuscita.",
};
type Photo = { id: string; alt: string; author?: string; license?: string };

export default async function EditorialPage({ searchParams }: {
  searchParams: Promise<{ id?: string; anteprima?: string; esito?: string; q?: string; stato?: string; pagina?: string; salvataggio?: string }>;
}) {
  if (!(await getVerifiedSuperAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) notFound();
  const query = await searchParams;
  const [catalog, workspaces] = await Promise.all([
    db.from("culture_entries").select("id,title,slug,published,google_maps_url,editorial_latitude,editorial_longitude,editorial_address").order("title"),
    db.from("editorial_workspaces").select("*").eq("model", "culture"),
  ]);
  if (catalog.error || workspaces.error) return <main className="editorial-shell"><h1>Archivio editoriale</h1><p>Archivio temporaneamente non disponibile.</p></main>;

  const workspace = workspaces.data.find(row => row.id === query.id);
  if (query.id && !workspace) notFound();
  const record = catalog.data.find(row => row.id === workspace?.entry_id);
  const draft = workspace?.draft;
  const photos: Photo[] = draft?.photos ?? [];
  const status = (row: typeof workspace, published?: boolean) => row?.archived ? "Archiviata" : published ? "Pubblicata" : row?.entry_id ? "Ritirata" : "Bozza";
  const rows = [
    ...catalog.data.map(item => ({ title: item.title, entry: item.id, draft: workspaces.data.find(row => row.entry_id === item.id), published: item.published })),
    ...workspaces.data.filter(row => !row.entry_id).map(row => ({ title: row.draft.title || "Bozza senza titolo", entry: "", draft: row, published: false })),
  ].filter(row => (!query.q || row.title.toLocaleLowerCase("it").includes(query.q.toLocaleLowerCase("it"))) && (!query.stato || status(row.draft, row.published) === query.stato));
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const requestedPage = Number(query.pagina);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pageCount, Math.max(1, requestedPage)) : 1;
  const offset = (page - 1) * pageSize;
  const pageHref = (number: number) => {
    const params = new URLSearchParams({ pagina: String(number) });
    if (query.q) params.set("q", query.q);
    if (query.stato) params.set("stato", query.stato);
    return `${base}?${params}`;
  };

  const { data: linkedPlace } = draft?.placeId
    ? await db.from("places").select("address,latitude,longitude,google_maps_query").eq("id", draft.placeId).maybeSingle()
    : { data: null };
  const mapsUrl = draft?.mapsUrl ?? draft?.newPlace?.mapsUrl ?? record?.google_maps_url
    ?? googleMapsPlaceUrl(linkedPlace?.google_maps_query ?? "") ?? undefined;
  const initialLocation = {
    locationKind: "venue" as const,
    meetingPoint: draft?.location?.address ?? record?.editorial_address ?? linkedPlace?.address ?? "",
    googleMapsPlaceId: draft?.location?.placeId ?? "",
    latitude: String(draft?.location ? draft.location.latitude ?? "" : record?.editorial_latitude ?? linkedPlace?.latitude ?? ""),
    longitude: String(draft?.location ? draft.location.longitude ?? "" : record?.editorial_longitude ?? linkedPlace?.longitude ?? ""),
  };
  const { data: lastSave } = workspace
    ? await db.from("editorial_activity").select("created_at").eq("workspace_id", workspace.id)
        .eq("action", "save").order("version", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const savedAt = lastSave?.created_at;
  const savedLabel = savedAt ? new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome",
  }).format(new Date(savedAt)) : undefined;
  const saveMessage = query.salvataggio === "1" && query.esito !== "save" && query.esito
    ? notices[query.esito]
    : savedLabel ? `Ultimo salvataggio della bozza · ${savedLabel}` : undefined;

  const canPublish = Boolean(draft?.title?.trim() && draft?.body?.trim()
    && (draft?.placeId || mapsUrl || (draft?.location?.latitude != null && draft?.location?.longitude != null)));
  const hiddenFields = workspace && <>
    <input type="hidden" name="workspace" value={workspace.id} />
    <input type="hidden" name="version" value={workspace.version} />
  </>;

  return <main className="editorial-shell">
    <header className={`editorial-heading${workspace ? " editorial-heading--sheet" : ""}`}>
      <div>
        <Link className="editorial-back" href={workspace ? base : "/admin"}>{workspace ? "← Archivio editoriale" : "← Centro operativo"}</Link>
        <h1>{workspace ? draft?.title || "Nuova scheda Cultura" : "Archivio editoriale"}</h1>
      </div>
      {workspace && <p className="editorial-current-state"><span className="editorial-badge" data-state={status(workspace, record?.published)}>{status(workspace, record?.published)}</span>{savedAt && <small> · Bozza salvata il <time dateTime={savedAt}>{savedLabel}</time></small>}</p>}
      {!workspace && <form method="post" action={api}>
        <button className="editorial-button editorial-button--primary" name="action" value="create">Nuova scheda Cultura</button>
      </form>}
    </header>
    {query.salvataggio !== "1" && query.esito && notices[query.esito] && <p className="editorial-notice" role="status">{notices[query.esito]}</p>}
    {!workspace ? <>
      <section className="editorial-catalog" aria-labelledby="editorial-catalog-title">
        <div className="editorial-toolbar">
          <h2 id="editorial-catalog-title">Cultura</h2>
          <form className="editorial-filters" action={base}>
            <label>Cerca per titolo<input name="q" type="search" defaultValue={query.q} /></label>
            <label>Stato<select name="stato" defaultValue={query.stato ?? ""}>
              <option value="">Tutti</option>
              {["Bozza", "Pubblicata", "Ritirata", "Archiviata"].map(label => <option key={label}>{label}</option>)}
            </select></label>
            <button className="editorial-button">Filtra</button>
            {(query.q || query.stato) && <Link className="editorial-button" href={base}>Azzera</Link>}
          </form>
        </div>
        {rows.length ? <ul className="editorial-list">{rows.slice(offset, offset + pageSize).map(row => {
          const label = status(row.draft, row.published);
          return <li key={row.entry || row.draft?.id}>
            <strong>{row.title}</strong>
            <span className="editorial-badge" data-state={label}>{label}</span>
            {row.draft ? <Link className="editorial-button" href={`${base}?id=${row.draft.id}`}>Apri scheda</Link> : <form method="post" action={api}>
              <input type="hidden" name="entry" value={row.entry} />
              <button className="editorial-button" name="action" value="create">Modifica</button>
            </form>}
          </li>;
        })}</ul> : <p className="editorial-empty">Nessuna scheda corrisponde ai filtri.</p>}
        {rows.length > 0 && <div className="editorial-footer">
          <span>Schede {offset + 1}–{Math.min(offset + pageSize, rows.length)} di {rows.length}</span>
          {pageCount > 1 && <nav aria-label="Paginazione schede">
            {page > 1 && <Link className="editorial-button" href={pageHref(page - 1)}>Precedente</Link>}
            <span>{page} / {pageCount}</span>
            {page < pageCount && <Link className="editorial-button" href={pageHref(page + 1)}>Successiva</Link>}
          </nav>}
        </div>}
      </section>
    </> : <>
      <nav className="editorial-actions editorial-sheet-nav" aria-label="Navigazione editoriale">
        {query.anteprima === "1" ? <Link href={`${base}?id=${workspace.id}`}>Torna alla modifica</Link> : <Link href={`${base}?id=${workspace.id}&anteprima=1`}>Anteprima privata</Link>}
        {record?.published && <Link href={`/cultura/${record.slug}`}>Versione pubblica</Link>}
      </nav>

      {query.anteprima === "1" ? <section className="editorial-panel">
        <h2>Anteprima privata</h2>
        <article className="card culture-card">
          {photos[0] && <div className="culture-card-media"><img src={`/api/editoriale/immagini/${photos[0].id}?anteprima=1`} alt={photos[0].alt} /></div>}
          <div className="card-body"><h3>{draft.title || "Scheda senza titolo"}</h3><p>{draft.body?.slice(0, 240)}</p></div>
        </article>
        <article><h3>{draft.title}</h3><p className="editorial-text">{draft.body}</p></article>
      </section> : !workspace.archived && <div className="editorial-composer">
        <EditorialDraftForm action={api} message={saveMessage} saved={query.salvataggio !== "1" || query.esito === "save"}>
          {hiddenFields}
          <h2>Contenuto della scheda</h2>
          <label>Titolo<input name="title" maxLength={180} defaultValue={draft.title} /></label>
          <label>Descrizione del luogo<textarea name="body" rows={7} maxLength={40000} defaultValue={draft.body} /></label>
          <EditorialPlaceField initialLocation={initialLocation} mapsUrl={mapsUrl} />
        </EditorialDraftForm>
        <aside className="editorial-composer-side">
        <details className="editorial-panel editorial-photo-panel" open={["foto", "photo"].includes(query.esito ?? "") || undefined}>
          <summary>Fotografie in bozza <span>{photos.length}</span></summary>
          <form className="editorial-photo-form" method="post" action={api} encType="multipart/form-data">
          {hiddenFields}
          {photos.map(photo => <figure key={photo.id}><img src={`/api/editoriale/immagini/${photo.id}?anteprima=1`} alt={photo.alt} /><figcaption>{[photo.alt, photo.author, photo.license].filter(Boolean).join(" · ")}</figcaption></figure>)}
          <label>Fotografia<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <label>Descrizione della foto per l’accessibilità
            <input name="alt" maxLength={250} placeholder="Es. Il castello visto dal cortile" aria-describedby="editorial-alt-help" required />
            <small id="editorial-alt-help">Descrivi brevemente ciò che si vede. I lettori di schermo leggono questo testo a chi non può vedere la foto.</small>
          </label>
          <details className="editorial-photo-credits"><summary>Crediti e licenza</summary>
          <label>Autore<input name="author" maxLength={180} /></label>
          <label>Fonte<input name="source" type="url" maxLength={500} /></label>
          <label>Licenza<input name="license" maxLength={180} /></label>
          <label>Link licenza<input name="licenseUrl" type="url" maxLength={500} /></label>
          </details>
          <button className="editorial-button" name="action" value="photo">Aggiungi foto</button>
          </form>
        </details>
        <form className="editorial-panel" method="post" action={api}>
          {hiddenFields}
          <h2>Pubblicazione</h2>
          <p>{canPublish ? "Controlla l’anteprima prima di pubblicare. Verrà usata l’ultima bozza salvata." : "Salva titolo, descrizione e posizione per abilitare la pubblicazione."}</p>
          <button className="editorial-button editorial-button--primary" name="action" value="publish" disabled={!canPublish}>Pubblica scheda</button>
          <details className="editorial-sheet-management">
            <summary>Ritiro e archiviazione</summary>
            <div className="editorial-actions">
              {record?.published && <button className="editorial-button" name="action" value="withdraw">Ritira dal sito</button>}
              <button className="editorial-button" name="action" value="archive">{record?.published ? "Archivia e ritira" : "Archivia scheda"}</button>
            </div>
          </details>
        </form>
        </aside>
      </div>}
    </>}
  </main>;
}
