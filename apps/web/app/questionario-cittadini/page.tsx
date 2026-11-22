import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { surveyTestSession } from "@/lib/survey/security";
import { liveCollectionOpen } from "@/lib/survey/live";
import CitizenSurvey from "./CitizenSurvey";

export const dynamic = "force-dynamic";

const surveyUrl = "https://sondaggio.bimarisnet.it/questionario-cittadini";
const surveyTitle = "A Messina non c'è nenti? | Sondaggio cittadini BIMARIS";
const surveyDescription = "Come scopri cosa fare a Messina? Partecipa al breve sondaggio BIMARIS e raccontaci come cerchi eventi, luoghi ed esperienze in città.";

export async function generateMetadata(): Promise<Metadata> {
  const liveMode = await liveCollectionOpen();
  const indexable = liveMode && process.env.VERCEL_ENV === "production";
  return {
    title: surveyTitle,
    description: surveyDescription,
    alternates: indexable ? { canonical: surveyUrl } : undefined,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      title: surveyTitle,
      description: surveyDescription,
      url: surveyUrl,
      siteName: "BIMARIS",
      locale: "it_IT",
      type: "website",
    },
  };
}

export default async function CitizenSurveyPage() {
  const liveMode = await liveCollectionOpen();
  if (!liveMode && process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
  return <CitizenSurvey testMode={!liveMode && await surveyTestSession()} liveMode={liveMode} />;
}
