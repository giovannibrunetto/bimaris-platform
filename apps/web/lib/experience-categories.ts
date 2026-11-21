import type { CategorySlug } from "./types";

export const experienceCategories: ReadonlyArray<{ slug: CategorySlug; title: string; text: string }> = [
  { slug: "degustazioni", title: "Degustazioni", text: "Cantine, produttori e incontri dedicati ai sapori del territorio." },
  { slug: "mare", title: "Mare", text: "Navigazioni, attività nello Stretto e modi autentici di vivere il mare." },
  { slug: "avventura", title: "Avventura", text: "Rafting e attività dinamiche per scoprire il territorio in modo diverso." },
  { slug: "trekking-natura", title: "Trekking e natura", text: "Escursioni, sentieri e attività all'aperto tra monti e paesaggi messinesi." },
  { slug: "visite-guidate", title: "Visite guidate", text: "Esperienze accompagnate per conoscere luoghi, storia e patrimonio locale." },
  { slug: "artigianato-laboratori", title: "Artigianato e laboratori", text: "Botteghe, lavorazioni e attività pratiche legate ai saperi del territorio." },
];

const activityCategories = [
  { keys: ["workshop", "cooking"], category: "artigianato-laboratori" },
  { keys: ["food-tasting", "wine-tasting"], category: "degustazioni" },
  { keys: ["boat"], category: "mare" },
  { keys: ["trekking"], category: "trekking-natura" },
  { keys: ["guided-visit"], category: "visite-guidate" },
  { keys: ["cycling", "horse-riding"], category: "avventura" },
] as const;

const interestCategories = [
  ["food-wine", "degustazioni"],
  ["sea", "mare"],
  ["adventure", "avventura"],
  ["nature", "trekking-natura"],
  ["culture", "visite-guidate"],
  ["stories-places", "visite-guidate"],
] as const;

export function isExperienceCategory(value: string | null | undefined): value is CategorySlug {
  return experienceCategories.some(category => category.slug === value);
}

export function resolveExperienceCategory(
  legacyCategory: string | null | undefined,
  activityKeys: readonly string[],
  interestKeys: readonly string[],
): CategorySlug {
  if (isExperienceCategory(legacyCategory)) return legacyCategory;
  const activity = activityCategories.find(item => item.keys.some(key => activityKeys.includes(key)));
  if (activity) return activity.category;
  return interestCategories.find(([interest]) => interestKeys.includes(interest))?.[1] ?? "visite-guidate";
}

export function experienceCategoryLabel(slug: CategorySlug): string {
  return experienceCategories.find(category => category.slug === slug)?.title ?? "Esperienza";
}
