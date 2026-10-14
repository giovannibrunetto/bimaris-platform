import { BimarisGoogleMap } from "@/components/BimarisGoogleMap";

export default function MapPage() {
  return (
    <>
      <section className="page-hero">
        <div className="kicker">Esplora</div>
        <h1>Mappa BIMARIS</h1>
        <p>Esplora Messina sulla mappa BIMARIS. Qui confluiranno operatori, monumenti, luoghi culturali e i luoghi legati a storia, miti e leggende.</p>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Messina intorno a te</div>
            <h2>Scopri il territorio sulla mappa.</h2>
          </div>
          <p>La mappa diventerà il punto comune per raggiungere operatori, monumenti e luoghi raccontati da BIMARIS. Puoi già usare “La mia posizione” per centrare la mappa su dove ti trovi.</p>
        </div>

        <BimarisGoogleMap />
      </section>
    </>
  );
}
