import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Candidate } from "./match";

/** Read-only, public-safe discovery candidates. No publication bypass. */
export async function loadDiscoveryCandidates(): Promise<Candidate[]> {
  const client = createPublicClient();
  if (!client) return [];
  const { data, error } = await client.from("experiences")
    .select("id,duration_minutes,latitude,longitude,published,review_status,operator:operators!experiences_operator_id_fkey(published,selection_status),profile:experience_discovery_profiles(discovery_active,children_allowed,minimum_age,editorial_weight),interests:experience_discovery_intents(intent_key)")
    .eq("published", true).eq("review_status", "approved");
  if (error || !data) {
    if (error) console.error("BIMARIS discovery candidates read failed", error.message);
    return [];
  }
  type Row = {
    id: string; duration_minutes: number | null; latitude: number | null; longitude: number | null;
    published: boolean; review_status: string;
    operator: { published: boolean; selection_status: string } | null;
    profile: { discovery_active: boolean; children_allowed: boolean; minimum_age: number | null; editorial_weight: number | null } | { discovery_active: boolean; children_allowed: boolean; minimum_age: number | null; editorial_weight: number | null }[] | null;
    interests: { intent_key: string }[] | null;
  };
  return (data as unknown as Row[]).flatMap(row => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (row.published !== true || row.review_status !== "approved" ||
        row.operator?.published !== true || row.operator?.selection_status !== "selected" ||
        profile?.discovery_active !== true) return [];
    return [{
      id: row.id, published: true, operatorPublished: true, operatorSelected: true,
      discoveryActive: true, intents: (row.interests ?? []).map(i => i.intent_key),
      childrenAllowed: profile.children_allowed === true, minimumAge: profile.minimum_age,
      durationMinutes: row.duration_minutes,
      destinationVerified: Number.isFinite(Number(row.latitude)) && row.latitude != null &&
        Number.isFinite(Number(row.longitude)) && row.longitude != null &&
        Number(row.latitude) >= -90 && Number(row.latitude) <= 90 &&
        Number(row.longitude) >= -180 && Number(row.longitude) <= 180,
      editorialWeight: profile.editorial_weight ?? 0,
      // Recurring availability must be resolved separately with Europe/Rome timezone.
      slots: []
    } satisfies Candidate];
  });
}
