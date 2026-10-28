import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import RevisionReviewPage from "../../../revisioni-esperienze/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExperienceRevisionReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  // Keep a stable per-experience review URL. The shared review surface
  // remains the single implementation for comparison and admin actions.
  await params;
  return <RevisionReviewPage searchParams={searchParams} />;
}
