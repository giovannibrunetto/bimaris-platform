import type { MetadataRoute } from "next";
import { SITE_URL, isPublicIndexingEnabled } from "@/lib/seo";
import { liveCollectionOpen } from "@/lib/survey/live";
import { isIsolatedSurveyRequested, isIsolatedSurveyDeployment } from "@/lib/prelaunch-mode";

export const dynamic = "force-dynamic";

const surveyHost = "sondaggio.bimarisnet.it";
const privatePaths = ["/admin/", "/api/", "/auth/", "/accedi", "/profilo", "/area-operatore/"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isIsolatedSurveyRequested()) {
    if (!isIsolatedSurveyDeployment() || process.env.VERCEL_ENV !== "production" || !await liveCollectionOpen()) return { rules: { userAgent: "*", disallow: "/" } };
    return {
      rules: { userAgent: "*", allow: ["/questionario-cittadini$", "/privacy-questionario$"], disallow: "/" },
      sitemap: `https://${surveyHost}/sitemap.xml`,
    };
  }
  if (!isPublicIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: privatePaths }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
