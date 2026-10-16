import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceDetailActions } from "@/components/ExperienceDetailActions";
import { getPublishedExperienceBySlug, getPublishedFoodProductsByExperienceId } from "@/data/live";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getPublishedExperienceBySlug(slug);
  if (!experience) return {};

  return {
    title: `${experience.name} | Esperienze BIMARIS`,
    description: experience.excerpt,
    openGraph: experience.imageUrl ? { images: [experience.imageUrl] } : undefined,
  };
}

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getPublishedExperienceBySlug(slug);

  if (!experience) notFound();
  const products = await getPublishedFoodProductsByExperienceId(experience.id);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">{experience.location} · {experience.categoryName}</div>
        <h1>{experience.name}</h1>
        <p>{experience.excerpt}</p>
      </section>

      {experience.imageUrl && (
        <section className="culture-hero-wrap">
          <figure className="culture-hero-figure">
            <img src={experience.imageUrl} alt={experience.imageAlt ?? experience.name} decoding="async" />
          </figure>
        </section>
      )}

      <section className="section detail-grid">
        <article>
          <div className="kicker">L'esperienza</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Cosa vivrai</h2>
          <p style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962" }}>{experience.description}</p>

          <div className="detail-panel" style={{ marginTop: 28 }}>
            <div className="kicker">Perché BIMARIS l'ha scelta</div>
            <h3>Il valore dell'esperienza</h3>
            <p>{experience.whySelected}</p>
          </div>
        </article>

        <aside className="detail-panel">
          <div className="kicker">Informazioni</div>
          <h3>Organizza l'esperienza</h3>
          <ul className="list">
            <li>
              <strong>Operatore</strong><br />
              {experience.operatorSlug ? <Link className="text-link" href={`/operatori/${experience.operatorSlug}`}>{experience.operatorName}</Link> : experience.operatorName}
            </li>
            {experience.duration && <li><strong>Durata</strong><br />{experience.duration}</li>}
            {experience.priceFrom != null && <li><strong>Prezzo indicativo</strong><br />Da € {experience.priceFrom}</li>}
            <li><strong>Territorio</strong><br />{experience.location}</li>
            {experience.meetingPoint && <li><strong>Punto di incontro</strong><br />{experience.meetingPoint}</li>}
          </ul>

          {experience.bookingNote && <p className="muted" style={{ marginTop: 18 }}>{experience.bookingNote}</p>}
          <ExperienceDetailActions experience={experience} />
        </aside>
      </section>

      {products.length > 0 && (
        <section className="section sand">
          <div className="section-head">
            <div><div className="kicker">Dall'esperienza al prodotto</div><h2>Scopri ciò che stai assaggiando</h2></div>
            <p>Approfondisci origine, identità e territorio dei prodotti protagonisti di questa esperienza.</p>
          </div>
          <div className="cards">
            {products.map(product => (
              <article className="card" key={product.slug}>
                <div className="card-body">
                  <div className="kicker">{product.territoryName ?? "Sapori e territori"}</div>
                  <h3>{product.name}</h3>
                  {product.excerpt && <p>{product.excerpt}</p>}
                  <Link className="text-link" href={`/sapori-territori/${product.slug}`}>Scopri il prodotto →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
