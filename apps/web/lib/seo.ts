import type { Metadata } from "next";

export const SITE_URL = "https://bimarisnet.it";
export const SITE_NAME = "BIMARIS";

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

export function isPublicIndexingEnabled() {
  return (
    process.env.VERCEL_ENV === "production" &&
    process.env.BIMARIS_PUBLIC_INDEXING === "true" &&
    process.env.BIMARIS_PRELAUNCH_MODE !== "true"
  );
}

export function publicRobotsMetadata(): Metadata["robots"] {
  const enabled = isPublicIndexingEnabled();
  return {
    index: enabled,
    follow: enabled,
    googleBot: {
      index: enabled,
      follow: enabled,
    },
  };
}

export const privateRobotsMetadata: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
