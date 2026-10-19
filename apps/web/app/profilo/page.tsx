import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedStories } from "@/data/stories";
import { getPublishedVillages } from "@/data/villages";
import { getPublishedFoodProducts } from "@/data/food-products";

export const dynamic = "force-dynamic";

const labels: Record<string,string> = {"cultura":"Cultura e monumenti","miti-leggende":"Miti e leggende","borghi":"Borghi","sapori":"Sapori e vino","mare":"Mare","natura-trekking":"Natura e trekking","avventura":"Avventura","esperienze":"Esperienze"};

type Recommendation = { key:string; href:string; title:string; copy:string; kind:string; score:number; featured:boolean };

function experienceInterest(category: string) {
  if (category === "degustazioni") return "sapori";
  if (category === "mare") return "mare";
  if (category === "avventura") return "avventura";
  if (category === "trekking-natura") return "natura-trekking";
  return "esperienze";
}

export default async function ProfiloPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect("/accedi");

  const [{ data: profile }, { data: interests }, { data: saved }, { data: newsletter }, culture, stories, villages, products, experiences] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_interests").select("*").eq("user_id", userId),
    supabase.from("user_saved_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("newsletter_preferences").select("subscribed,personalized").eq("user_id", userId).maybeSingle(),
    getPublishedCultureEntries(),
    getPublishedStories(),
    getPublishedVillages(),
    getPublishedFoodProducts(),
    getPublishedExperiences(),
  ]);
  const { onboarding } = await searchParams;

  const ranked = [...(interests ?? [])]
    .map(item => ({...item, score: Number(item.explicit_score ?? 0) * 2 + Number(item.behavioral_score ?? 0)}))
    .filter(item => item.score > 0)
    .sort((a,b) => b.score - a.score);
  const interestScores = new Map(ranked.map(item => [item.interest_key, item.score]));
  const scoreFor = (key:string) => Number(interestScores.get(key) ?? 0);

  const candidates: Recommendation[] = [
    ...culture.map(item => ({ key:`culture:${item.id}`, href:`/cultura/${item.slug}`, title:item.title, copy:item.excerpt, kind:"Cultura", score:scoreFor("cultura"), featured:Boolean(item.featured) })),
    ...stories.map(item => ({ key:`story:${item.id}`, href:`/storie-miti-leggende/${item.slug}`, title:item.title, copy:item.excerpt, kind:"Miti e leggende", score:scoreFor("miti-leggende"), featured:Boolean(item.featured) })),
    ...villages.map(item => ({ key:`village:${item.id}`, href:`/borghi/${item.slug}`, title:item.name, copy:item.excerpt, kind:"Borghi", score:scoreFor("borghi"), featured:Boolean(item.featured) })),
    ...products.map(item => ({ key:`product:${item.id}`, href:`/sapori-territori/${item.slug}`, title:item.name, copy:item.excerpt, kind:"Sapori e territori", score:scoreFor("sapori"), featured:Boolean(item.featured) })),
    ...experiences.map(item => {
      const interestKey = experienceInterest(item.category);
      return { key:`experience:${item.id}`, href:`/esperienze/${item.slug}`, title:item.name, copy:item.excerpt, kind:item.categoryName, score:Math.max(scoreFor(interestKey), scoreFor("esperienze") * 0.8), featured:Boolean(item.featured) };
    }),
  ].filter(item => item.score > 0);

  const recommendations = candidates
    .sort((a,b) => (b.score + (b.featured ? 0.25 : 0)) - (a.score + (a.featured ? 0.25 : 0)))
    .filter((item,index,array) => index === array.findIndex(other => other.href === item.href))
    .slice(0,6);

  return <div className="container profile-page" style={{ padding: "48px 20px 80px" }}>
    <style>{`
      .profile-page .profile-recommendation-head { display:grid; grid-template-columns:minmax(0,1fr) minmax(260px,.9fr); gap:36px; align-items:end; }
      .profile-page .profile-recommendation-head h2 { margin-bottom:0; }
      .profile-page .profile-recommendation-head p { margin:0; max-width:620px; line-height:1.65; }
      .profile-page .profile-recommendation-grid { margin-top:28px; }
      .profile-page .profile-recommendation-card { min-width:0; overflow:hidden; }
      .profile-page .profile-recommendation-card h3,
      .profile-page .profile-recommendation-card p { overflow-wrap:anywhere; }
      @media (max-width: 700px) {
        .profile-page { padding-left:16px !important; padding-right:16px !important; }
        .profile-page .profile-recommendations { padding:34px 18px !important; margin-left:0; margin-right:0; }
        .profile-page .profile-recommendation-head { grid-template-columns:1fr; gap:14px; align-items:start; }
        .profile-page .profile-recommendation-head h2 { font-size:clamp(2.15rem,12vw,3.35rem); line-height:.98; max-width:100%; }
        .profile-page .profile-recommendation-head p { width:100%; font-size:.98rem; }
        .profile-page .profile-recommendation-grid { grid-template-columns:1fr !important; gap:14px; margin-top:24px; }
        .profile-page .profile-recommendation-card { padding:18px !important; border-radius:18px; }
        .profile-page .profile-recommendation-card h3 { font-size:1.45rem; line-height:1.12; margin-top:6px; }
        .profile-page .profile-recommendation-card p { line-height:1.55; }
      }
    `}</style>
    <div className="kicker">Il tuo BIMARIS</div><h1>{profile?.display_name ? `Ciao, ${profile.display_name}` : "Il tuo profilo"}</h1><p style={{ maxWidth: 720 }}>Qui raccogli ciò che vuoi scoprire e ciò che hai salvato. I suggerimenti BIMARIS diventano progressivamente più pertinenti in base alle preferenze che hai scelto e a come utilizzi la piattaforma.</p>
    {onboarding === "completato" ? <div className="detail-panel" style={{ marginTop: 22, padding: 16 }}>Profilo personalizzato. BIMARIS userà queste preferenze per rendere progressivamente più pertinenti i suggerimenti.</div> : null}
    <section className="section" style={{ paddingTop: 28 }}><div className="section-head"><div><div className="kicker">Preferenze</div><h2>I tuoi interessi</h2></div><Link className="text-link" href="/profilo/onboarding">{profile?.onboarding_completed ? "Modifica preferenze →" : "Personalizza BIMARIS →"}</Link></div>{ranked.length ? <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>{ranked.map(item => <span className="button" key={item.interest_key} style={{cursor:"default"}}>{labels[item.interest_key] ?? item.interest_key}</span>)}</div> : <div className="detail-panel"><h3>Rendiamo BIMARIS più vicino ai tuoi interessi</h3><p>Rispondi a tre domande rapide e scegli ciò che vuoi scoprire.</p><Link className="button" href="/profilo/onboarding">Inizia</Link></div>}</section>
    <section className="section sand profile-recommendations"><div className="section-head profile-recommendation-head"><div><div className="kicker">Per te</div><h2>Scelti in base ai tuoi interessi</h2></div><p>Luoghi, storie, borghi, sapori ed esperienze ordinati in base alle tue preferenze e, progressivamente, a ciò che esplori su BIMARIS.</p></div>{recommendations.length ? <div className="card-grid profile-recommendation-grid">{recommendations.map(item => <article className="card profile-recommendation-card" key={item.key}><div className="kicker">{item.kind}</div><h3>{item.title}</h3><p>{item.copy}</p><Link className="text-link" href={item.href}>Scopri →</Link></article>)}</div> : <div className="detail-panel"><h3>I suggerimenti si costruiscono con te</h3><p>Completa le preferenze e continua a esplorare BIMARIS: qui compariranno contenuti specifici più vicini ai tuoi interessi.</p><Link className="button" href="/profilo/onboarding">Personalizza BIMARIS</Link></div>}</section>
    <section className="section"><div className="section-head"><div><div className="kicker">Comunicazioni</div><h2>Newsletter</h2></div></div><p>{newsletter?.subscribed ? (newsletter.personalized ? "Newsletter attiva con contenuti personalizzati in base ai tuoi interessi." : "Newsletter BIMARIS attiva.") : "Newsletter non attiva. La scelta resta facoltativa e separata dal tuo account."}</p><Link className="text-link" href="/profilo/onboarding">Gestisci preferenze →</Link></section>
    <section className="section sand"><div className="section-head"><div><div className="kicker">Salvati</div><h2>La tua raccolta</h2></div></div>{saved?.length ? <p>Hai {saved.length} elementi salvati.</p> : <p>Non hai ancora salvato nulla. Esplora la mappa, i luoghi e le esperienze e costruisci la tua raccolta.</p>}<Link className="button" href="/mappa">Esplora la mappa</Link></section>
  </div>;
}
