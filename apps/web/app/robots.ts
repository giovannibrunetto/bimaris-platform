import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "production" && process.env.BIMARIS_PRELAUNCH_MODE === "true") {
    return {
      rules: [{ userAgent: "*", allow: ["/in-arrivo", "/operatori/candidatura"], disallow: ["/api/", "/admin/", "/esperienze/", "/operatori/", "/mappa/", "/itinerari/", "/cultura/", "/borghi/"] }],
    };
  }
  return { rules: [{ userAgent: "*", allow: "/" }] };
}
