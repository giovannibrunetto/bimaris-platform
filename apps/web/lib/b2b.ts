export const B2B_TAGS = [
  ["ospitalita", "Ospitalità / strutture ricettive"],
  ["trekking", "Trekking ed escursioni guidate"],
  ["tour_culturali", "Tour culturali e visite guidate"],
  ["degustazioni", "Degustazioni ed esperienze enogastronomiche"],
  ["cantine", "Visite in cantina"],
  ["prodotti_locali", "Prodotti locali e forniture"],
  ["ristorazione", "Ristorazione"],
  ["transfer", "Transfer e trasporto persone"],
  ["mare", "Escursioni in mare"],
  ["bike", "Bike / e-bike"],
  ["outdoor", "Attività outdoor"],
  ["laboratori", "Laboratori e attività esperienziali"],
  ["eventi", "Eventi e spazi per eventi"],
  ["scuole_gruppi", "Servizi per scuole e gruppi"],
] as const;

export const COLLABORATION_TYPES = [
  ["referral", "Segnalazione / invio clienti"],
  ["pacchetto", "Pacchetto o esperienza congiunta"],
  ["ospiti", "Servizio da proporre agli ospiti"],
  ["fornitura", "Fornitura di prodotti o servizi"],
  ["evento", "Evento congiunto"],
  ["co_marketing", "Promozione congiunta"],
  ["convenzione", "Convenzione commerciale"],
] as const;

export const CUSTOMER_SEGMENTS = [
  ["turisti", "Turisti"], ["residenti", "Residenti"], ["famiglie", "Famiglie"],
  ["coppie", "Coppie"], ["piccoli_gruppi", "Piccoli gruppi"], ["gruppi", "Gruppi"],
  ["scuole", "Scuole"], ["aziende", "Aziende"], ["crocieristi", "Crocieristi"],
] as const;

export const LANGUAGES = [["it", "Italiano"], ["en", "Inglese"], ["fr", "Francese"], ["de", "Tedesco"], ["es", "Spagnolo"]] as const;
export const AVAILABILITY_MODES = [["continuativa", "Continuativa"], ["stagionale", "Stagionale"], ["weekend", "Weekend"], ["su_richiesta", "Su richiesta"]] as const;

export type B2BProfile = {
  operator_id: string;
  enabled: boolean;
  offer_tags: string[];
  seek_tags: string[];
  collaboration_types: string[];
  customer_segments: string[];
  languages: string[];
  areas: string[];
  availability_modes: string[];
  offer_summary: string | null;
  seek_summary: string | null;
  conditions_notes: string | null;
};

const overlap = (a: string[] = [], b: string[] = []) => a.filter((x) => b.includes(x));

export function scoreB2BMatch(me: B2BProfile, other: B2BProfile, sameTerritory: boolean) {
  const direct = overlap(me.seek_tags, other.offer_tags);
  if (!direct.length) return null;
  const reciprocal = overlap(other.seek_tags, me.offer_tags);
  const target = overlap(me.customer_segments, other.customer_segments);
  const languages = overlap(me.languages, other.languages);
  const availability = overlap(me.availability_modes, other.availability_modes);
  const collaboration = overlap(me.collaboration_types, other.collaboration_types);
  const area = overlap(me.areas, other.areas);

  let score = 40;
  if (direct.length > 1) score += Math.min(5, (direct.length - 1) * 2);
  if (reciprocal.length) score += 20;
  if (sameTerritory || area.length) score += 15;
  if (target.length) score += 10;
  if (languages.length) score += 5;
  if (availability.length) score += 5;
  if (collaboration.length) score += 5;
  score = Math.min(100, score);

  return { score, direct, reciprocal, target, languages, availability, collaboration, area };
}
