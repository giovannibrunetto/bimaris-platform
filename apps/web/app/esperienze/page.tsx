import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceExplorer } from "@/components/ExperienceExplorer";
import { getPublishedExperiences } from "@/data/live";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Esperienze a Messina | BIMARIS",
  description: "Esperienze selezionate a Messina e provincia: mare, natura, cultura, sapori e artigianato scelti da BIMARIS.",
};

export default async function ExperiencesPage() {
  const experiences = await getPublishedExperiences();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Vivi il territorio</div>
        <h1>Esperienze BIMARIS</h1>
        <p>
          Non un elenco indiscriminato di attività, ma una selezione di esperienze legate a operatori verificati e capaci di raccontare il territorio messinese con qualità e autenticità.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Scopri</div>
            <h2>Scegli cosa vivere.</h2>
          </div>
          <p>Mare, natura, cultura, gastronomia e artigianato. Puoi filtrare la raccolta per categoria e territorio.</p>
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
