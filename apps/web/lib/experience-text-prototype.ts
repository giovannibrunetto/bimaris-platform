// DS-FUN-02: conservative, local-only baseline; not a generative AI engine.
export const MAX_EXPERIENCE_TEXT = 6000;
export type TextProposal = { original: string; proposed: string; changed: boolean };
export function proposeExperienceText(original: string): TextProposal {
  if (!original.trim()) throw new Error("Inserisci un testo da migliorare.");
  if (original.length > MAX_EXPERIENCE_TEXT) throw new Error("Il testo supera il limite del prototipo.");
  // Only horizontal spacing and blank-line layout. Never modify words, punctuation,
  // amounts, times, negations, or the order of statements.
  const proposed = original.replace(/\r\n/g, "\n").split("\n")
    .map(line => line.replace(/^[ \t]+|[ \t]+$/g, "").replace(/[ \t]{2,}/g, " "))
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (original.replace(/\s/gu, "") !== proposed.replace(/\s/gu, "")) {
    throw new Error("La proposta non conserva il testo originale.");
  }
  return { original, proposed, changed: original !== proposed };
}
