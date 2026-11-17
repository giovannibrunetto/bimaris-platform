export function isPrelaunchEnabled() {
  const configured = process.env.BIMARIS_PRELAUNCH_MODE === "true";
  const production = process.env.VERCEL_ENV === "production";
  const preview = process.env.VERCEL_ENV === "preview";
  const explicitPreviewAudit = process.env.BIMARIS_PRELAUNCH_AUDIT === "true";

  // Production is enabled only by the explicit prelaunch flag.
  // Preview audit is enabled only when both flags are explicitly set.
  return configured && (production || (preview && explicitPreviewAudit));
}

// Public survey must run in a DIFFERENT Vercel project, never in the main BIMARIS project.
// The expected project ID is intentionally not supplied by this branch.
export function isIsolatedSurveyDeployment() {
  const current = process.env.VERCEL_PROJECT_ID;
  const expected = process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID;
  return process.env.BIMARIS_SURVEY_PUBLIC_ONLY === "true"
    && (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview")
    && typeof current === "string" && current.length > 0
    && typeof expected === "string" && expected.length > 0
    && current === expected
    && current !== "prj_KXD8HdV3hY2ipyN8DAdA7uhp6kgX";
}

/** A partial public-only configuration must never fall through to normal BIMARIS routes. */
export function isIsolatedSurveyRequested() {
  // Also lock the dedicated project when BOTH custom settings are missing.
  return process.env.VERCEL_PROJECT_ID === "prj_NsbtPm214NbbweDhUQvPnSaFM1rH"
    || process.env.BIMARIS_SURVEY_PUBLIC_ONLY !== undefined
    || process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID !== undefined;
}
