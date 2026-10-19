import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import CinematicOnboarding from "./CinematicOnboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (claimsError || !userId) redirect("/accedi");

  const [{ data: profile }, { data: selected }, { data: newsletter }] = await Promise.all([
    supabase.from("user_profiles").select("display_name,travel_companion,typical_time_available,preferred_pace").eq("user_id", userId).maybeSingle(),
    supabase.from("user_interests").select("interest_key").eq("user_id", userId),
    supabase.from("newsletter_preferences").select("subscribed,personalized").eq("user_id", userId).maybeSingle(),
  ]);

  const { errore } = await searchParams;

  return <CinematicOnboarding
    profile={profile}
    selectedKeys={(selected ?? []).map(item => item.interest_key)}
    newsletter={newsletter}
    error={Boolean(errore)}
  />;
}
