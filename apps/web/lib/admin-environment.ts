import "server-only";

const STAGING_URL = "https://nzdeoimwikhoidtladnu.supabase.co";
const PRODUCTION_URL = "https://vhvccwvcqdhiovpopsze.supabase.co";
const MAIN_PROJECT = "prj_KXD8HdV3hY2ipyN8DAdA7uhp6kgX";
const STAGING_ORIGINS = [
  "https://bimaris-platform-git-fix-dt16-is-347443-giovannibrunetto84-1508.vercel.app",
  "https://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app",
  "https://bimaris-platform-git-integration-cb5b41-giovannibrunetto84-1508.vercel.app",
] as const;
const PRODUCTION_ORIGINS = ["https://www.bimarisnet.it"] as const;

type AdminEnvironment = { supabaseUrl: string; loginOrigin: string; origins: readonly string[] };

/** Server-only environment policy. Production requires separate explicit authorization. */
export function resolveAdminEnvironment(env: NodeJS.ProcessEnv = process.env): AdminEnvironment | null {
  if (env.BIMARIS_SURVEY_PUBLIC_ONLY !== undefined || env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID !== undefined) return null;
  if (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== MAIN_PROJECT) return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const target = env.BIMARIS_ADMIN_ENVIRONMENT;
  const deployment = env.VERCEL_ENV;
  if (deployment === "production") {
    if (env.VERCEL_PROJECT_ID !== MAIN_PROJECT || target !== "production" ||
        env.BIMARIS_ADMIN_PRODUCTION_ENABLED !== "true" || url !== PRODUCTION_URL) return null;
    return { supabaseUrl: PRODUCTION_URL, loginOrigin: PRODUCTION_ORIGINS[0], origins: PRODUCTION_ORIGINS };
  }
  if (deployment !== "preview" && deployment !== "development" &&
      !(deployment === undefined && env.NODE_ENV === "development")) return null;
  if ((target !== undefined && target !== "staging") ||
      env.BIMARIS_ADMIN_PRODUCTION_ENABLED !== undefined || url !== STAGING_URL) return null;
  return { supabaseUrl: STAGING_URL, loginOrigin: STAGING_ORIGINS[0], origins: STAGING_ORIGINS };
}
