import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { saveOnboarding } from "./actions";

export const dynamic = "force-dynamic";

const interests = [
  ["cultura", "Cultura e monumenti", "Chiese, architettura, musei e luoghi storici"],
  ["miti-leggende", "Miti e leggende", "Storie, personaggi e immaginario dello Stretto"],
  ["borghi", "Borghi", "Paesi, centri storici e territori da scoprire"],
  ["sapori", "Sapori e vino", "Prodotti tipici, cantine, produttori e degustazioni"],
  ["mare", "Mare", "Stretto, costa, barca e attività sul mare"],
  ["natura-trekking", "Natura e trekking", "Sentieri, panorami e attività all'aperto"],
  ["esperienze", "Esperienze", "Attività selezionate da vivere sul territorio"],
] as const;

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const [{ data: profile }, { data: selected }, { data: newsletter }] = await Promise.all([
    supabase.from("user_profiles").select("display_name,travel_companion,typical_time_available,preferred_pace").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_interests").select("interest_key").eq("user_id", user.id),
    supabase.from("newsletter_preferences").select("subscribed,personalized").eq("user_id", user.id).maybeSingle(),
  ]);
  const selectedKeys = new Set((selected ?? []).map(item => item.interest_key));
  const { errore } = await searchParams;

  return <div className="container" style={{ padding: "48px 20px 80px", maxWidth: 980 }}>
    <div className="kicker">Il tuo BIMARIS</div>
    <h1>Che Messina vuoi vivere?</h1>
    <p style={{ maxWidth: 760, fontSize: "1.08rem", lineHeight: 1.7 }}>Bastano pochi secondi. Queste risposte creano il primo profilo dei tuoi interessi; BIMARIS potrà poi affinarlo in base a ciò che scegli di esplorare e salvare.</p>
    {errore ? <div className="detail-panel" style={{ marginTop: 22, padding: 16 }}>Non siamo riusciti a salvare le preferenze. Controlla di aver risposto alle domande obbligatorie e riprova.</div> : null}

    <form action={saveOnboarding} className="form" style={{ marginTop: 32 }}>
      <label className="wide">Come vuoi essere chiamato? <span className="muted">(facoltativo)</span><input name="display_name" defaultValue={profile?.display_name ?? ""} placeholder="Il tuo nome" /></label>

      <fieldset className="wide" style={{ border: 0, padding: 0, margin: 0 }}><legend><strong>1. Cosa ti interessa?</strong> <span className="muted">Scegli una o più opzioni</span></legend><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>{interests.map(([value,title,description]) => <label className="detail-panel" key={value} style={{ padding: 16, cursor: "pointer" }}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><input type="checkbox" name="interests" value={value} defaultChecked={selectedKeys.has(value)} /><span><strong>{title}</strong><br/><small className="muted">{description}</small></span></div></label>)}</div></fieldset>

      <label>2. Con chi vivi più spesso le tue esperienze?<select required name="travel_companion" defaultValue={profile?.travel_companion ?? ""}><option value="" disabled>Seleziona</option><option value="solo">Da solo</option><option value="coppia">In coppia</option><option value="famiglia">In famiglia</option><option value="amici">Con amici</option></select></label>
      <label>3. Quanto tempo hai di solito?<select required name="typical_time_available" defaultValue={profile?.typical_time_available ?? ""}><option value="" disabled>Seleziona</option><option value="2-3-ore">2–3 ore</option><option value="mezza-giornata">Mezza giornata</option><option value="giornata">Una giornata</option><option value="piu-giorni">Più giorni</option></select></label>
      <label>4. Che ritmo preferisci?<select required name="preferred_pace" defaultValue={profile?.preferred_pace ?? ""}><option value="" disabled>Seleziona</option><option value="rilassato">Rilassato</option><option value="equilibrato">Equilibrato</option><option value="intenso">Voglio vedere il più possibile</option></select></label>

      <div className="wide detail-panel" style={{ padding: 20 }}><div className="kicker">Newsletter</div><h3 style={{ marginTop: 4 }}>Vuoi ricevere idee scelte per te?</h3><p className="muted">È facoltativo e separato dalla creazione dell'account. Potrai cambiare idea in qualsiasi momento.</p><label className="privacy-check"><input type="checkbox" name="newsletter" value="yes" defaultChecked={newsletter?.subscribed ?? false}/><span>Sì, desidero ricevere la newsletter BIMARIS.</span></label><label className="privacy-check"><input type="checkbox" name="personalized" value="yes" defaultChecked={newsletter?.personalized ?? false}/><span>Personalizza i contenuti della newsletter in base ai miei interessi BIMARIS.</span></label></div>
      <div className="wide"><button className="button" type="submit">Salva e crea il mio profilo BIMARIS</button></div>
    </form>
  </div>;
}
