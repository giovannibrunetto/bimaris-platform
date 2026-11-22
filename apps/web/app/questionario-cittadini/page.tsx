import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { surveyTestSession } from "@/lib/survey/security";
import { liveCollectionOpen } from "@/lib/survey/live";
import { isIsolatedSurveyDeployment } from "@/lib/prelaunch-mode";
import CitizenSurvey from "./CitizenSurvey";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const indexable = await liveCollectionOpen() && isIsolatedSurveyDeployment();
  return {
    title: "A Messina non c'è nenti? | Sondaggio cittadini BIMARIS",
    description: "Partecipa al breve sondaggio BIMARIS su come scoprire eventi, luoghi ed esperienze a Messina.",
    alternates: indexable ? { canonical: "https://sondaggio.bimarisnet.it/questionario-cittadini" } : undefined,
    robots: { index: indexable, follow: indexable, noarchive: !indexable },
  };
}

export default async function CitizenSurveyPage() {
  const liveMode = await liveCollectionOpen();
  if (!liveMode && !isIsolatedSurveyDeployment() && process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
  return <CitizenSurvey testMode={!liveMode && await surveyTestSession()} liveMode={liveMode} />;
}
