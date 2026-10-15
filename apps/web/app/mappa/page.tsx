import { BimarisGoogleMap, type BimarisMapPoint, type MapFilterKey } from "@/components/BimarisGoogleMapV2";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedStories } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function uniqueFilters(filters: MapFilterKey[]) { return Array.from(new Set(filters)); }

function operatorFilters(category?: string): MapFilterKey[] {
  const filters: MapFilterKey[] = ["operatori"];
  const value = (category ?? "").toLowerCase();
  if (/ristor|enotec|cantin|vino|vinicol|degust|gastronom|produtt|caseific|salum|pastic|panific|agritur|food|sapori/.test(value)) filters.push("sapori-territori");
  return uniqueFilters(filters);
}

function categoryDisplayName(category: string) {
  const names: Record<string, string> = { degustazioni: "Degustazioni", mare: "Mare", avventura: "Avventura", "trekking-natura": "Trekking e natura", "visite-guidate": "Visite guidate", "artigianato-laboratori": "Artigianato e laboratori" };
  return names[category] ?? "Esperienza";
}

export default async function MapPage() {
  const [cultureEntries, stories, operators, experiences] = await Promise.all([getPublishedCultureEntries(), getPublishedStories(), getPublishedOperators(), getPublishedExperiences()]);

  const culturePoints: BimarisMapPoint[] = cultureEntries.map(entry => ({ id: `culture-${entry.id}`, kind: "culture", title: entry.title, address: entry.address, googleMapsQuery: entry.googleMapsQuery, latitude: entry.latitude, longitude: entry.longitude, filterCategories: ["cultura"], categoryLabel: entry.category, links: [{ label: "Apri la scheda culturale", href: `/cultura/${entry.slug}` }] }));

  const legendPointsByQuery = new Map<string, BimarisMapPoint>();
  stories.forEach(story => { story.places.forEach(place => { const key = place.googleMapsQuery.trim().toLowerCase(); const existing = legendPointsByQuery.get(key); const storyLink = { label: story.title, href: `/storie-miti-leggende/${story.slug}` }; if (existing) { if (!existing.links.some(link => link.href === storyLink.href)) existing.links.push(storyLink); return; } legendPointsByQuery.set(key, { id: `legend-${story.slug}-${place.position}`, kind: "legend", title: place.label ?? place.name, address: place.address, googleMapsQuery: place.googleMapsQuery, latitude: place.latitude, longitude: place.longitude, filterCategories: ["miti-leggende"], categoryLabel: "Miti e leggende", links: [storyLink] }); }); });
  const legendPoints = Array.from(legendPointsByQuery.values());

  const operatorPoints: BimarisMapPoint[] = operators.map(operator => ({ id: `operator-${operator.id}`, kind: "operator", title: operator.name, address: operator.address, googleMapsQuery: operator.googleMapsQuery, latitude: operator.latitude, longitude: operator.longitude, filterCategories: operatorFilters(operator.category), categoryLabel: operator.category, links: [{ label: "Apri la scheda operatore", href: `/operatori/${operator.slug}` }] }));

  const experiencePoints: BimarisMapPoint[] = experiences.filter(experience => Boolean(experience.googleMapsQuery)).map(experience => ({ id: `experience-${experience.id}`, kind: "experience", title: experience.name, address: experience.meetingPoint, googleMapsQuery: experience.googleMapsQuery as string, latitude: experience.latitude, longitude: experience.longitude, filterCategories: ["esperienze"], categoryLabel: categoryDisplayName(experience.category), links: [{ label: "Apri l'esperienza", href: `/esperienze/${experience.slug}` }] }));

  const points = [...culturePoints, ...legendPoints, ...operatorPoints, ...experiencePoints];

  return <>
    <section className="page-hero"><div className="kicker">Esplora</div><h1>Mappa BIMARIS</h1><p>La rappresentazione geografica di BIMARIS. Esplora sulla mappa le stesse sezioni da cui puoi iniziare la scoperta del territorio.</p></section>
    <section className="section dark">
      <div className="section-head"><div><div className="kicker">Da dove vuoi iniziare?</div><h2>Scegli cosa vuoi scoprire.</h2></div><p>Monumenti e cultura, miti e leggende, sapori e territori, borghi ed esperienze sono organizzati anche geograficamente. Puoi filtrare la mappa e combinare le singole tappe nel tuo percorso.</p></div>
      <BimarisGoogleMap points={points} />
    </section>
  </>;
}
