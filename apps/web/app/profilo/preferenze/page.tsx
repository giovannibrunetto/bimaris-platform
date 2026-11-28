import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import "../profile-ottanio.css";

async function saveNewsletter(formData: FormData) {
  "use server";

  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/accedi");

  const subscribed = formData.get("newsletter") === "yes";
  const personalized = subscribed && formData.get("personalized") === "yes";
  const now = new Date().toISOString();
  const { error } = await supabase.from("newsletter_preferences").upsert({
    user_id: user.id,
    subscribed,
    personalized,
    frequency: "weekly",
    consented_at: subscribed ? now : null,
    withdrawn_at: subscribed ? null : now,
    updated_at: now,
  }, { onConflict: "user_id" });

  if (error) redirect("/profilo/preferenze?errore=salvataggio");
  redirect("/profilo/preferenze?saved=1");
}

export default async function NewsletterPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; saved?: string }>;
}) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/accedi");

  const { data, error } = await supabase.from("newsletter_preferences")
    .select("subscribed,personalized")
    .eq("user_id", user.id)
    .maybeSingle();
  const status = await searchParams;

  return (
    <main className="profile-page newsletter-page">
      <style>{`
        .newsletter-shell { max-width: 680px; margin-inline: auto; padding: 28px 16px 48px; }
        .newsletter-panel { padding: clamp(20px, 5vw, 40px); border: 1px solid rgba(202,168,106,.3); border-radius: 24px; background: rgba(255,255,255,.045); color: #f7f2e9; }
        .newsletter-panel h1 { font: 400 clamp(34px, 5vw, 48px)/1.12 Georgia, serif; color: inherit; margin: 16px 0 24px; }
        .newsletter-form { display: grid; gap: 12px; }
        .newsletter-form label { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1px solid rgba(202,168,106,.23); border-radius: 12px; cursor: pointer; }
        .newsletter-form input { flex: none; width: 18px; height: 18px; margin: 2px 0 0; accent-color: #caa86a; }
        .newsletter-form .button { justify-self: start; margin-top: 8px; }
      `}</style>
      <div className="newsletter-shell">
        <section className="newsletter-panel">
          <Link className="text-link" href="/profilo">← Area personale</Link>
          <h1>Newsletter</h1>
          {status.saved === "1" && <p role="status">Preferenze newsletter salvate.</p>}
          {status.errore && <p role="alert">Salvataggio non riuscito. Riprova.</p>}
          {error ? (
            <p role="alert">Impossibile caricare le preferenze newsletter. Riprova.</p>
          ) : (
            <form action={saveNewsletter} className="newsletter-form">
              <label>
                <input type="checkbox" name="newsletter" value="yes" defaultChecked={data?.subscribed ?? false} />
                {" "}Ricevi la newsletter BIMARIS.
              </label>
              <label>
                <input type="checkbox" name="personalized" value="yes" defaultChecked={Boolean(data?.subscribed && data.personalized)} />
                {" "}Personalizza la newsletter in base ai tuoi interessi.
              </label>
              <button className="button" type="submit">Salva preferenze</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
