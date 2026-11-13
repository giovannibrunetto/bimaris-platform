// Restrict authentication redirects to BIMARIS domains and this project's previews.
export const PUBLIC_SITE_URL = "https://www.bimarisnet.it";

const ALLOWED_HOSTS = new Set([
  "bimarisnet.it",
  "www.bimarisnet.it",
  "bimaris-platform.vercel.app",
  "bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app",
  "bimaris-platform-git-feat-publis-affef4-giovannibrunetto84-1508.vercel.app",
]);

export function authRedirectOrigin(requestUrl: URL): string {
  const hostname = requestUrl.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.has(hostname) ||
    /^bimaris-platform-[a-z0-9-]+-giovannibrunetto84-1508\.vercel\.app$/.test(hostname);
  return allowed && requestUrl.protocol === "https:" ? requestUrl.origin : PUBLIC_SITE_URL;
}

export function safeAuthPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, PUBLIC_SITE_URL);
    if (url.origin !== PUBLIC_SITE_URL) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

// Single branch alias for the consolidated pre-launch acceptance candidate.
// Immutable Vercel deployment URLs must never start operator OAuth or OTP flows.
export const OPERATOR_QA_ORIGIN = "https://bimaris-platform-git-integration-7435f3-giovannibrunetto84-1508.vercel.app";

export function operatorOAuthEntryOrigin(origin: string): string {
  let url: URL;
  try { url = new URL(origin); } catch { return origin; }
  const isImmutablePreview = url.protocol === "https:" &&
    /^bimaris-platform-[a-z0-9]+-giovannibrunetto84-1508\\.vercel\\.app$/.test(url.hostname);
  return isImmutablePreview ? OPERATOR_QA_ORIGIN : url.origin;
}
