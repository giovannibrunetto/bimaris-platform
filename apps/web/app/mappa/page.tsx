import { BimarisGoogleMap, type BimarisMapPoint, type MapFilterKey } from "@/components/BimarisGoogleMapV2";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedStories } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function uniqueFilters(filters: MapFilterKey[]) {
  return Array.from(new Set(filters));
}

function experienceFilters(category: string): MapFilterKey[] {
  const thematic: Record<string, MapFilterKey | undefined> = {
    cultura: "cultura",
    mangiare: "sapori",
    natura: "natura",
    mare: "mare",
    "shopping-artigianato": "artigianato",
  };

  return uniqueFilters(["attrazioni", ...(thematic[category] ? [thematic[category] as MapFilterKey] : [])]);
}

function categoryDisplayName(category: string) {
  const names: Record<string, string> = {
    cultura: "Cultura",
    esperienze: "Attrazioni",
    mangiare: "Sapori",
    natura: "Natura",
    mare: "Mare",
    "shopping-artigianato": "Artigianato",
  };
  return names[category] ?? "Esperienza";
}

function operatorFilters(category?: string): MapFilterKey[] {
  const filters: MapFilterKey[] = ["operatori"];
  const value = (category ?? "").toLowerCase();

  if (/ristor|enotec|cantin|vino|vinicol|degust|gastronom|produtt|caseific|salum|pastic|panific|agritur|food|sapori/.test(value)) filters.push("sapori");
  if (/mare|barca|naut|diving|subac|kayak|vela|pesca/.test(value)) filters.push("mare");
  if (/natura|trek|escursion|outdoor|ambient|parco|bike|cicl/.test(value)) filters.push("natura");
  if (/artig|ceramic|bottega|shopping|laboratorio/.test(value)) filters.push("artigianato");
  if (/cultur|muse|stor|teatr|guida turistic/.test(value)) filters.push("cultura");

  return uniqueFilters(filters);
}

export default async function MapPage() {
  const [cultureEntries, stories, operators, experiences] = await Promise.all([
    getPublishedCultureEntries(),
    getPublishedStories(),
    getPublishedOperators(),
    getPublishedExperiences(),
  ]);

  const culturePoints: BimarisMapPoint[] = cultureEntries.map(entry => ({
    id: `culture-${entry.id}`,
    kind: "culture",
    title: entry.title,
    address: entry.address,
    googleMapsQuery: entry.googleMapsQuery,
    latitude: entry.latitude,
    longitude: entry.longitude,
    filterCategories: ["cultura"],
    categoryLabel: entry.category,
    links: [{ label: "Apri la scheda culturale", href: `/cultura/${entry.slug}` }],
  }));

  const legendPointsByQuery = new Map<string, BimarisMapPoint>();

  stories.forEach(story => {
    story.places.forEach(place => {
      const key = place.googleMapsQuery.trim().toLowerCase();
      const existing = legendPointsByQuery.get(key);
      const storyLink = { label: story.title, href: `/storie-miti-leggende/${story.slug}` };

      if (existing) {
        if (!existing.links.some(link => link.href === storyLink.href)) existing.links.push(storyLink);
        return;
      }

      legendPointsByQuery.set(key, {
        id: `legend-${story.slug}-${place.position}`,
        kind: "legend",
        title: place.label ?? place.name,
        address: place.address,
        googleMapsQuery: place.googleMapsQuery,
        latitude: place.latitude,
        longitude: place.longitude,
        filterCategories: ["cultura"],
        categoryLabel: "Miti e leggende",
        links: [storyLink],
      });
    });
  });

  const legendPoints = Array.from(legendPointsByQuery.values());

  const operatorPoints: BimarisMapPoint[] = operators.map(operator => ({
    id: `operator-${operator.id}`,
    kind: "operator",
    title: operator.name,
    address: operator.address,
    googleMapsQuery: operator.googleMapsQuery,
    latitude: operator.latitude,
    longitude: operator.longitude,
    filterCategories: operatorFilters(operator.category),
    categoryLabel: operator.category,
    links: [{ label: "Apri la scheda operatore", href: `/operatori/${operator.slug}` }],
  }));

  const experiencePoints: BimarisMapPoint[] = experiences
    .filter(experience => Boolean(experience.googleMapsQuery))
    .map(experience => ({
      id: `experience-${experience.id}`,
      kind: "experience",
      title: experience.name,
      address: experience.meetingPoint,
      googleMapsQuery: experience.googleMapsQuery as string,
      latitude: experience.latitude,
      longitude: experience.longitude,
      filterCategories: experienceFilters(experience.category),
      categoryLabel: categoryDisplayName(experience.category),
      links: [{ label: "Apri l'esperienza", href: `/esperienze/${experience.slug}` }],
    }));

  const points = [...culturePoints, ...legendPoints, ...operatorPoints, ...experiencePoints];

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Esplora</div>
        <h1>Mappa BIMARIS</h1>
        <p>
          Monumenti, miti, operatori selezionati ed esperienze riuniti in un'unica mappa. Filtra ciò che ti interessa, seleziona singolarmente le tappe e crea il tuo percorso personale.
        </p>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Messina intorno a te</div>
            <h2>Scopri il territorio sulla mappa.</h2>
          </div>
          <p>
            Sono disponibili {culturePoints.length} luoghi culturali, {legendPoints.length} luoghi collegati a miti e leggende, {operatorPoints.length} operatori e {experiencePoints.length} esperienze. Tocca un marker e scegli “Aggiungi al mio percorso”: puoi combinare liberamente monumenti, miti e altre attrazioni e ottenere le indicazioni solo per le tappe selezionate.
          </p>
        </div>

        <BimarisGoogleMap points={points} />
      </section>
    </>
  );
}
