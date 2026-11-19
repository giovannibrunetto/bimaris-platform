export function experienceRevisionBlocker(
  experience: { review_status?: string | null } | null,
  operator: { selection_status?: string | null; published?: boolean | null } | null,
) {
  if (experience?.review_status !== "approved") return "experience-not-approved";
  if (operator?.selection_status !== "selected") return "operator-not-selected";
  if (!operator.published) return "operator-not-published";
  return null;
}
