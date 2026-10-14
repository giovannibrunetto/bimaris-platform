import { notFound } from "next/navigation";
import { ExperienceDetailActions } from "@/components/ExperienceDetailActions";
import { getPublishedExperienceBySlug } from "@/data/live";

export const revalidate = 300;

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getPublishedExperienceBySlug(slug);

  if (!experience) notFound();

  return <>
    <section className="page-hero"><div className="kicker">{experience.location} · {experience.category}</div><h1>{experience.name}</h1><p>{experience.excerpt}</p></section>
    <section className="section detail-grid">
      <div>
        <h2 style={{fontFamily:"Georgia,serif", fontSize:42}}>L'esperienza</h2>
        <p style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{experience.description}</p>
        <div className="detail-panel" style={{marginTop:28}}><div className="kicker">Perché BIMARIS l'ha scelta</div><h3>Il valore dell'esperienza</h3><p>{experience.whySelected}</p></div>
      </div>
      <aside className="detail-panel">
        <h3>Informazioni</h3>
        <ul className="list">
          <li><strong>Operatore</strong><br />{experience.operatorName}</li>
          {experience.duration && <li><strong>Durata</strong><br />{experience.duration}</li>}
          {experience.priceFrom != null && <li><strong>Prezzo indicativo</strong><br />Da € {experience.priceFrom}</li>}
          <li><strong>Territorio</strong><br />{experience.location}</li>
        </ul>
        <ExperienceDetailActions experience={experience} />
      </aside>
    </section>
  </>;
}
