import { notFound } from "next/navigation";
import MfaStagingClient from "./MfaStagingClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collaudo MFA · BIMARIS", robots: { index: false, follow: false } };

export default function MfaStagingPage() {
  // Independent of legacy admin auth. Never expose this workflow in production.
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/admin-individual-mfa" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://nzdeoimwikhoidtladnu.supabase.co"
  ) notFound();
  return <MfaStagingClient />;
}
