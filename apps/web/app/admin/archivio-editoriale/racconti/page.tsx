import { editorialRoutes } from "@/lib/editorial-routes";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { getPublishedCultureEntries } from "@/data/live";
import type { CultureStory } from "@/data/ti-racconto-messina";
import HistoricalStoryView from "@/components/HistoricalStoryView";
import EditorialDraftForm from "../EditorialDraftForm";
import EditorialPhotoFields from "../EditorialPhotoFields";
import EditorialSources from "../EditorialSources";
import EditorialStatusFilter from "../EditorialStatusFilter";
import HistoricalChapters from "./HistoricalChapters";
import "../editoriale.css";
import "@/app/ti-racconto-la-storia-di-messina/storytelling.css";
import "@/app/ti-racconto-la-storia-di-messina/[story]/story-detail.css";
import "./racconti.css";

export const dynamic = "force-dynamic";

const archive = editorialRoutes.catalog.page;
const base = editorialRoutes.historical.page;
const api = editorialRoutes.historical.api;
const publicBase = "/ti-racconto-la-storia-di-messina";
const notices: Record<string, string> = {
  create: "Bozza aperta.", save: "Bozza salvata.", publish: "Racconto pubblicato.",
  withdraw: "Racconto ritirato.", archive: "Racconto archiviato.",
  campi: "Per pubblicare completa titolo, testo breve, epoca, apertura, almeno un capitolo e conclusione.",
  luogo: "Una scheda Cultura collegata non è più pubblicata. Aggiorna il collegamento prima di riprovare.",
  protetto: "La versione pubblica di questo racconto è protetta.",
  dati: "Controlla i dati inseriti.", conflitto: "La bozza è cambiata. Riaprila prima di riprovare.",
  fonti: "Controlla il titolo e il link delle fonti inserite.",
  "foto-file": "Seleziona una fotografia.",
  "foto-size": "La fotografia supera il limite di 3 MiB anche dopo la preparazione.",
  "foto-empty": "Il file selezionato è vuoto.",
  "foto-alt": "Inserisci la descrizione della fotografia.",
  "foto-type": "Seleziona una fotografia JPEG, PNG o WebP.",
  "foto-storage": "Caricamento della fotografia non riuscito.",
  errore: "Operazione non riuscita.",
};
type Workspace = { id: string; entry_id: string | null; version: number; archived: boolean; draft: Partial<CultureStory> };

export default async function HistoricalEditorialPage({ searchParams }: {
  searchParams: Promise<{ id?: string; anteprima?: string; esito?: string; q?: string; stato?: string }>;
}) {
  if (!(await getVerifiedSuperAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) notFound();
  const query = await searchParams;
  const [catalog, workspaces] = await Promise.all([
    db.from("historical_editorial_stories").select("id,slug,published,protected,content").order("position").order("slug"),
    db.from("editorial_workspaces").select("id,entry_id,version,archived,draft").eq("model", "historical"),
  ]);
  if (catalog.error || workspaces.error) return <div className="editorial-shell"><h1>Racconti di Messina</h1><p>Archivio temporaneamente non disponibile.</p></div>;

  const drafts: Workspace[] = workspaces.data;
  const active = query.id ? drafts.find(row => row.id === query.id) : undefined;
  if (query.id && !active) notFound();
  const record = catalog.data.find(row => row.id === active?.entry_id);
  const draft = active?.draft;
  const current = active ? `${base}?id=${active.id}` : base;
  const preview = query.anteprima === "1" || active?.archived;
  const status = (published: boolean, row?: Workspace) => row?.archived ? "Archiviata" : published ? "Pubblicata" : row?.entry_id ? "Ritirata" : "Bozza";
  const rows = [
    ...catalog.data.map(entry => ({ id: entry.id, title: entry.content.title as string, published: entry.published, draft: drafts.find(row => row.entry_id === entry.id) })),
    ...drafts.filter(row => !row.entry_id).map(row => ({ id: row.id, title: row.draft.title || "Bozza senza titolo", published: false, draft: row })),
  ].filter(row => (!query.q || row.title.toLocaleLowerCase("it").includes(query.q.toLocaleLowerCase("it"))) &&
    (!query.stato || status(row.published, row.draft) === query.stato));
  const entries = active ? await getPublishedCultureEntries() : [];
  const savedAt = active ? (await db.from("editorial_activity").select("created_at").eq("workspace_id", active.id)
    .eq("action", "save").order("version", { ascending: false }).limit(1).maybeSingle()).data?.created_at : undefined;
  const savedLabel = savedAt && new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(savedAt));
  const notice = query.esito ? notices[query.esito] : undefined;
  const success = query.esito && ["create", "save", "publish", "withdraw", "archive"].includes(query.esito);
  const savedOrError = notice && (query.esito === "save" || !success && !preview);
  const canPublish = draft?.title && draft.subtitle && draft.theme && draft.intro?.length &&
    draft.conclusion?.length && draft.chapters?.length && draft.chapters.every(chapter => chapter.title && chapter.paragraphs.length);
  const fields = active && <>
    <input type="hidden" name="workspace" value={active.id} />
    <input type="hidden" name="version" value={active.version} />
  </>;

  return <div className="editorial-shell editorial-standard historical-editorial">
    <header className={`editorial-heading${active ? " editorial-heading--sheet" : ""}`}>
      <div>
        <Link className="editorial-back" href={active ? base : archive}>{active ? "← Racconti di Messina" : "← Archivio editoriale"}</Link>
        <h1>{active ? draft?.title || "Nuovo racconto" : "Archivio editoriale"}</h1>
      </div>
      {active ? <div className="historical-heading-tools"><p className="editorial-current-state">
        <span className="editorial-badge" data-state={status(record?.published ?? false, active)}>{status(record?.published ?? false, active)}</span>
        {savedAt && <small> · Bozza salvata il <time dateTime={savedAt}>{savedLabel}</time></small>}
      </p>

      </div> : <form method="post" action={api}>
        <button className="editorial-button editorial-button--primary" name="action" value="create">Nuovo racconto</button>
      </form>}
    </header>

    {active && !active.archived && <nav className="editorial-actions editorial-sheet-nav" aria-label="Navigazione editoriale">
          {!active.archived && (preview
            ? <Link className="editorial-button" href={current}>Torna alla modifica</Link>
            : <Link className="editorial-button" href={`${current}&anteprima=1`}>Anteprima privata</Link>)}
          {record?.published && <Link className="editorial-button" href={`${publicBase}/${record.slug}`}>Versione pubblica</Link>}
        </nav>}
    {!active ? <>
      <nav className="editorial-actions editorial-sheet-nav" aria-label="Sezioni editoriali">
        <Link className="editorial-button" href={archive}>Monumenti</Link>
        <Link className="editorial-button" href={`${archive}?sezione=legend`}>Miti e leggende</Link>
        <Link className="editorial-button" href={`${archive}?sezione=village`}>Borghi</Link>
        <Link className="editorial-button" aria-current="page" href={base}>Racconti di Messina</Link>
      </nav>
      <section className="editorial-catalog">
        <div className="editorial-toolbar">
          <h2>Ti racconto la storia di Messina</h2>
          <form className="editorial-filters" action={base}>
            <label>Cerca per titolo<input name="q" type="search" defaultValue={query.q} /></label>
            <EditorialStatusFilter value={query.stato ?? ""} />
            <button className="editorial-button">Cerca</button>
          </form>
        </div>
        {rows.length ? <ul className="editorial-list">{rows.map(row => {
          const label = status(row.published, row.draft);
          return <li key={row.id}>
            <strong>{row.title}</strong><span className="editorial-badge" data-state={label}>{label}</span>
            {row.draft ? <Link className="editorial-button" href={`${base}?id=${row.draft.id}`}>{row.draft.archived ? "Visualizza" : "Modifica"}</Link>
              : <form method="post" action={api}>
                <input type="hidden" name="entry" value={row.id} />
                <button className="editorial-button" name="action" value="create">Modifica</button>
              </form>}
          </li>;
        })}</ul> : <p className="editorial-empty">Nessun racconto corrisponde ai filtri.</p>}
      </section>
    </> : <>

      {preview ? <>
        {notice && <p role="status" className="editorial-notice">{notice}</p>}
        <HistoricalStoryView preview entries={entries} definition={{
          key: record?.slug ?? active.id, title: draft?.title || "Racconto senza titolo", subtitle: draft?.subtitle ?? "",
          cover: draft?.cover, sources: draft?.sources, theme: draft?.theme ?? "", intro: draft?.intro ?? [], chapters: draft?.chapters ?? [], conclusion: draft?.conclusion ?? [],
        }} />
      </> : <EditorialDraftForm saveRequest={randomUUID()} key={`${active.id}:${active.version}`} action={api} formId="historical-text-form"
        saveId="historical-save" notices={notices} message={savedOrError ? (query.esito === "save" && savedLabel ? `Bozza salvata · ${savedLabel}` : notice) : savedLabel ? `Ultimo salvataggio · ${savedLabel}` : undefined}
        saved={Boolean(success || !savedOrError && savedLabel)}
        photoControls={<EditorialPhotoFields form="historical-text-form" cover={draft?.cover} />}
        publicationControls={<>
          <section className="editorial-panel" id="historical-publication">
            <h2>Pubblicazione</h2>
            {record?.protected ? <p>Versione pubblica protetta. Puoi lavorare in bozza e controllare l’anteprima.</p> : <form method="post" action={api}>
              {fields}
              <p>{canPublish ? "Verrà pubblicata l’ultima bozza salvata." : "Salva i campi del racconto prima di pubblicare."}</p>
              <div className="editorial-actions">
                <button className="editorial-button editorial-button--primary" name="action" value="publish" disabled={!canPublish}>Pubblica racconto</button>
                {record?.published && <button className="editorial-button" name="action" value="withdraw">Ritira dal sito</button>}
              </div>
              <details className="editorial-sheet-management"><summary>Archiviazione</summary>
                <button className="editorial-button" name="action" value="archive">{record?.published ? "Archivia e ritira" : "Archivia racconto"}</button>
              </details>
            </form>}
            {query.esito && !["create", "save"].includes(query.esito) && notice &&
              <div className="editorial-notice" role={success ? "status" : "alert"}>
                <p>{notice}</p>
                {query.esito === "publish" && record?.published && <Link className="text-link" href={`${publicBase}/${record.slug}`}>Apri il racconto pubblicato →</Link>}
              </div>}
          </section>
        </>}>
          {fields}
          <HistoricalChapters draft={draft ?? {}} places={entries.map(({ slug, title }) => ({slug,title}))} />
          <EditorialSources initial={draft?.sources ?? []} />
        </EditorialDraftForm>}
    </>}
  </div>;
}
