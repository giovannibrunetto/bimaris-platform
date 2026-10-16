import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";

export const dynamic = "force-dynamic";

const labels: Record<string,string> = {"cultura":"Cultura e monumenti","miti-leggende":"Miti e leggende","borghi":"Borghi","sapori-vino":"Sapori e vino","mare":"Mare","natura-trekking":"Natura e trekking","esperienze":"Esperienze"};

export default async function ProfiloPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const [{ data: profile }, { data: interests }, { data: saved }, { data: newsletter }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_interests").select("*").eq("user_id", user.id).order("explicit_score", { ascending: false }),
    supabase.from("user_saved_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
    supabase.from("newsletter_preferences").select("subscribed,personalized").eq("user_id", user.id).maybeSingle(),
  ]);
  const { onboarding } = await searchParams;

  return <div className="container" style={{ padding: "48px 20px 80px" }}>
    <div className="kicker">Il tuo BIMARIS</div><h1>{profile?.display_name ? `Ciao, ${profile.display_name}` : "Il tuo profilo"}</h1><p style={{ maxWidth: 720 }}>Qui raccogli ciò che vuoi scoprire e ciò che hai salvato. I suggerimenti BIMARIS potranno diventare più pertinenti man mano che utilizzi la piattaforma.</p>
    {onboarding === "completato" ? <div className="detail-panel" style={{ marginTop: 22, padding: 16 }}>Profilo personalizzato. BIMARIS userà queste preferenze per rendere progressivamente più pertinenti i suggerimenti.</div> : null}
    <section className="section" style={{ paddingTop: 28 }}><div className="section-head"><div><div className="kicker">Preferenze</div><h2>I tuoi interessi</h2></div><Link className="text-link" href="/profilo/onboarding">{profile?.onboarding_completed ? "Modifica preferenze →" : "Personalizza BIMARIS →"}</Link></div>{interests?.length ? <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>{interests.map(item => <span className="button" key={item.interest_key} style={{cursor:"default"}}>{labels[item.interest_key] ?? item.interest_key}</span>)}</div> : <div className="detail-panel"><h3>Rendiamo BIMARIS più vicino ai tuoi interessi</h3><p>Rispondi a tre domande rapide e scegli ciò che vuoi scoprire.</p><Link className="button" href="/profilo/onboarding">Inizia</Link></div>}</section>
    <section className="section sand"><div className="section-head"><div><div className="kicker">Comunicazioni</div><h2>Newsletter</h2></div></div><p>{newsletter?.subscribed ? (newsletter.personalized ? "Newsletter attiva con contenuti personalizzati in base ai tuoi interessi." : "Newsletter BIMARIS attiva.") : "Newsletter non attiva. La scelta resta facoltativa e separata dal tuo account."}</p><Link className="text-link" href="/profilo/onboarding">Gestisci preferenze →</Link></section>
    <section className="section"><div className="section-head"><div><div className="kicker">Salvati</div><h2>La tua raccolta</h2></div></div>{saved?.length ? <p>Hai {saved.length} elementi salvati.</p> : <p>Non hai ancora salvato nulla. Esplora la mappa, i luoghi e le esperienze e costruisci la tua raccolta.</p>}<Link className="button" href="/mappa">Esplora la mappa</Link></section>
  </div>;
}
