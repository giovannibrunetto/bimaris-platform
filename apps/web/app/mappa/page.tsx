import Link from "next/link";
import "./map-filters.css";
import { getVillageHistoricalPeriods, getVillagePointHistoricalPeriods } from "@/data/village-historical-periods";
import { BimarisGoogleMap, type BimarisMapPoint, type MapFilterKey } from "@/components/BimarisGoogleMapV2";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedStories } from "@/data/stories";
import { getPublishedVillagePoints, getPublishedVillages } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function uniqueFilters(filters: MapFilterKey[]) { return Array.from(new Set(filters)); }
function operatorFilters(category?: string): MapFilterKey[] { const filters: MapFilterKey[] = ["operatori"]; const value = (category ?? "").toLowerCase(); if (/ristor|enotec|cantin|vino|vinicol|degust|gastronom|produtt|caseific|salum|pastic|panific|agritur|food|sapori/.test(value)) filters.push("sapori-territori"); return uniqueFilters(filters); }
function categoryDisplayName(category: string) { const names: Record<string, string> = { degustazioni: "Degustazioni", mare: "Mare", avventura: "Avventura", "trekking-natura": "Trekking e natura", "visite-guidate": "Visite guidate", "artigianato-laboratori": "Artigianato e laboratori" }; return names[category] ?? "Esperienza"; }
function villagePoiType(name: string) { const value = name.toLowerCase(); if (/chiesa|duomo|basilio|salvatore/.test(value)) return "Chiesa"; if (/museo|manos/.test(value)) return "Museo"; if (/castello|torre/.test(value)) return "Castello e fortificazione"; if (/tempio|archeolog|argimusco/.test(value)) return "Area archeologica e paesaggistica"; if (/bosco|malabotta/.test(value)) return "Natura"; if (/porta/.test(value)) return "Porta storica"; if (/monumento/.test(value)) return "Monumento"; return "Luogo da vedere"; }

export default async function MapPage({ searchParams }: { searchParams: Promise<{ borgo?: string; storia?: string; espandi?: string }> }) {
  const { borgo, storia, espandi } = await searchParams;
  const [cultureEntries, stories, operators, experiences, villages] = await Promise.all([getPublishedCultureEntries(), getPublishedStories(), getPublishedOperators(), getPublishedExperiences(), getPublishedVillages()]);
  const activeVillage = borgo ? villages.find(village => village.slug === borgo) : undefined;
  const activeStory = storia ? stories.find(story => story.slug === storia) : undefined;
  const expandedStoryContext = Boolean(activeStory && espandi === "1");
  const allVillagePointGroups = await Promise.all(villages.map(village => getPublishedVillagePoints(village.id)));
  const villagePointsById = new Map(villages.map((village, index) => [village.id, allVillagePointGroups[index]]));
  const activeVillagePoints = activeVillage ? villagePointsById.get(activeVillage.id) ?? [] : [];
  const culturePoints: BimarisMapPoint[] = cultureEntries.map(entry => ({ id: `culture-${entry.id}`, kind: "culture", title: entry.title, address: entry.address, googleMapsQuery: entry.googleMapsQuery, latitude: entry.latitude, longitude: entry.longitude, filterCategories: ["cultura"], historicalPeriods: Array.from(new Set([...(entry.primaryHistoricalPeriod ? [entry.primaryHistoricalPeriod] : []), ...(entry.historicalPeriods ?? [])])), categoryLabel: entry.category, links: [{ label: "Apri la scheda culturale", href: `/cultura/${entry.slug}` }] }));
  const legendPointsByQuery = new Map<string, BimarisMapPoint>();
  stories.forEach(story => { story.places.forEach(place => { const key = place.googleMapsQuery.trim().toLowerCase(); const existing = legendPointsByQuery.get(key); const storyLink = { label: story.title, href: `/storie-miti-leggende/${story.slug}` }; if (existing) { if (!existing.links.some(link => link.href === storyLink.href)) existing.links.push(storyLink); return; } legendPointsByQuery.set(key, { id: `legend-${story.slug}-${place.position}`, kind: "legend", title: place.label ?? place.name, address: place.address, googleMapsQuery: place.googleMapsQuery, latitude: place.latitude, longitude: place.longitude, filterCategories: ["miti-leggende"], categoryLabel: "Miti e leggende", links: [storyLink] }); }); });
  const legendPoints = Array.from(legendPointsByQuery.values());
  const activeStoryQueries = new Set((activeStory?.places ?? []).map(place => place.googleMapsQuery.trim().toLowerCase()));
  const activeStoryPoints = legendPoints.filter(point => activeStoryQueries.has(point.googleMapsQuery.trim().toLowerCase()));
  const operatorPoints: BimarisMapPoint[] = operators.map(operator => ({ id: `operator-${operator.id}`, kind: "operator", title: operator.name, address: operator.address, googleMapsQuery: operator.googleMapsQuery, latitude: operator.latitude, longitude: operator.longitude, filterCategories: operatorFilters(operator.category), categoryLabel: operator.category, links: [{ label: "Apri la scheda operatore", href: `/operatori/${operator.slug}` }] }));
  const experiencePoints: BimarisMapPoint[] = experiences.filter(experience => Boolean(experience.googleMapsQuery)).map(experience => ({ id: `experience-${experience.id}`, kind: "experience", title: experience.name, address: experience.meetingPoint, googleMapsQuery: experience.googleMapsQuery as string, latitude: experience.latitude, longitude: experience.longitude, filterCategories: ["esperienze"], categoryLabel: categoryDisplayName(experience.category), links: [{ label: "Apri l'esperienza", href: `/esperienze/${experience.slug}` }] }));
  const villagePoints: BimarisMapPoint[] = villages.map(village => ({ id: `village-${village.id}`, kind: "village", title: village.name, address: village.address, googleMapsQuery: village.googleMapsQuery, latitude: village.latitude, longitude: village.longitude, filterCategories: ["borghi"], historicalPeriods: getVillageHistoricalPeriods(village.slug, (villagePointsById.get(village.id) ?? []).map(point => point.slug)), links: [{ label: "Apri la scheda del borgo", href: `/borghi/${village.slug}` }] }));
  const villagePoiPoints: BimarisMapPoint[] = activeVillage ? activeVillagePoints.map(point => ({ id: `village-poi-${point.id}`, kind: "village-poi", title: point.name, address: point.address, googleMapsQuery: point.googleMapsQuery, latitude: point.latitude, longitude: point.longitude, filterCategories: ["borghi"], historicalPeriods: getVillagePointHistoricalPeriods(activeVillage.slug, point.slug), categoryLabel: villagePoiType(point.name), links: [{ label: `Torna alla scheda di ${activeVillage.name}`, href: `/borghi/${activeVillage.slug}` }] })) : [];
  const allPoints = [...culturePoints, ...legendPoints, ...operatorPoints, ...experiencePoints, ...villagePoints, ...villagePoiPoints];
  const points = activeStory && !expandedStoryContext ? activeStoryPoints : allPoints;

  const contextTitle = activeStory
    ? `I luoghi di ${activeStory.title}`
    : activeVillage
      ? `Esplora ${activeVillage.name}.`
      : "Scegli cosa vuoi scoprire.";
  const contextText = activeStory
    ? expandedStoryContext
      ? "I luoghi della leggenda restano disponibili insieme agli altri punti BIMARIS. Usa i filtri per aggiungere monumenti, borghi, esperienze e operatori alla tua esplorazione."
      : "La mappa mostra soltanto i luoghi collegati a questa leggenda. Puoi poi integrarli con gli altri punti BIMARIS."
    : activeVillage
      ? `Sulla mappa sono state aggiunte le singole tappe da vedere a ${activeVillage.name}. Puoi selezionarle insieme agli altri punti BIMARIS e costruire il tuo percorso.`
      : "Monumenti e cultura, miti e leggende, sapori e territori, borghi ed esperienze sono organizzati anche geograficamente. Puoi filtrare la mappa e combinare le singole tappe nel tuo percorso.";

  return <>
    <section className="section dark map-page-section map-page-unified">
      <header className="map-page-intro">
        <div className="kicker">Esplora il territorio</div>
        <h1>Mappa BIMARIS</h1>
        <p>{activeStory || activeVillage ? contextText : "Monumenti, borghi, storie ed esperienze: scegli cosa scoprire e crea il tuo itinerario."}</p>
      </header>
      {activeStory && <div style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#d6c29b", fontWeight: 700 }}>Leggenda attiva: {activeStory.title}</span>{expandedStoryContext ? <Link className="button secondary" href={`/mappa?storia=${encodeURIComponent(activeStory.slug)}`}>Mostra solo i punti della leggenda</Link> : <Link className="button secondary" href={`/mappa?storia=${encodeURIComponent(activeStory.slug)}&espandi=1`}>Integra con gli altri punti BIMARIS</Link>}<Link className="button secondary" href={`/storie-miti-leggende/${activeStory.slug}`}>Torna alla leggenda</Link></div>}
      {!activeStory && activeVillage && <div style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#d6c29b", fontWeight: 700 }}>Contesto borgo attivo: {activeVillage.name}</span><Link className="button secondary" href="/mappa">Mostra la mappa generale</Link></div>}
      <BimarisGoogleMap points={points} />
    </section>
  </>;
}
