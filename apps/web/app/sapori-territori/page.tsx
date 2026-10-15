import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedFoodProducts } from "@/data/food-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sapori e territori | BIMARIS",
  description: "Scopri i prodotti tipici di Messina e della sua provincia, i territori da cui nascono e le esperienze per conoscerli dal vivo.",
};

export default async function SaporiTerritoriPage() {
  const products = await getPublishedFoodProducts();
  const territories = Array.from(new Map(products.filter(p => p.territory).map(p => [p.territory!.slug, p.territory!])).values());

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Sapori e territori</div>
        <h1>Un territorio si conosce anche attraverso ciò che produce.</h1>
        <p>Vini, formaggi, salumi, prodotti da forno e specialità locali raccontati nel luogo in cui nascono. BIMARIS collega ogni prodotto ai produttori selezionati e, quando disponibili, alle esperienze per assaggiarlo e conoscerlo dal vivo.</p>
      </section>

      {territories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div><div className="kicker">Da dove nasce</div><h2>Esplora per territorio</h2></div>
            <p>Ogni area ha prodotti, tradizioni e identità gastronomiche proprie.</p>
          </div>
          <div className="category-grid">
            {territories.map(territory => (
              <a className="category" key={territory.slug} href={`#territorio-${territory.slug}`}>
                <strong>{territory.name}</strong>
                {territory.description && <span>{territory.description}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Prodotti del territorio</div><h2>Scopri cosa rende unico ogni luogo</h2></div>
          <p>Non un catalogo commerciale, ma storie di prodotti, origini e tradizioni.</p>
        </div>

        {products.length > 0 ? (
          <div className="cards">
            {products.map(product => (
              <article className="card" key={product.id} id={product.territory ? `territorio-${product.territory.slug}` : undefined}>
                {product.imageUrl && <img src={product.imageUrl} alt={product.imageAlt ?? product.name} loading="lazy" decoding="async" />}
                <div className="card-body">
                  <div className="kicker">{product.territory?.name ?? "Territorio messinese"}</div>
                  <h3>{product.name}</h3>
                  <p>{product.excerpt}</p>
                  <Link className="text-link" href={`/sapori-territori/${product.slug}`}>Scopri il prodotto →</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <div className="kicker">Selezione BIMARIS</div>
            <h3>I primi prodotti sono in preparazione</h3>
            <p>Stiamo costruendo le schede dei prodotti tipici partendo dal loro legame con i diversi territori messinesi.</p>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="kicker">Dal prodotto all'esperienza</div><h2>Vuoi assaggiarlo dove nasce?</h2></div>
          <p>Le degustazioni e le visite non sono prodotti: sono esperienze. Le trovi nella sezione dedicata e saranno collegate alle singole specialità.</p>
        </div>
        <Link className="button" href="/esperienze">Scopri le esperienze</Link>
      </section>
    </>
  );
}
