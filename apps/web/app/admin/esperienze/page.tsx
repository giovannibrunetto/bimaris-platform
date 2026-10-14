import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operator = { id: string; name: string; published: boolean; selection_status: string };
type Option = { id: string; name: string; slug: string };
type ExperienceRow = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  featured: boolean;
  bookable: boolean;
  duration_minutes: number | null;
  price_from: number | string | null;
  operator: { name: string } | null;
  territory: { name: string } | null;
  category: { name: string } | null;
};

function stateMessage(state?: string) {
  const messages: Record<string, string> = {
    created: "Esperienza creata.",
    published: "Esperienza pubblicata.",
    unpublished: "Esperienza nascosta.",
    featured: "Esperienza messa in evidenza.",
    unfeatured: "Esperienza rimossa dalle esperienze in evidenza.",
    "operator-not-published": "Prima di pubblicare l'esperienza devi pubblicare anche l'operatore associato.",
    "invalid-data": "Controlla i campi obbligatori.",
    "action-error": "Operazione non riuscita. Controlla i dati e riprova.",
  };
  return state ? (messages[state] ?? state) : null;
}

export default async function AdminExperiencesPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client non configurato");

  const [{ data: operatorsData }, { data: territoriesData }, { data: categoriesData }, { data: experiencesData }] = await Promise.all([
    supabase.from("operators").select("id,name,published,selection_status").eq("selection_status", "selected").order("name"),
    supabase.from("territories").select("id,name,slug").eq("active", true).order("name"),
    supabase.from("categories").select("id,name,slug").neq("slug", "famiglia").order("name"),
    supabase.from("experiences").select("id,slug,name,published,featured,bookable,duration_minutes,price_from,operator:operators(name),territory:territories(name),category:categories(name)").order("created_at", { ascending: false }),
  ]);

  const operators = (operatorsData ?? []) as Operator[];
  const territories = (territoriesData ?? []) as Option[];
  const categories = (categoriesData ?? []) as Option[];
  const experiences = (experiencesData ?? []) as unknown as ExperienceRow[];
  const { state } = await searchParams;
  const message = stateMessage(state);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Area privata</div>
        <h1>Gestione esperienze</h1>
        <p>Crea le esperienze BIMARIS collegandole a un operatore selezionato, a un territorio e a una categoria.</p>
        <div className="actions">
          <Link className="button ghost" href="/admin">Dashboard</Link>
          <Link className="button" href="/esperienze">Apri catalogo pubblico</Link>
        </div>
      </section>

      {message && (
        <section style={{ padding: "22px 6vw 0" }}>
          <div className="detail-panel" style={{ padding: 16 }}>{message}</div>
        </section>
      )}

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Nuova scheda</div><h2>Crea un'esperienza</h2></div>
          <p>La pubblicazione è possibile solo se l'operatore associato è già online.</p>
        </div>

        {operators.length === 0 ? (
          <div className="detail-panel">
            <h3>Prima serve un operatore selezionato</h3>
            <p>Approva almeno una candidatura operatore dalla dashboard; poi potrai creare le sue esperienze.</p>
            <Link className="text-link" href="/admin">Vai alle candidature →</Link>
          </div>
        ) : (
          <form className="form" method="post" action="/api/admin/experiences">
            <input type="hidden" name="action" value="create" />
            <label>Nome esperienza<input required name="name" placeholder="Es. Tramonto in barca nello Stretto" /></label>
            <label>Slug<input name="slug" placeholder="Generato dal nome se lasciato vuoto" /></label>
            <label>Operatore
              <select required name="operator_id" defaultValue="">
                <option value="" disabled>Seleziona operatore</option>
                {operators.map(item => <option key={item.id} value={item.id}>{item.name}{item.published ? " · online" : " · non pubblicato"}</option>)}
              </select>
            </label>
            <label>Territorio
              <select required name="territory_id" defaultValue="">
                <option value="" disabled>Seleziona territorio</option>
                {territories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Categoria
              <select required name="category_id" defaultValue="">
                <option value="" disabled>Seleziona categoria</option>
                {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Durata in minuti<input name="duration_minutes" inputMode="numeric" placeholder="Es. 120" /></label>
            <label>Prezzo da (€)<input name="price_from" inputMode="decimal" placeholder="Es. 45" /></label>
            <label>Punto di incontro<input name="meeting_point" placeholder="Es. Marina del Nettuno, Messina" /></label>
            <label className="wide">Testo breve<input required name="excerpt" maxLength={300} placeholder="Una frase chiara per la card dell'esperienza" /></label>
            <label className="wide">Descrizione<textarea required name="description" /></label>
            <label className="wide">Perché BIMARIS la seleziona<textarea required name="why_selected" /></label>
            <label className="wide">Query Google Maps<input name="google_maps_query" placeholder="Nome preciso del punto di incontro o indirizzo" /></label>
            <label>Latitudine<input name="latitude" inputMode="decimal" placeholder="Opzionale" /></label>
            <label>Longitudine<input name="longitude" inputMode="decimal" placeholder="Opzionale" /></label>
            <label className="wide">URL immagine<input name="image_url" placeholder="https://..." /></label>
            <label className="wide">Testo alternativo immagine<input name="image_alt" /></label>
            <label className="wide">URL prenotazione<input name="booking_url" placeholder="Pagina di prenotazione dell'operatore" /></label>
            <label className="wide">Nota prenotazione<input name="booking_note" placeholder="Es. Prenotazione consigliata con almeno 24 ore di anticipo" /></label>
            <label className="privacy-check"><input type="checkbox" name="bookable" value="yes" /><span>Esperienza prenotabile</span></label>
            <label className="privacy-check"><input type="checkbox" name="featured" value="yes" /><span>Metti in evidenza</span></label>
            <label className="privacy-check"><input type="checkbox" name="published" value="yes" /><span>Pubblica subito</span></label>
            <div className="wide"><button className="button" type="submit">Crea esperienza</button></div>
          </form>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="kicker">Catalogo</div><h2>Esperienze presenti</h2></div>
          <p>{experiences.filter(item => item.published).length} pubblicate su {experiences.length} schede.</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Esperienza</th><th>Operatore</th><th>Territorio</th><th>Categoria</th><th>Stato</th><th>Azioni</th></tr></thead>
            <tbody>
              {experiences.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><br /><code>{item.slug}</code>{item.featured ? <><br /><small>In evidenza</small></> : null}</td>
                  <td>{item.operator?.name ?? "—"}</td>
                  <td>{item.territory?.name ?? "—"}</td>
                  <td>{item.category?.name ?? "—"}</td>
                  <td>{item.published ? "Online" : "Non pubblicata"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {item.published && <Link className="text-link" href={`/esperienze/${item.slug}`}>Apri</Link>}
                      <form method="post" action="/api/admin/experiences">
                        <input type="hidden" name="experience_id" value={item.id} />
                        <button className="button ghost" name="action" value={item.published ? "unpublish" : "publish"} type="submit">{item.published ? "Nascondi" : "Pubblica"}</button>
                      </form>
                      <form method="post" action="/api/admin/experiences">
                        <input type="hidden" name="experience_id" value={item.id} />
                        <button className="button ghost" name="action" value={item.featured ? "unfeature" : "feature"} type="submit">{item.featured ? "Togli evidenza" : "In evidenza"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 && <tr><td colSpan={6}>Nessuna esperienza presente.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
