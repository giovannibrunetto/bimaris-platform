import { ExperienceCard } from "@/components/ExperienceCard";
import { getPublishedExperiences } from "@/data/live";

export const revalidate = 300;

export default async function ExperiencesPage() {
  const experiences = await getPublishedExperiences();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">BIMARIS</div>
        <h1>Esperienze</h1>
        <p>Una selezione editoriale di esperienze, luoghi e attività capaci di raccontare il territorio messinese con qualità e autenticità.</p>
      </section>
      <section className="section">
        {experiences.length > 0 ? (
          <div className="cards">{experiences.map(e => <ExperienceCard key={e.id} experience={e} />)}</div>
        ) : (
          <div className="detail-panel">
            <div className="kicker">Selezione in corso</div>
            <h3>Stiamo costruendo la raccolta BIMARIS.</h3>
            <p>Le prime esperienze verranno pubblicate dopo la selezione delle realtà del territorio e la verifica dei contenuti.</p>
          </div>
        )}
      </section>
    </>
  );
}
