import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";

export const dynamic = "force-dynamic";

export default async function ProfiloPage() {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const [{ data: profile }, { data: interests }, { data: saved }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_interests").select("*").eq("user_id", user.id).order("declared_score", { ascending: false }),
    supabase.from("user_saved_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
  ]);

  return (
    <div className="container" style={{ padding: "48px 20px 80px" }}>
      <div className="kicker">Il tuo BIMARIS</div>
      <h1>{profile?.display_name ? `Ciao, ${profile.display_name}` : "Il tuo profilo"}</h1>
      <p style={{ maxWidth: 720 }}>Qui raccogli ciò che vuoi scoprire e ciò che hai salvato. I suggerimenti BIMARIS potranno diventare più pertinenti man mano che utilizzi la piattaforma.</p>

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="section-head"><div><div className="kicker">Preferenze</div><h2>I tuoi interessi</h2></div></div>
        {interests?.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{interests.map(item => <span className="button" key={item.id} style={{ cursor: "default" }}>{item.interest_key}</span>)}</div>
        ) : <p>Non hai ancora indicato i tuoi interessi. Il prossimo passaggio sarà un breve onboarding per personalizzare BIMARIS.</p>}
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Salvati</div><h2>La tua raccolta</h2></div></div>
        {saved?.length ? <p>Hai {saved.length} elementi salvati.</p> : <p>Non hai ancora salvato nulla. Esplora la mappa, i luoghi e le esperienze e costruisci la tua raccolta.</p>}
        <Link className="button" href="/mappa">Esplora la mappa</Link>
      </section>
    </div>
  );
}
