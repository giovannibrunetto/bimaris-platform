import type { MetadataRoute } from "next";
import { SITE_URL, isPublicIndexingEnabled } from "@/lib/seo";

const privatePaths = [
  "/admin/",
  "/api/",
  "/auth/",
  "/accedi",
  "/profilo",
  "/area-operatore/",
];

export default function robots(): MetadataRoute.Robots {
  if (!isPublicIndexingEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
