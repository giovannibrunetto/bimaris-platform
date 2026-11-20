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
    <main className="profile-page">
      <div className="profile-shell">
        <section className="profile-hero">
          <Link className="text-link" href="/profilo">← Area personale</Link>
          <h1>Newsletter</h1>
          {status.saved === "1" && <p role="status">Preferenze newsletter salvate.</p>}
          {status.errore && <p role="alert">Salvataggio non riuscito. Riprova.</p>}
          {error ? (
            <p role="alert">Impossibile caricare le preferenze newsletter. Riprova.</p>
          ) : (
            <form action={saveNewsletter} style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
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
