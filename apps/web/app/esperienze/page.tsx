import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceExplorer } from "@/components/ExperienceExplorer";
import { getPublishedExperiences } from "@/data/live";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Esperienze a Messina | BIMARIS",
  description: "Esperienze selezionate a Messina e provincia: degustazioni, mare, avventura, trekking, visite guidate e laboratori scelti da BIMARIS.",
};

const experienceCategories = [
  { title: "Degustazioni", text: "Cantine, prodotti locali e incontri dedicati ai sapori del territorio." },
  { title: "Mare", text: "Navigazioni, attività nello Stretto e modi autentici di vivere il mare." },
  { title: "Avventura", text: "Rafting e attività dinamiche per scoprire il territorio in modo diverso." },
  { title: "Trekking e natura", text: "Escursioni, sentieri e attività all'aperto tra monti e paesaggi messinesi." },
  { title: "Visite guidate", text: "Esperienze accompagnate per conoscere luoghi, storia e patrimonio locale." },
  { title: "Artigianato e laboratori", text: "Botteghe, lavorazioni e attività pratiche legate ai saperi del territorio." },
];

export default async function ExperiencesPage() {
  const experiences = await getPublishedExperiences();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Vivi il territorio</div>
        <h1>Esperienze BIMARIS</h1>
        <p>
          Attività selezionate per vivere Messina e il suo territorio attraverso operatori verificati, esperienze autentiche e un forte legame con i luoghi.
        </p>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Cosa vuoi fare?</div>
            <h2>Scegli la tua esperienza.</h2>
          </div>
          <p>Dal vino allo Stretto, dai sentieri alle attività più dinamiche: scegli il tipo di esperienza che vuoi vivere.</p>
        </div>

        <div className="cards">
          {experienceCategories.map(category => (
            <article className="card" key={category.title}>
              <div className="card-body">
                <h3>{category.title}</h3>
                <p>{category.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Selezione BIMARIS</div>
            <h2>Esperienze disponibili.</h2>
          </div>
          <p>Quando le esperienze vengono pubblicate puoi filtrarle per categoria e territorio e aprire la proposta dell'operatore che la realizza.</p>
        </div>

        {experiences.length > 0 ? (
          <ExperienceExplorer experiences={experiences} />
        ) : (
          <div className="detail-panel">
            <div className="kicker">Selezione in corso</div>
            <h3>Le prime esperienze saranno pubblicate dopo la verifica degli operatori.</h3>
            <p>
              Preferiamo partire con poche proposte realmente selezionate piuttosto che riempire BIMARIS con attività non ancora verificate.
            </p>
            <div className="actions">
              <Link className="button" href="/operatori/candidatura">Sei un operatore? Candidati</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
