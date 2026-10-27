import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExperiencesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  // The former all-in-one experience administration screen duplicated the
  // operator dossier/review workflow and still depended on the legacy
  // experience category model. Operatori ed Esperienze is now the canonical
  // operational queue; individual reviews live in the experience dossier.
  redirect("/admin/operatori");
}
