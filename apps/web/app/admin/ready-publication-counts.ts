import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { isReadyExperience } from "./ready-to-publish";
import { loadReadyEditorial } from "./ready-editorial";

export const loadPendingPublicationRevisions = cache(async () => {
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");
  return db.from("experience_revisions")
    .select("id,experience_id,experiences!inner(experience_origin)", { count: "exact" })
    .eq("status", "pending").neq("experiences.experience_origin", "bimaris");
});

export const loadReadyPublicationCounts = cache(async () => {
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");

  const [appointments, experiences, revisions, editorial] = await Promise.all([
    db.from("events").select("id", { count: "exact", head: true })
      .eq("verification_status", "verified").eq("published", false),
    db.from("experiences").select("id,review_status,published,experience_origin,operator:operators!experiences_operator_id_fkey(published)")
      .eq("review_status", "approved").eq("published", false),
    loadPendingPublicationRevisions(),
    loadReadyEditorial(db),
  ]);

  if (appointments.error || experiences.error || revisions.error) {
    throw new Error("Impossibile caricare i contenuti pronti da pubblicare");
  }

  const pendingRevisionIds = new Set((revisions.data ?? []).map(revision => revision.experience_id));
  const eventsToPublish = appointments.count ?? 0;
  const experiencesToPublish = (experiences.data ?? []).filter(
    item => isReadyExperience(item, pendingRevisionIds),
  ).length;
  const editorialToPublish = editorial.length;

  return {
    eventsToPublish,
    experiencesToPublish,
    editorialToPublish,
    readyToPublish: eventsToPublish + experiencesToPublish + editorialToPublish,
  };
});
