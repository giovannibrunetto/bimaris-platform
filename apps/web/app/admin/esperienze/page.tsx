import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExperiencesPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");

  // The former all-in-one experience administration screen duplicated the
  // operator dossier/review workflow and still depended on the legacy
  // experience category model. Operatori ed Esperienze is now the canonical
  // operational queue; individual reviews live in the experience dossier.
  redirect("/admin/operatori");
}
