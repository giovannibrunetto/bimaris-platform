import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ItineraryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  duration_minutes: number | null;
  target: string | null;
  territory: string | null;
  published: boolean;
  featured: boolean;
  stops: Array<{
    id: string;
    position: number;
    custom_title: string | null;
    experience: { name: string } | null;
    culture: { title: string } | null;
    story: { title: string } | null;
    operator: { name: string } | null;
  }> | null;
};

type Option = { id: string; slug: string; label: string };

function stateMessage(state?: string) {
  const messages: Record<string, string> = {
    created: "Itinerario creato come bozza.",
    published: "Itinerario pubblicato.",
    unpublished: "Itinerario nascosto.",
    featured: "Itinerario messo in evidenza.",
    unfeatured: "Itinerario rimosso dalle proposte in evidenza.",
    "stop-added": "Tappa aggiunta.",
    "stop-deleted": "Tappa rimossa.",
    "no-stops": "Aggiungi almeno una tappa prima di pubblicare l'itinerario.",
    "invalid-data": "Controlla i campi obbligatori.",
    "action-error": "Operazione non riuscita. Controlla i dati e riprova.",
  };
  return state ? (messages[state] ?? state) : null;
}

function stopLabel(stop: NonNullable<ItineraryRow["stops"]>[number]) {
  return stop.culture?.title ?? stop.story?.title ?? stop.experience?.name ?? stop.operator?.name ?? stop.custom_title ?? "Tappa";
}

export default async function AdminItinerariesPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client non configurato");

  const [{ data: itinerariesData }, { data: culturesData }, { data: storiesData }, { data: experiencesData }, { data: operatorsData }] = await Promise.all([
    supabase.from("itineraries").select("id,slug,title,excerpt,duration_minutes,target,territory,published,featured,stops:itinerary_stops(id,position,custom_title,experience:experiences(name),culture:culture_entries(title),story:stories(title),operator:operators(name))").order("created_at", { ascending: false }),
    supabase.from("culture_entries").select("id,slug,title").eq("published", true).order("title"),
    supabase.from("stories").select("id,slug,title").eq("published", true).order("title"),
    supabase.from("experiences").select("id,slug,name").eq("published", true).order("name"),
    supabase.from("operators").select("id,slug,name").eq("published", true).eq("selection_status", "selected").order("name"),
  ]);

  const itineraries = (itinerariesData ?? []) as unknown as ItineraryRow[];
  const cultures: Option[] = (culturesData ?? []).map((item: any) => ({ id: item.id, slug: item.slug, label: item.title }));
  const stories: Option[] = (storiesData ?? []).map((item: any) => ({ id: item.id, slug: item.slug, label: item.title }));
  const experiences: Option[] = (experiencesData ?? []).map((item: any) => ({ id: item.id, slug: item.slug, label: item.name }));
  const operators: Option[] = (operatorsData ?? []).map((item: any) => ({ id: item.id, slug: item.slug, label: item.name }));
  const { state } = await searchParams;
  const message = stateMessage(state);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Area privata</div>
        <h1>Gestione itinerari</h1>
        <p>Crea percorsi ordinati collegando cultura, miti e leggende, esperienze e operatori già verificati.</p>
        <div className="actions">
          <Link className="button ghost" href="/admin">Dashboard</Link>
          <Link className="button" href="/itinerari" target="_blank" rel="noreferrer">Apri itinerari pubblici ↗</Link>
        </div>
      </section>

      {message && (
        <section style={{ padding: "22px 6vw 0" }}>
          <div className="detail-panel" style={{ padding: 16 }}>{message}</div>
        </section>
      )}

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Nuovo percorso</div><h2>Crea una bozza</h2></div>
          <p>Prima creiamo il percorso, poi aggiungiamo e ordiniamo le tappe. La pubblicazione avviene solo quando il percorso è pronto.</p>
        </div>

        <form className="form" method="post" action="/api/admin/itineraries">
          <input type="hidden" name="action" value="create" />
          <label>Titolo<input required name="title" placeholder="Es. Messina tra miti e monumenti" /></label>
          <label>Slug<input name="slug" placeholder="Generato dal titolo se lasciato vuoto" /></label>
          <label>Durata in minuti<input name="duration_minutes" inputMode="numeric" placeholder="Es. 240" /></label>
          <label>Ideale per<input name="target" placeholder="Es. Crocieristi, famiglie, food lovers" /></label>
          <label className="wide">Territorio<input name="territory" placeholder="Es. Messina e Stretto" /></label>
          <label className="wide">Testo breve<input required name="excerpt" maxLength={320} placeholder="Una frase chiara per la card" /></label>
          <label className="wide">Descrizione<textarea required name="description" /></label>
          <label className="wide">URL immagine<input name="image_url" placeholder="https://..." /></label>
          <label className="wide">Testo alternativo immagine<input name="image_alt" /></label>
          <label className="privacy-check"><input type="checkbox" name="featured" value="yes" /><span>Metti in evidenza</span></label>
          <div className="wide"><button className="button" type="submit">Crea bozza itinerario</button></div>
        </form>
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="kicker">Percorsi</div><h2>Itinerari presenti</h2></div>
          <p>{itineraries.filter(item => item.published).length} pubblicati su {itineraries.length} percorsi.</p>
        </div>

        <div style={{ display: "grid", gap: 22 }}>
          {itineraries.map(itinerary => {
            const stops = [...(itinerary.stops ?? [])].sort((a, b) => a.position - b.position);
            return (
              <article className="detail-panel" key={itinerary.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
                  <div>
                    <div className="eyebrow">{itinerary.territory ?? "Territorio non indicato"} · {itinerary.published ? "Online" : "Bozza"}</div>
                    <h3 style={{ marginBottom: 6 }}>{itinerary.title}</h3>
                    <div className="muted">{itinerary.duration_minutes ? `${itinerary.duration_minutes} min` : "Durata da definire"} · {stops.length} {stops.length === 1 ? "tappa" : "tappe"}</div>
                  </div>
                  <div className="actions" style={{ marginTop: 0 }}>
                    {itinerary.published && <Link className="text-link" href={`/itinerari/${itinerary.slug}`} target="_blank" rel="noreferrer">Apri sul sito ↗</Link>}
                    <form method="post" action="/api/admin/itineraries">
                      <input type="hidden" name="itinerary_id" value={itinerary.id} />
                      <button className="button ghost" name="action" value={itinerary.published ? "unpublish" : "publish"} type="submit">{itinerary.published ? "Nascondi" : "Pubblica"}</button>
                    </form>
                    <form method="post" action="/api/admin/itineraries">
                      <input type="hidden" name="itinerary_id" value={itinerary.id} />
                      <button className="button ghost" name="action" value={itinerary.featured ? "unfeature" : "feature"} type="submit">{itinerary.featured ? "Togli evidenza" : "In evidenza"}</button>
                    </form>
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <strong>Tappe</strong>
                  {stops.length > 0 ? (
                    <ol style={{ paddingLeft: 22, marginBottom: 20 }}>
                      {stops.map(stop => (
                        <li key={stop.id} style={{ padding: "6px 0" }}>
                          {stopLabel(stop)}
                          <form method="post" action="/api/admin/itineraries" style={{ display: "inline", marginLeft: 10 }}>
                            <input type="hidden" name="stop_id" value={stop.id} />
                            <button className="text-link" name="action" value="delete_stop" type="submit" style={{ border: 0, background: "transparent", cursor: "pointer" }}>Rimuovi</button>
                          </form>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="muted">Nessuna tappa ancora inserita.</p>}

                  <form className="form" method="post" action="/api/admin/itineraries" style={{ marginTop: 16 }}>
                    <input type="hidden" name="action" value="add_stop" />
                    <input type="hidden" name="itinerary_id" value={itinerary.id} />
                    <label className="wide">Aggiungi contenuto
                      <select required name="source_key" defaultValue="">
                        <option value="" disabled>Seleziona una tappa</option>
                        {cultures.length > 0 && <optgroup label="Cultura">{cultures.map(item => <option key={`culture-${item.id}`} value={`culture:${item.id}`}>{item.label}</option>)}</optgroup>}
                        {stories.length > 0 && <optgroup label="Miti e leggende">{stories.map(item => <option key={`story-${item.id}`} value={`story:${item.id}`}>{item.label}</option>)}</optgroup>}
                        {experiences.length > 0 && <optgroup label="Esperienze">{experiences.map(item => <option key={`experience-${item.id}`} value={`experience:${item.id}`}>{item.label}</option>)}</optgroup>}
                        {operators.length > 0 && <optgroup label="Operatori">{operators.map(item => <option key={`operator-${item.id}`} value={`operator:${item.id}`}>{item.label}</option>)}</optgroup>}
                        <optgroup label="Altro"><option value="custom">Tappa personalizzata</option></optgroup>
                      </select>
                    </label>
                    <label>Titolo personalizzato<input name="custom_title" placeholder="Solo per tappa personalizzata" /></label>
                    <label>Sosta consigliata (min)<input name="stay_minutes" inputMode="numeric" placeholder="Es. 30" /></label>
                    <label className="wide">Nota BIMARIS<input name="note" placeholder="Es. Da vedere alle 12:00 per il movimento dell'orologio" /></label>
                    <label className="wide">Google Maps / indirizzo<input name="google_maps_query" placeholder="Opzionale: utile soprattutto per miti o tappe personalizzate" /></label>
                    <div className="wide"><button className="button" type="submit">Aggiungi tappa</button></div>
                  </form>
                </div>
              </article>
            );
          })}
          {itineraries.length === 0 && <div className="detail-panel"><p>Nessun itinerario presente.</p></div>}
        </div>
      </section>
    </>
  );
}
