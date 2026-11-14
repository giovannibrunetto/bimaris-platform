import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accesso MFA · BIMARIS", robots: { index: false, follow: false } };

/**
 * DS-MFA-01/L-V34: retire the obsolete staging-only test form.
 * All individual admin access uses the canonical /admin/login -> /admin/mfa
 * path, which supports the two approved Staging test identities.
 */
export default function MfaStagingPage() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/admin-individual-mfa" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://nzdeoimwikhoidtladnu.supabase.co"
  ) notFound();
  redirect("/admin/login");
}
