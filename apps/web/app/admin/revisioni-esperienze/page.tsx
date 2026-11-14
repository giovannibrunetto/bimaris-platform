import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * DT-QA-UX-06: the former revision queue duplicated the canonical experience
 * review form without its responsive styling. Keep a single review workflow.
 */
export default async function ExperienceRevisionsPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  redirect("/admin/operatori#pending-operators");
}
