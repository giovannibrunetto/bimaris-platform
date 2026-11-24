import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { googleMapsPlaceUrl } from "@/lib/google-maps-place-url";
import CultureMonumentCard, { type CultureCardData } from "@/components/CultureMonumentCard";
import { historicalPeriodLabel } from "@/lib/historical-periods";
import EditorialStatusFilter from "./EditorialStatusFilter";
import EditorialDraftForm from "./EditorialDraftForm";
import EditorialSources, { type EditorialSource } from "./EditorialSources";
import EditorialPlaceField from "./EditorialPlaceField";
import "./editoriale.css";

export const dynamic = "force-dynamic";
const archive = "/admin/archivio-editoriale";
const api = "/api/admin/editoriale";
const notices: Record<string, string> = {
  create:"Bozza aperta.", save:"Bozza salvata.", photo:"Foto aggiunta alla bozza.",
  publish:"Scheda pubblicata.", withdraw:"Scheda ritirata.", archive:"Scheda archiviata.",
  conflitto:"La scheda è cambiata. Verifica la versione corrente prima di riprovare.",
  campi:"Controlla i campi richiesti prima di pubblicare. Per un nuovo monumento serve anche la posizione.", dati:"Controlla i dati inseriti.",
  delete:"Scheda cancellata dall’archivio.",
  mappa:"Inserisci latitudine e longitudine valide, oppure seleziona un suggerimento Google Maps.",
  fonti:"Controlla il titolo e il link delle fonti inserite.",
  fotolimite:"Una foto di copertina è già in attesa di pubblicazione.",
  foto:"Carica un JPEG, PNG o WebP fino a 3 MiB con testo alternativo.", errore:"Operazione non riuscita.",
};
type CatalogRecord = { id: string; title: string; slug: string; published: boolean; excerpt: string | null;
  category?: string | null; primary_historical_period?: Parameters<typeof historicalPeriodLabel>[0];
  image_url?: string | null; image_alt?: string | null; image_author?: string | null; image_license?: string | null;
  google_maps_url?: string | null; editorial_address?: string | null; editorial_latitude?: number | null; editorial_longitude?: number | null;
};
type Photo = { id: string; alt: string; author?: string; license?: string };

export default async function EditorialPage({ searchParams }: {
  searchParams: Promise<{ id?: string; anteprima?: string; esito?: string; q?: string; stato?: string; pagina?: string; salvataggio?: string; fotografia?: string; pubblicazione?: string; sezione?: string }>;
}) {
  if (!(await getVerifiedSuperAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) notFound();
  const query = await searchParams;
  const model = query.sezione === "legend" || query.sezione === "village" ? query.sezione : "culture";
  const base = archive;
  const sectionParam = model === "culture" ? "" : `sezione=${model}&`;
  const sectionUrl = model === "culture" ? archive : `${archive}?sezione=${model}`;
  const name = model === "legend" ? "Miti e leggende" : model === "village" ? "Borghi" : "Monumenti";
  const newLabel = model === "legend" ? "Nuova leggenda" : model === "village" ? "Nuovo borgo" : "Nuovo monumento";
  const publicPath = model === "legend" ? "/storie-miti-leggende" : model === "village" ? "/borghi" : "/cultura";
  const [catalog, workspaces] = await Promise.all([
    model === "legend"
      ? db.from("stories").select("id,title,slug,published,excerpt,category:story_type,image_url,image_alt,image_author,image_license").order("title")
      : model === "village"
      ? db.from("villages").select("id,title:name,slug,published,excerpt,image_url,image_alt,image_author,image_license,editorial_address:address,editorial_latitude:latitude,editorial_longitude:longitude").order("name")
      : db.from("culture_entries").select("id,title,slug,published,excerpt,category,primary_historical_period,image_url,image_alt,image_author,image_license,google_maps_url,editorial_latitude,editorial_longitude,editorial_address").order("title"),
    db.from("editorial_workspaces").select("*").eq("model", model),
  ]);
  if (catalog.error || workspaces.error) return <main className="editorial-shell editorial-standard"><h1>Archivio editoriale</h1><p>Archivio temporaneamente non disponibile.</p></main>;

  const deletedEntries = new Set(workspaces.data.filter(row => row.draft.deletedAt).map(row => row.entry_id));
  const workspace = workspaces.data.find(row => row.id === query.id && !row.draft.deletedAt);
  if (query.id && !workspace) notFound();
  const record = (catalog.data as CatalogRecord[]).find(row => row.id === workspace?.entry_id);
  const draft = workspace?.draft;
  const editorialBody = model === "legend" ? draft?.body?.replace(/\\n/g, "\n") : draft?.body;
  const photos: Photo[] = draft?.photos ?? [];
  const status = (row: typeof workspace, published?: boolean) => row?.archived ? "Archiviata" : published ? "Pubblicata" : row?.entry_id ? "Ritirata" : "Bozza";
  const rows = [
    ...catalog.data.filter(item => !deletedEntries.has(item.id)).map(item => ({ title: item.title, entry: item.id, draft: workspaces.data.find(row => row.entry_id === item.id), published: item.published })),
    ...workspaces.data.filter(row => !row.entry_id && !row.draft.deletedAt).map(row => ({ title: row.draft.title || "Bozza senza titolo", entry: "", draft: row, published: false })),
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
    return `${base}?${sectionParam}${params}`;
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
    : savedLabel ? `Salvata · ${savedLabel}` : undefined;

  const canPublish = Boolean(draft?.title?.trim() && draft?.body?.trim()
    && (model !== "culture" || draft?.placeId || mapsUrl || (draft?.location?.latitude != null && draft?.location?.longitude != null)));
  const { data: cover } = record && model === "culture"
    ? await db.from("culture_images").select("image_url,alt_text,author,license")
        .eq("culture_entry_id", record.id).order("is_primary", { ascending: false })
        .order("sort_order").limit(1).maybeSingle()
    : { data: null };
  const draftCover = photos[0];
  const cardImage = model !== "culture" && draftCover ? undefined : cover?.image_url ?? record?.image_url;
  const card: CultureCardData = {
    variant: model,
    title: draft?.title ?? "",
    excerpt: model === "culture" ? record?.excerpt ?? "" : draft?.excerpt ?? "",
    category: draft?.category || record?.category || (model === "culture" ? "monumento" : model === "legend" ? "Leggenda" : "Borgo"),
    period: record?.primary_historical_period === "trasversale" ? "Più epoche" : historicalPeriodLabel(record?.primary_historical_period),
    imageUrl: cardImage ?? (draftCover ? `/api/editoriale/immagini/${draftCover.id}?anteprima=1` : undefined),
    imageAlt: cardImage ? cover?.alt_text ?? record?.image_alt : draftCover?.alt,
    imageAuthor: cardImage ? cover?.author ?? record?.image_author : draftCover?.author,
    imageLicense: cardImage ? cover?.license ?? record?.image_license : draftCover?.license,
  };
  const modelField = <input type="hidden" name="sezione" value={model} />;
  const sourceTable = model === "culture" ? "culture_sources" : model === "legend" ? "story_sources" : "village_sources";
  const sourceKey = model === "culture" ? "culture_entry_id" : model === "legend" ? "story_id" : "village_id";
  const storedSources = record && !Array.isArray(draft?.sources)
    ? await db.from(sourceTable).select("label,url,source_type,note").eq(sourceKey, record.id).order("sort_order")
    : { data: [], error: null };
  const sources: EditorialSource[] = draft?.sources ?? storedSources.data ?? [];
  const hiddenFields = workspace && <>
    {modelField}
    <input type="hidden" name="workspace" value={workspace.id} />
    <input type="hidden" name="version" value={workspace.version} />
  </>;

  return <main className="editorial-shell editorial-standard">
    <header className={`editorial-heading${workspace ? " editorial-heading--sheet" : ""}`}>
      <div>
        <Link className="editorial-back" href={workspace?.archived ? `${base}?${sectionParam}stato=Archiviata` : workspace ? sectionUrl : "/admin"}>{workspace ? "← Archivio editoriale" : "← Centro operativo"}</Link>
        <h1>{workspace ? draft?.title || newLabel : "Archivio editoriale"}</h1>
      </div>
      {workspace && <p className="editorial-current-state"><span className="editorial-badge" data-state={status(workspace, record?.published)}>{status(workspace, record?.published)}</span>{savedAt && <small> · Bozza salvata il <time dateTime={savedAt}>{savedLabel}</time></small>}</p>}
      {!workspace && <form method="post" action={api}>
        {modelField}<button className="editorial-button editorial-button--primary" name="action" value="create">{newLabel}</button>
      </form>}
    </header>
    {query.salvataggio !== "1" && query.fotografia !== "1" && query.pubblicazione !== "1" && query.esito && notices[query.esito] && <p className="editorial-notice" role="status">{notices[query.esito]}</p>}
    {!workspace ? <>
      <nav className="editorial-actions editorial-sheet-nav" aria-label="Sezioni editoriali">
        <Link className="editorial-button" aria-current={model === "culture" ? "page" : undefined} href={archive}>Monumenti</Link>
        <Link className="editorial-button" aria-current={model === "legend" ? "page" : undefined} href={`${archive}?sezione=legend`}>Miti e leggende</Link>
        <Link className="editorial-button" aria-current={model === "village" ? "page" : undefined} href={`${archive}?sezione=village`}>Borghi</Link>
        <Link className="editorial-button" href={`${archive}/racconti`}>Racconti di Messina</Link>
      </nav>
      <section className="editorial-catalog" aria-labelledby="editorial-catalog-title">
        <div className="editorial-toolbar">
          <h2 id="editorial-catalog-title">{name}</h2>
          <form className="editorial-filters" action={base}>
            {modelField}
            <label>Cerca per titolo<input name="q" type="search" defaultValue={query.q} /></label>
            <EditorialStatusFilter value={query.stato ?? ""} />
            <button className="editorial-button" type="submit">Cerca</button>

          </form>
        </div>
        {rows.length ? <ul className="editorial-list">{rows.slice(offset, offset + pageSize).map(row => {
          const label = status(row.draft, row.published);
          return <li key={row.entry || row.draft?.id}>
            <strong>{row.title}</strong>
            <span className="editorial-badge" data-state={label}>{label}</span>
            {row.draft ? <Link className="editorial-button" href={`${base}?${sectionParam}id=${row.draft.id}`}>{row.draft.archived ? "Visualizza" : "Modifica"}</Link> : <form method="post" action={api}>
              {modelField}<input type="hidden" name="entry" value={row.entry} />
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
      {!workspace.archived && <nav className="editorial-actions editorial-sheet-nav" aria-label="Navigazione editoriale">
        {query.anteprima === "1" ? <Link className="editorial-button" href={`${base}?${sectionParam}id=${workspace.id}`}>Torna alla modifica</Link> : <Link className="editorial-button" href={`${base}?${sectionParam}id=${workspace.id}&anteprima=1`}>Anteprima privata</Link>}
        {record?.published && <Link className="editorial-button" href={`${publicPath}/${record.slug}`}>Versione pubblica</Link>}
      </nav>}

      {workspace.archived || query.anteprima === "1" ? <section className="editorial-panel editorial-private-preview">
        <h2>{workspace.archived ? "Scheda archiviata" : "Anteprima privata"}</h2>
        {workspace.archived && <p>Questa scheda è consultabile in sola lettura.</p>}
        <div className="editorial-read-preview">
          <aside className="editorial-card-preview" aria-label="Card nell’elenco">
            <CultureMonumentCard card={{ ...card, title: card.title || "Scheda senza titolo", excerpt: card.excerpt || draft.body?.slice(0, 240) || "" }} />
          </aside>
          <article className="editorial-preview-copy">
            <section><h3>{model === "legend" ? "Racconto" : "Descrizione del luogo"}</h3><p className={`editorial-text${model === "legend" ? " editorial-narrative" : ""}`}>{editorialBody}</p></section>
            {model === "village" && <>
              {draft.history && <section><h3>Storia</h3><p className="editorial-text">{draft.history}</p></section>}
              {draft.identity && <section><h3>Identità</h3><p className="editorial-text">{draft.identity}</p></section>}
              {draft.thingsToSee && <section><h3>Cosa vedere</h3><p className="editorial-text">{draft.thingsToSee}</p></section>}
            </>}
            {model !== "legend" && initialLocation.meetingPoint && <section><h3>Posizione</h3><p>{initialLocation.meetingPoint}</p></section>}
            {sources.length > 0 && <section><h3>Fonti e riferimenti</h3><ul>
              {sources.map((source, index) => <li key={index}>{source.url && /^https?:\/\//i.test(source.url)
                ? <a className="text-link" href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                : source.label}{source.note && ` · ${source.note}`}</li>)}
            </ul></section>}
          </article>
        </div>
        {workspace.archived && <details className="editorial-sheet-management">
          <summary>Cancella scheda</summary>
          <p>La scheda sarà rimossa dall’Archivio editoriale. La cancellazione resterà registrata.</p>
          <form method="post" action={api}>
            {hiddenFields}
            <button className="editorial-button" name="action" value="delete">Conferma cancellazione</button>
          </form>
        </details>}
      </section> :
        <EditorialDraftForm photoControls={<>
        <section className="editorial-panel editorial-photo-panel" id="editorial-photos" aria-labelledby="editorial-photo-heading">
          <h2 id="editorial-photo-heading">Foto della bozza</h2>
          {query.fotografia === "1" && query.esito && notices[query.esito] &&
            <p className="editorial-notice" role={query.esito === "photo" ? "status" : "alert"}>{notices[query.esito]}</p>}
          {photos.length > 0 ? <div className="editorial-photo-list">
            {photos.map(photo => <figure key={photo.id}>
              <img src={`/api/editoriale/immagini/${photo.id}?anteprima=1`} alt={photo.alt} />
              <figcaption>{[photo.alt, photo.author, photo.license].filter(Boolean).join(" · ")}</figcaption>
            </figure>)}
          </div> : <p>{cardImage ? "La foto pubblicata resta associata alla scheda. Nessuna nuova foto in bozza." : "Nessuna foto aggiunta a questa bozza."}</p>}
          <details className="editorial-photo-add" open={query.fotografia === "1" && query.esito !== "photo" || undefined}>
            <summary>Aggiungi una foto</summary>
            <form className="editorial-photo-form" method="post" action={api} encType="multipart/form-data">
              {hiddenFields}
              <label>File della foto
                <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="editorial-photo-format" required />
                <small id="editorial-photo-format">JPEG, PNG o WebP, fino a 3 MiB.</small>
              </label>
              <label>Descrizione della foto
                <input name="alt" maxLength={250} placeholder="Es. Il bastione visto dal cortile" aria-describedby="editorial-alt-help" required />
                <small id="editorial-alt-help">Una breve descrizione per chi usa un lettore di schermo.</small>
              </label>
              <details className="editorial-photo-credits">
                <summary>Autore, fonte e licenza</summary>
                <label>Autore<input name="author" maxLength={180} /></label>
                <label>Link alla fonte<input name="source" type="url" maxLength={500} /></label>
                <label>Licenza<input name="license" maxLength={180} /></label>
                <label>Link alla licenza<input name="licenseUrl" type="url" maxLength={500} /></label>
              </details>
              <small>Se hai modificato il testo, salva la bozza prima di scegliere e allegare una foto.</small>
              <button className="editorial-button editorial-button--primary" name="action" value="photo">Allega alla bozza</button>
            </form>
          </details>
        </section>
        </>} publicationControls={<>
        <form id="editorial-publication" className="editorial-panel" method="post" action={api}>
          {hiddenFields}
          <h2>Pubblicazione</h2>
          <p>{canPublish ? "Controlla l’anteprima prima di pubblicare. Verrà usata l’ultima bozza salvata." : "Salva titolo e testo prima di pubblicare. Per un nuovo monumento serve anche la posizione."}</p>
          <button className="editorial-button editorial-button--primary" name="action" value="publish" disabled={!canPublish}>Pubblica scheda</button>
          {query.pubblicazione === "1" && query.esito && notices[query.esito] && (
            <div className="editorial-notice" role={query.esito === "publish" || query.esito === "withdraw" ? "status" : "alert"}>
              <p>{notices[query.esito]}</p>
              {query.esito === "publish" && record?.published && <Link className="text-link" href={`${publicPath}/${record.slug}`}>Apri la scheda pubblicata →</Link>}
            </div>
          )}
          <details className="editorial-sheet-management">
            <summary>Ritiro e archiviazione</summary>
            <div className="editorial-actions">
              {record?.published && <button className="editorial-button" name="action" value="withdraw">Ritira dal sito</button>}
              <button className="editorial-button" name="action" value="archive">{record?.published ? "Archivia e ritira" : "Archivia scheda"}</button>
            </div>
          </details>
        </form>
        </>} card={{ ...card, excerpt: card.excerpt || draft.body?.slice(0, 240) || "" }} publicExcerpt={model === "culture" && Boolean(card.excerpt)} action={api} message={saveMessage} saved={query.salvataggio !== "1" || query.esito === "save"}>
          {hiddenFields}
          <label>{model === "village" ? "Nome del borgo" : "Titolo"}{model === "legend" ? <textarea name="title" rows={2} maxLength={180} defaultValue={draft.title} /> : <input name="title" maxLength={180} defaultValue={draft.title} />}</label>
          <label>{model === "legend" ? "Racconto" : "Descrizione del luogo"}<textarea name="body" rows={7} maxLength={40000} defaultValue={editorialBody} /></label>
          {model !== "culture" && <label>Testo breve della card{model === "legend" ? <textarea name="excerpt" rows={3} maxLength={400} defaultValue={draft.excerpt} /> : <input name="excerpt" maxLength={400} defaultValue={draft.excerpt} />}</label>}
          {model === "legend" && <label>Tipo di racconto
            <select name="category" required={!draft.category} defaultValue={draft.category === "Mito" || draft.category === "Leggenda" ? draft.category : ""}>
              <option value="" disabled={!draft.category}>{draft.category && draft.category !== "Mito" && draft.category !== "Leggenda" ? draft.category : "Scegli il tipo"}</option>
              <option value="Mito">Mito</option>
              <option value="Leggenda">Leggenda</option>
            </select>
          </label>}
          {model === "village" && <details className="editorial-sheet-management"><summary>Storia, identità e luoghi da vedere</summary>
            <label>Storia<textarea name="history" rows={4} defaultValue={draft.history} /></label>
            <label>Identità<textarea name="identity" rows={4} defaultValue={draft.identity} /></label>
            <label>Cosa vedere<textarea name="thingsToSee" rows={4} defaultValue={draft.thingsToSee} /></label>
          </details>}
          {!storedSources.error && <EditorialSources initial={sources} />}
          {storedSources.error && <p role="status">Fonti momentaneamente non disponibili.</p>}
          {model !== "legend" && <EditorialPlaceField initialLocation={initialLocation} mapsUrl={mapsUrl} />}
        </EditorialDraftForm>
      }
    </>}
  </main>;
}
