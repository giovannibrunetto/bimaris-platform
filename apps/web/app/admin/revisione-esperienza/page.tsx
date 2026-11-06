import { notFound, redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Percorso amministrativo storico.
 * Tutte le revisioni devono utilizzare una sola schermata canonica.
 */
export default async function LegacyExperienceReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; state?: string }>;
}) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");

  const { id, state } = await searchParams;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const query = state ? `?state=${encodeURIComponent(state)}` : "";
  redirect(`/admin/esperienze/${encodeURIComponent(id)}/revisione${query}#admin-review-decision`);
}
