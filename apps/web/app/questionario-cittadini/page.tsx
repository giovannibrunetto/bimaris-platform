import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { surveyTestSession } from "@/lib/survey/security";
import { liveCollectionOpen } from "@/lib/survey/live";
import CitizenSurvey from "./CitizenSurvey";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "A MESSINA NON C'È NENTI! | BIMARIS — Messina da vivere",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function CitizenSurveyPage() {
  const liveMode = await liveCollectionOpen();
  if (!liveMode && process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
  return <CitizenSurvey testMode={!liveMode && await surveyTestSession()} liveMode={liveMode} />;
}
