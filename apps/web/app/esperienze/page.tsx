import { ExperienceCard } from "@/components/ExperienceCard";
import { getPublishedExperiences } from "@/data/live";

export const revalidate = 300;

export default async function ExperiencesPage() {
  const experiences = await getPublishedExperiences();

  return <>
    <section className="page-hero"><div className="kicker">BIMARIS</div><h1>Esperienze</h1><p>Una selezione editoriale di esperienze, luoghi e attività del territorio.</p></section>
    <section className="section"><div className="cards">{experiences.map(e => <ExperienceCard key={e.id} experience={e} />)}</div></section>
  </>;
}
