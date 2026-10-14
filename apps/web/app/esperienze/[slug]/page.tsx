"use client";

import { notFound, useParams } from "next/navigation";
import { experiences } from "@/data/mock";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

export default function ExperienceDetailPage() {
  const params = useParams<{ slug: string }>();
  const experience = experiences.find(e => e.slug === params.slug);
  useEffect(() => {
    if (experience) track("experience_view", { experience_id: experience.id, experience_name: experience.name, territory: experience.territory, category: experience.category });
  }, [experience]);
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
          <li><strong>Durata</strong><br />{experience.duration}</li>
          <li><strong>Prezzo indicativo</strong><br />Da € {experience.priceFrom}</li>
          <li><strong>Territorio</strong><br />{experience.territory}</li>
        </ul>
        <button className="button" onClick={() => track("whatsapp_click", { experience_id: experience.id, operator: experience.operatorName })}>Contatta su WhatsApp</button>
      </aside>
    </section>
  </>;
}
