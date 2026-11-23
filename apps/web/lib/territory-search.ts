export type SearchItem = {
  title: string;
  description?: string | null;
  keywords?: string | null;
  href: string;
  kind: "Luoghi" | "Appuntamenti" | "Esperienze";
  startsAt?: string;
};

const stopWords = new Set("a al alla alle ai allo all con che come cosa da dal dei del della di dov e ed gli il in la le lo mi nel nella ne per piu quale qualche qualcuno qualcosa si su sul sulla uno un una vorrei voglio fare vedere trovare posso consigliami adatto adatta".split(" "));
const meanings = [
  /^(passeggiat\w*|pasggiat\w*|camminat\w*|trekking|escursion\w*|sentier\w*)$/,
  /^(mare|costa|coste|costier\w*|spiagg\w*|balnear\w*|litor\w*)$/,
  /^(bambin\w*|famigli\w*|piccol\w*|ragazz\w*)$/,
  /^(muse\w*|monument\w*|cultur\w*|stori\w*|chies\w*)$/,
  /^(degust\w*|vin[oi]|cantin\w*|sapori|gastronom\w*)$/,
  /^(event[oi]|appuntament\w*|manifestazion\w*)$/,
  /^(borg[oh]i?|villagg\w*)$/,
];

const romeDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
const weekdays = ["domenica", "lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"];

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function words(value: string) {
  return normalize(value).split(" ").filter(word => word.length > 1);
}

function nearbyWord(first: string, second: string) {
  if (first.length < 6 || second.length < 6 || Math.abs(first.length - second.length) > 1) return false;
  for (let index = 0; index < first.length; index++) {
    if (first[index] === second[index]) continue;
    return first.slice(index + 1) === second.slice(index + 1)
      || first.slice(index + 1) === second.slice(index)
      || first.slice(index) === second.slice(index + 1)
      || (first[index] === second[index + 1] && first[index + 1] === second[index] && first.slice(index + 2) === second.slice(index + 2));
  }
  return true;
}

export function interpretTerritorySearch(query: string, now = new Date()) {
  const tokens = words(query);
  const requestedWeekday = weekdays.findIndex(day => tokens.includes(day));
  const today = new Date(`${romeDate.format(now)}T00:00:00Z`);
  const offset = tokens.includes("oggi") ? 0 : tokens.includes("domani") ? 1
    : requestedWeekday >= 0 ? (requestedWeekday - today.getUTCDay() + 7) % 7 : null;
  if (offset !== null) today.setUTCDate(today.getUTCDate() + offset);
  return {
    terms: [...new Set(tokens.filter(word => !stopWords.has(word) && !weekdays.includes(word) && word !== "oggi" && word !== "domani"))].slice(0, 14),
    date: offset === null ? null : today.toISOString().slice(0, 10),
  };
}

function termScore(term: string, title: string[], body: string[]): number {
  if (title.includes(term)) return 9;
  if (body.includes(term)) return 5;
  const meaning = meanings.find(pattern => pattern.test(term));
  if (meaning && title.some(word => meaning.test(word))) return 6;
  if (meaning && [...title, ...body].some(word => meaning.test(word))) return 4;
  if (title.some(word => nearbyWord(term, word))) return 3;
  return 0;
}

export function rankTerritorySearch(query: string, items: SearchItem[], now = new Date()) {
  const { terms, date } = interpretTerritorySearch(query, now);
  const meaningfulTerms = terms.filter(term => !meanings[2].test(term));
  return items.flatMap(item => {
    const title = words(item.title);
    const body = words(`${item.description ?? ""} ${item.keywords ?? ""}`);
    const knownDay = item.startsAt ? romeDate.format(new Date(item.startsAt)) : null;
    if (date && knownDay && date !== knownDay) return [];
    const scores = meaningfulTerms.map(term => termScore(term, title, body));
    const matches = scores.filter(Boolean).length;
    if ((meaningfulTerms.length && !matches) || (!meaningfulTerms.length && !date)) return [];
    const score = scores.reduce((sum, value) => sum + value, 0)
      + (date && knownDay ? 10 : 0)
      + (terms.some(term => meanings[2].test(term)) && body.some(word => meanings[2].test(word)) ? 3 : 0);
    if (!score) return [];
    return [{ item, score, partial: matches < meaningfulTerms.length, dateUnconfirmed: Boolean(date && !knownDay) }];
  }).sort((first, second) => Number(first.partial) - Number(second.partial) || second.score - first.score).slice(0, 24);
}
