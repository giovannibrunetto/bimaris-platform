"use server";

import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";

const allowedInterests = new Set(["cultura","miti-leggende","borghi","sapori-vino","mare","natura-trekking","esperienze"]);
const allowedCompanions = new Set(["solo","coppia","famiglia","amici"]);
const allowedTimes = new Set(["2-3-ore","mezza-giornata","giornata","piu-giorni"]);
const allowedPaces = new Set(["rilassato","equilibrato","intenso"]);

export async function saveOnboarding(formData: FormData) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const interests = formData.getAll("interests").map(String).filter(value => allowedInterests.has(value));
  const travelCompanion = String(formData.get("travel_companion") ?? "");
  const timeAvailable = String(formData.get("typical_time_available") ?? "");
  const preferredPace = String(formData.get("preferred_pace") ?? "");
  const newsletter = formData.get("newsletter") === "yes";
  const personalized = newsletter && formData.get("personalized") === "yes";

  if (!interests.length || !allowedCompanions.has(travelCompanion) || !allowedTimes.has(timeAvailable) || !allowedPaces.has(preferredPace)) {
    redirect("/profilo/onboarding?errore=dati");
  }

  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: String(formData.get("display_name") ?? "").trim() || null,
    onboarding_completed: true,
    travel_companion: travelCompanion,
    typical_time_available: timeAvailable,
    preferred_pace: preferredPace,
    updated_at: now,
  }, { onConflict: "user_id" });
  if (profileError) redirect("/profilo/onboarding?errore=salvataggio");

  const { error: deleteError } = await supabase.from("user_interests").delete().eq("user_id", user.id);
  if (deleteError) redirect("/profilo/onboarding?errore=salvataggio");

  const { error: interestsError } = await supabase.from("user_interests").insert(interests.map(interest_key => ({
    user_id: user.id,
    interest_key,
    explicit_score: 1,
    behavioral_score: 0,
    updated_at: now,
  })));
  if (interestsError) redirect("/profilo/onboarding?errore=salvataggio");

  const { error: newsletterError } = await supabase.from("newsletter_preferences").upsert({
    user_id: user.id,
    subscribed: newsletter,
    personalized,
    frequency: "weekly",
    consented_at: newsletter ? now : null,
    withdrawn_at: newsletter ? null : now,
    updated_at: now,
  }, { onConflict: "user_id" });
  if (newsletterError) redirect("/profilo/onboarding?errore=salvataggio");

  redirect("/profilo?onboarding=completato");
}
