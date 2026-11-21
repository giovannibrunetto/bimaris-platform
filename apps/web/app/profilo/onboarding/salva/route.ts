import { NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";

const allowedInterests = new Set(["cultura","miti-leggende","borghi","sapori","mare","natura-trekking","avventura","esperienze"]);
const allowedCompanions = new Set(["solo","coppia","famiglia","amici"]);
const allowedTimes = new Set(["2-3-ore","mezza-giornata","giornata","piu-giorni"]);
const allowedPaces = new Set(["rilassato","equilibrato","intenso"]);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const supabase = await createUserServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/accedi", url.origin), 303);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/accedi", url.origin), 303);

  const formData = await request.formData();
  const interests = new Set(formData.getAll("interests").map(String).filter((value) => allowedInterests.has(value)));
  const travelCompanion = String(formData.get("travel_companion") ?? "");
  const timeAvailable = String(formData.get("typical_time_available") ?? "");
  const preferredPace = String(formData.get("preferred_pace") ?? "");
  const newsletter = formData.get("newsletter") === "yes";
  const personalized = formData.get("personalized") === "yes";

  if (!interests.size || !allowedCompanions.has(travelCompanion) || !allowedTimes.has(timeAvailable) || !allowedPaces.has(preferredPace)) {
    return NextResponse.redirect(new URL("/profilo/onboarding?errore=dati", url.origin), 303);
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
  if (profileError) return NextResponse.redirect(new URL("/profilo/onboarding?errore=salvataggio", url.origin), 303);

  const { error: interestsError } = await supabase.from("user_interests").upsert(
    [...allowedInterests].map(interestKey => ({
      user_id: user.id,
      interest_key: interestKey,
      explicit_score: interests.has(interestKey) ? 1 : 0,
      updated_at: now,
    })),
    { onConflict: "user_id,interest_key" },
  );
  if (interestsError) return NextResponse.redirect(new URL("/profilo/onboarding?errore=salvataggio", url.origin), 303);

  const { error: newsletterError } = await supabase.from("newsletter_preferences").upsert({
    user_id: user.id,
    subscribed: newsletter,
    personalized,
    frequency: "weekly",
    consented_at: newsletter ? now : null,
    withdrawn_at: newsletter ? null : now,
    updated_at: now,
  }, { onConflict: "user_id" });
  if (newsletterError) return NextResponse.redirect(new URL("/profilo/onboarding?errore=salvataggio", url.origin), 303);

  return NextResponse.redirect(new URL("/profilo?onboarding=completato", url.origin), 303);
}
