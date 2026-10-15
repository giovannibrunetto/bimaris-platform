import Link from "next/link";
import { BimarisGoogleMap, type BimarisMapPoint, type MapFilterKey } from "@/components/BimarisGoogleMapV2";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedStories } from "@/data/stories";
import { getPublishedVillagePoints, getPublishedVillages } from "@/data/villages";

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

export default async function MapPage({ searchParams }: { searchParams: Promise<{ borgo?: string }> }) {
  const { borgo } = await searchParams;
  const [cultureEntries, stories, operators, experiences, villages] = await Promise.all([getPublishedCultureEntries(), getPublishedStories(), getPublishedOperators(), getPublishedExperiences(), getPublishedVillages()]);
  const activeVillage = borgo ? villages.find(village => village.slug === borgo) : undefined;
  const activeVillagePoints = activeVillage ? await getPublishedVillagePoints(activeVillage.id) : [];

  const culturePoints: BimarisMapPoint[] = cultureEntries.map(entry => ({ id: `culture-${entry.id}`, kind: "culture", title: entry.title, address: entry.address, googleMapsQuery: entry.googleMapsQuery, latitude: entry.latitude, longitude: entry.longitude, filterCategories: ["cultura"], categoryLabel: entry.category, links: [{ label: "Apri la scheda culturale", href: `/cultura/${entry.slug}` }] }));

  const legendPointsByQuery = new Map<string, BimarisMapPoint>();
  stories.forEach(story => { story.places.forEach(place => { const key = place.googleMapsQuery.trim().toLowerCase(); const existing = legendPointsByQuery.get(key); const storyLink = { label: story.title, href: `/storie-miti-leggende/${story.slug}` }; if (existing) { if (!existing.links.some(link => link.href === storyLink.href)) existing.links.push(storyLink); return; } legendPointsByQuery.set(key, { id: `legend-${story.slug}-${place.position}`, kind: "legend", title: place.label ?? place.name, address: place.address, googleMapsQuery: place.googleMapsQuery, latitude: place.latitude, longitude: place.longitude, filterCategories: ["miti-leggende"], categoryLabel: "Miti e leggende", links: [storyLink] }); }); });
  const legendPoints = Array.from(legendPointsByQuery.values());

  const operatorPoints: BimarisMapPoint[] = operators.map(operator => ({ id: `operator-${operator.id}`, kind: "operator", title: operator.name, address: operator.address, googleMapsQuery: operator.googleMapsQuery, latitude: operator.latitude, longitude: operator.longitude, filterCategories: operatorFilters(operator.category), categoryLabel: operator.category, links: [{ label: "Apri la scheda operatore", href: `/operatori/${operator.slug}` }] }));

  const experiencePoints: BimarisMapPoint[] = experiences.filter(experience => Boolean(experience.googleMapsQuery)).map(experience => ({ id: `experience-${experience.id}`, kind: "experience", title: experience.name, address: experience.meetingPoint, googleMapsQuery: experience.googleMapsQuery as string, latitude: experience.latitude, longitude: experience.longitude, filterCategories: ["esperienze"], categoryLabel: categoryDisplayName(experience.category), links: [{ label: "Apri l'esperienza", href: `/esperienze/${experience.slug}` }] }));

  const villagePoints: BimarisMapPoint[] = villages.map(village => ({ id: `village-${village.id}`, kind: "culture", title: village.name, address: village.address, googleMapsQuery: village.googleMapsQuery, latitude: village.latitude, longitude: village.longitude, filterCategories: ["borghi"], categoryLabel: "Borgo", links: [{ label: "Apri la scheda del borgo", href: `/borghi/${village.slug}` }] }));

  const villagePoiPoints: BimarisMapPoint[] = activeVillage ? activeVillagePoints.map(point => ({
    id: `village-poi-${point.id}`,
    kind: "culture",
    title: point.name,
    address: point.address,
    googleMapsQuery: point.googleMapsQuery,
    latitude: point.latitude,
    longitude: point.longitude,
    filterCategories: ["borghi"],
    categoryLabel: `Da vedere a ${activeVillage.name}`,
    links: [{ label: `Torna alla scheda di ${activeVillage.name}`, href: `/borghi/${activeVillage.slug}` }],
  })) : [];

  const points = [...culturePoints, ...legendPoints, ...operatorPoints, ...experiencePoints, ...villagePoints, ...villagePoiPoints];

  return <>
    <section className="page-hero"><div className="kicker">Esplora</div><h1>Mappa BIMARIS</h1><p>La rappresentazione geografica di BIMARIS. Esplora sulla mappa le stesse sezioni da cui puoi iniziare la scoperta del territorio.</p></section>
    <section className="section dark">
      <div className="section-head"><div><div className="kicker">Da dove vuoi iniziare?</div><h2>{activeVillage ? `Esplora ${activeVillage.name}.` : "Scegli cosa vuoi scoprire."}</h2></div><p>{activeVillage ? `Sulla mappa sono state aggiunte le singole tappe da vedere a ${activeVillage.name}. Puoi selezionarle insieme agli altri punti BIMARIS e costruire il tuo percorso.` : "Monumenti e cultura, miti e leggende, sapori e territori, borghi ed esperienze sono organizzati anche geograficamente. Puoi filtrare la mappa e combinare le singole tappe nel tuo percorso."}</p></div>
      {activeVillage && <div style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#d6c29b", fontWeight: 700 }}>Contesto borgo attivo: {activeVillage.name}</span><Link className="button secondary" href="/mappa">Mostra la mappa generale</Link></div>}
      <BimarisGoogleMap points={points} />
    </section>
  </>;
}
