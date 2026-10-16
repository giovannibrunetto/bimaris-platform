import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";

export const dynamic = "force-dynamic";

const labels: Record<string,string> = {"cultura":"Cultura e monumenti","miti-leggende":"Miti e leggende","borghi":"Borghi","sapori":"Sapori e vino","mare":"Mare","natura-trekking":"Natura e trekking","avventura":"Avventura","esperienze":"Esperienze"};
const destinations: Record<string,{href:string;title:string;copy:string}> = {
  "cultura": { href:"/cultura", title:"Scopri cultura e monumenti", copy:"Luoghi, architetture e patrimonio storico selezionati da BIMARIS." },
  "miti-leggende": { href:"/storie-miti-leggende", title:"Entra nei miti dello Stretto", copy:"Storie e luoghi reali legati all'immaginario di Messina." },
  "borghi": { href:"/borghi", title:"Esplora i borghi", copy:"Borghi e punti di interesse da scoprire sul territorio." },
  "sapori": { href:"/sapori-territori", title:"Scopri sapori e territori", copy:"Prodotti, identità gastronomiche e territori messinesi." },
  "mare": { href:"/esperienze?categoria=mare", title:"Vivi il mare", copy:"Esperienze legate allo Stretto e alla costa." },
  "natura-trekking": { href:"/esperienze?categoria=trekking-natura", title:"Natura e trekking", copy:"Esperienze all'aperto e percorsi nella natura." },
  "avventura": { href:"/esperienze?categoria=avventura", title:"Cerca l'avventura", copy:"Attività dinamiche e modi diversi di vivere il territorio." },
  "esperienze": { href:"/esperienze", title:"Vivi un'esperienza BIMARIS", copy:"Degustazioni, mare, natura, visite e attività selezionate." },
};

export default async function ProfiloPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect("/accedi");

  const [{ data: profile }, { data: interests }, { data: saved }, { data: newsletter }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_interests").select("*").eq("user_id", userId),
    supabase.from("user_saved_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("newsletter_preferences").select("subscribed,personalized").eq("user_id", userId).maybeSingle(),
  ]);
  const { onboarding } = await searchParams;

  const ranked = [...(interests ?? [])]
    .map(item => ({...item, score: Number(item.explicit_score ?? 0) * 2 + Number(item.behavioral_score ?? 0)}))
    .filter(item => item.score > 0 && destinations[item.interest_key])
    .sort((a,b) => b.score - a.score);
  const suggestions = ranked.slice(0,3).map(item => ({ key:item.interest_key, ...destinations[item.interest_key] }));

  return <div className="container" style={{ padding: "48px 20px 80px" }}>
    <div className="kicker">Il tuo BIMARIS</div><h1>{profile?.display_name ? `Ciao, ${profile.display_name}` : "Il tuo profilo"}</h1><p style={{ maxWidth: 720 }}>Qui raccogli ciò che vuoi scoprire e ciò che hai salvato. I suggerimenti BIMARIS diventano progressivamente più pertinenti in base alle preferenze che hai scelto e a come utilizzi la piattaforma.</p>
    {onboarding === "completato" ? <div className="detail-panel" style={{ marginTop: 22, padding: 16 }}>Profilo personalizzato. BIMARIS userà queste preferenze per rendere progressivamente più pertinenti i suggerimenti.</div> : null}
    <section className="section" style={{ paddingTop: 28 }}><div className="section-head"><div><div className="kicker">Preferenze</div><h2>I tuoi interessi</h2></div><Link className="text-link" href="/profilo/onboarding">{profile?.onboarding_completed ? "Modifica preferenze →" : "Personalizza BIMARIS →"}</Link></div>{interests?.length ? <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>{ranked.map(item => <span className="button" key={item.interest_key} style={{cursor:"default"}}>{labels[item.interest_key] ?? item.interest_key}</span>)}</div> : <div className="detail-panel"><h3>Rendiamo BIMARIS più vicino ai tuoi interessi</h3><p>Rispondi a tre domande rapide e scegli ciò che vuoi scoprire.</p><Link className="button" href="/profilo/onboarding">Inizia</Link></div>}</section>
    <section className="section sand"><div className="section-head"><div><div className="kicker">Per te</div><h2>Da dove potresti continuare</h2></div></div>{suggestions.length ? <div className="card-grid">{suggestions.map(item => <article className="card" key={item.key}><div className="kicker">{labels[item.key] ?? item.key}</div><h3>{item.title}</h3><p>{item.copy}</p><Link className="text-link" href={item.href}>Scopri →</Link></article>)}</div> : <div className="detail-panel"><h3>I suggerimenti si costruiscono con te</h3><p>Completa le preferenze e continua a esplorare BIMARIS: questa sezione inizierà a proporti contenuti più vicini ai tuoi interessi.</p><Link className="button" href="/profilo/onboarding">Personalizza BIMARIS</Link></div>}</section>
    <section className="section"><div className="section-head"><div><div className="kicker">Comunicazioni</div><h2>Newsletter</h2></div></div><p>{newsletter?.subscribed ? (newsletter.personalized ? "Newsletter attiva con contenuti personalizzati in base ai tuoi interessi." : "Newsletter BIMARIS attiva.") : "Newsletter non attiva. La scelta resta facoltativa e separata dal tuo account."}</p><Link className="text-link" href="/profilo/onboarding">Gestisci preferenze →</Link></section>
    <section className="section sand"><div className="section-head"><div><div className="kicker">Salvati</div><h2>La tua raccolta</h2></div></div>{saved?.length ? <p>Hai {saved.length} elementi salvati.</p> : <p>Non hai ancora salvato nulla. Esplora la mappa, i luoghi e le esperienze e costruisci la tua raccolta.</p>}<Link className="button" href="/mappa">Esplora la mappa</Link></section>
  </div>;
}
