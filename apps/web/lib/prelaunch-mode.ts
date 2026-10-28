export function isPrelaunchEnabled() {
  const configured = process.env.BIMARIS_PRELAUNCH_MODE === "true";
  const production = process.env.VERCEL_ENV === "production";
  const preview = process.env.VERCEL_ENV === "preview";
  const explicitPreviewAudit = process.env.BIMARIS_PRELAUNCH_AUDIT === "true";

  // Production is enabled only by the explicit prelaunch flag.
  // Preview audit is enabled only when both flags are explicitly set.
  return configured && (production || (preview && explicitPreviewAudit));
}
