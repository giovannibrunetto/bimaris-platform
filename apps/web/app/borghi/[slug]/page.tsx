import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedVillageBySlug } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const village = await getPublishedVillageBySlug(slug);
  if (!village) return {};
  return { title: `${village.name} | Borghi | BIMARIS`, description: village.excerpt, openGraph: village.imageUrl ? { images: [village.imageUrl] } : undefined };
}

export default async function VillagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const village = await getPublishedVillageBySlug(slug);
  if (!village) notFound();

  return <>
    <section className="page-hero">
      <div className="kicker">{village.territory?.name ?? "Borghi"}</div>
      <h1>{village.name}</h1>
      <p>{village.excerpt}</p>
    </section>

    {village.imageUrl && <section className="culture-hero-wrap"><figure className="culture-hero-figure"><img src={village.imageUrl} alt={village.imageAlt ?? village.name} decoding="async" /></figure></section>}

    <section className="section detail-grid">
      <article>
        <div className="kicker">Il borgo</div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Identità e territorio</h2>
        <p style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962" }}>{village.description}</p>
        {village.identity && <><h3>Perché è unico</h3><p>{village.identity}</p></>}
        {village.history && <><h3>Storia</h3><p>{village.history}</p></>}
        {village.thingsToSee && <><h3>Cosa vedere</h3><p>{village.thingsToSee}</p></>}
      </article>

      <aside className="detail-panel">
        <div className="kicker">Organizza la visita</div>
        <h3>{village.name}</h3>
        {village.address && <p>{village.address}</p>}
        <a className="button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(village.googleMapsQuery)}`} target="_blank" rel="noreferrer">Apri in Google Maps</a>
      </aside>
    </section>

    <section className="section sand">
      <div className="section-head"><div><div className="kicker">Continua a esplorare</div><h2>Inseriscilo nel tuo percorso.</h2></div><p>Il borgo è collegato alla mappa BIMARIS, dove potrai combinarlo con monumenti, miti, sapori ed esperienze.</p></div>
      <div className="actions"><Link className="button" href="/mappa">Vai alla mappa</Link><Link className="button secondary" href="/borghi">Tutti i borghi</Link></div>
    </section>
  </>;
}
