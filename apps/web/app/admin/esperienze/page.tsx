import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExperiencesPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");

  redirect("/admin/attivita?tipo=esperienze");
}
