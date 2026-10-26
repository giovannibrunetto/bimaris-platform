export function isPrelaunchEnabled() {
  const configured = process.env.BIMARIS_PRELAUNCH_MODE === "true";
  const production = process.env.VERCEL_ENV === "production";
  const explicitPreviewAudit =
    process.env.VERCEL_ENV === "preview" &&
    process.env.BIMARIS_PRELAUNCH_AUDIT === "true";

  return configured && (production || explicitPreviewAudit);
}
