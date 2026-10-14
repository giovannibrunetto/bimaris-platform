import { BimarisGoogleMap, type BimarisMapPoint } from "@/components/BimarisGoogleMap";
import { getPublishedCultureEntries } from "@/data/live";
import { getPublishedStories } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MapPage() {
  const [cultureEntries, stories] = await Promise.all([
    getPublishedCultureEntries(),
    getPublishedStories(),
  ]);

  const culturePoints: BimarisMapPoint[] = cultureEntries.map(entry => ({
    id: `culture-${entry.id}`,
    kind: "culture",
    title: entry.title,
    address: entry.address,
    googleMapsQuery: entry.googleMapsQuery,
    latitude: entry.latitude,
    longitude: entry.longitude,
    links: [
      {
        label: "Apri la scheda culturale",
        href: `/cultura/${entry.slug}`,
      },
    ],
  }));

  const legendPointsByQuery = new Map<string, BimarisMapPoint>();

  stories.forEach(story => {
    story.places.forEach(place => {
      const key = place.googleMapsQuery.trim().toLowerCase();
      const existing = legendPointsByQuery.get(key);
      const storyLink = {
        label: story.title,
        href: `/storie-miti-leggende/${story.slug}`,
      };

      if (existing) {
        if (!existing.links.some(link => link.href === storyLink.href)) {
          existing.links.push(storyLink);
        }
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
        links: [storyLink],
      });
    });
  });

  const legendPoints = Array.from(legendPointsByQuery.values());
  const points = [...culturePoints, ...legendPoints];

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Esplora</div>
        <h1>Mappa BIMARIS</h1>
        <p>
          Monumenti, luoghi culturali e punti legati ai miti dello Stretto riuniti in un'unica mappa. Seleziona un segnaposto per aprire la relativa scheda o avviare le indicazioni stradali.
        </p>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Messina intorno a te</div>
            <h2>Scopri il territorio sulla mappa.</h2>
          </div>
          <p>
            Sono già disponibili {culturePoints.length} luoghi culturali e {legendPoints.length} luoghi collegati a miti e leggende. Usa i filtri per scegliere cosa visualizzare oppure “La mia posizione” per orientarti rispetto ai punti BIMARIS.
          </p>
        </div>

        <BimarisGoogleMap points={points} />
      </section>
    </>
  );
}
