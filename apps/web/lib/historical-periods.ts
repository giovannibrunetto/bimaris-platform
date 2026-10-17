import type { HistoricalPeriodKey } from "@/lib/types";

export const HISTORICAL_PERIODS: Array<{
  key: Exclude<HistoricalPeriodKey, "trasversale">;
  label: string;
  range: string;
  shortDescription: string;
}> = [
  {
    key: "antichita",
    label: "Antichità",
    range: "Età greca e romana",
    shortDescription: "Siti e testimonianze archeologiche che raccontano le radici greche e romane del territorio messinese.",
  },
  {
    key: "medioevo",
    label: "Medioevo",
    range: "XI–XV secolo",
    shortDescription: "Chiese, fondazioni e architetture che raccontano la Messina medievale e il suo ruolo nel Mediterraneo.",
  },
  {
    key: "rinascimento-cinquecento",
    label: "Rinascimento e Cinquecento",
    range: "XVI secolo",
    shortDescription: "Fontane manieriste, fortificazioni e grandi interventi della Messina rinascimentale.",
  },
  {
    key: "seicento-settecento",
    label: "Seicento e Settecento",
    range: "XVII–XVIII secolo",
    shortDescription: "Architetture e trasformazioni urbane dell’età barocca e tardo-barocca.",
  },
  {
    key: "ottocento",
    label: "Ottocento",
    range: "XIX secolo",
    shortDescription: "Luoghi della città borbonica e della trasformazione culturale dell’Ottocento.",
  },
  {
    key: "novecento",
    label: "Novecento",
    range: "XX secolo",
    shortDescription: "La ricostruzione dopo il 1908, i nuovi simboli urbani e le architetture del Novecento.",
  },
];

export function historicalPeriodLabel(key?: HistoricalPeriodKey) {
  if (!key) return undefined;
  if (key === "trasversale") return "Più epoche";
  return HISTORICAL_PERIODS.find(period => period.key === key)?.label;
}
