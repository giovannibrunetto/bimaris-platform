import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { createServiceClient } from "@/lib/supabase/server";
import "./editoriale.css";

export const dynamic = "force-dynamic";
const base = "/admin/archivio-editoriale";
const api = "/api/admin/editoriale";
const notices: Record<string, string> = {
  create:"Bozza aperta.", save:"Bozza salvata.", photo:"Foto aggiunta alla bozza.",
  publish:"Scheda pubblicata.", withdraw:"Scheda ritirata.", archive:"Scheda archiviata.",
  conflitto:"La scheda è cambiata. Verifica la versione corrente prima di riprovare.",
  campi:"Per pubblicare servono titolo, testo e un luogo.", dati:"Controlla i dati inseriti.",
  foto:"Carica un JPEG, PNG o WebP fino a 3 MiB con testo alternativo.", errore:"Operazione non riuscita.",
};
type Photo = { id: string; alt: string; author?: string; license?: string };

export default async function EditorialPage({ searchParams }: {
  searchParams: Promise<{ id?: string; anteprima?: string; esito?: string; q?: string; stato?: string; pagina?: string }>;
}) {
  if (!(await getVerifiedSuperAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) notFound();
  const query = await searchParams;
  const [catalog, workspaces] = await Promise.all([
    db.from("culture_entries").select("id,title,slug,published").order("title"),
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

  const { data: places } = workspace && !workspace.archived && query.anteprima !== "1"
    ? await db.from("places").select("id,name").order("name") : { data: [] };
  const hiddenFields = workspace && <>
    <input type="hidden" name="workspace" value={workspace.id} />
    <input type="hidden" name="version" value={workspace.version} />
  </>;

  return <main className="editorial-shell">
    <header className="editorial-heading">
      <div>
        <Link className="editorial-back" href="/admin">← Centro operativo</Link>
        <h1>{workspace ? draft?.title || "Nuova scheda Cultura" : "Archivio editoriale"}</h1>
      </div>
      {!workspace && <form method="post" action={api}>
        <button className="editorial-button editorial-button--primary" name="action" value="create">Nuova scheda Cultura</button>
      </form>}
    </header>
    {query.esito && notices[query.esito] && <p className="editorial-notice" role="status">{notices[query.esito]}</p>}
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
      <nav className="editorial-actions" aria-label="Navigazione editoriale">
        <Link href={base}>Tutte le schede</Link>
        {query.anteprima === "1" ? <Link href={`${base}?id=${workspace.id}`}>Torna alla modifica</Link> : <Link href={`${base}?id=${workspace.id}&anteprima=1`}>Anteprima privata</Link>}
        {record?.published && <Link href={`/cultura/${record.slug}`}>Versione pubblica</Link>}
      </nav>
      <p className="editorial-current-state"><span className="editorial-badge" data-state={status(workspace, record?.published)}>{status(workspace, record?.published)}</span></p>
      {query.anteprima === "1" ? <section className="editorial-panel">
        <h2>Anteprima privata</h2>
        <article className="card culture-card">
          {photos[0] && <div className="culture-card-media"><img src={`/api/editoriale/immagini/${photos[0].id}?anteprima=1`} alt={photos[0].alt} /></div>}
          <div className="card-body"><h3>{draft.title || "Scheda senza titolo"}</h3><p>{draft.body?.slice(0, 240)}</p></div>
        </article>
        <article><h3>{draft.title}</h3><p className="editorial-text">{draft.body}</p></article>
      </section> : !workspace.archived && <div className="editorial-composer">
        <form className="editorial-panel" method="post" action={api}>
          {hiddenFields}
          <h2>Contenuto della scheda</h2>
          <label>Titolo<input name="title" maxLength={180} defaultValue={draft.title} /></label>
          <label>Testo<textarea name="body" rows={9} maxLength={40000} defaultValue={draft.body} /></label>
          <label>Luogo<select name="place" defaultValue={draft.placeId ?? ""}><option value="">Scegli un luogo per pubblicare</option>{(places ?? []).map(place => <option value={place.id} key={place.id}>{place.name}</option>)}</select></label>
          <button className="editorial-button editorial-button--primary" name="action" value="save">Salva bozza</button>
        </form>
        <aside className="editorial-composer-side">
        <details className="editorial-panel editorial-photo-panel" open={["foto", "photo"].includes(query.esito ?? "") || undefined}>
          <summary>Fotografie <span>{photos.length}</span></summary>
          <form className="editorial-photo-form" method="post" action={api} encType="multipart/form-data">
          {hiddenFields}
          {photos.map(photo => <figure key={photo.id}><img src={`/api/editoriale/immagini/${photo.id}?anteprima=1`} alt={photo.alt} /><figcaption>{[photo.alt, photo.author, photo.license].filter(Boolean).join(" · ")}</figcaption></figure>)}
          <label>Fotografia<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <label>Descrizione dell’immagine per l’accessibilità
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
          <h2>Visibilità</h2>
          <p>La pubblicazione applica l’ultima bozza salvata.</p>
          <div className="editorial-actions">
            <button className="editorial-button editorial-button--primary" name="action" value="publish">Pubblica bozza salvata</button>
            {record?.published && <button className="editorial-button" name="action" value="withdraw">Ritira</button>}
            <button className="editorial-button" name="action" value="archive">Archivia e ritira</button>
          </div>
        </form>
        </aside>
      </div>}
    </>}
  </main>;
}
