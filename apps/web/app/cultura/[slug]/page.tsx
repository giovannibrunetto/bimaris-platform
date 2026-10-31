import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BehaviorTrackedLink } from "@/components/BehaviorTrackedLink";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedCultureEntries, getPublishedCultureEntryBySlug } from "@/data/live";
import { historicalPeriodLabel } from "@/lib/historical-periods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const preserveFullHeroSlugs = new Set([
  "fontana-di-orione",
  "pilone-torre-faro",
]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);
  if (!entry) return {};
  return { title: `${entry.title} | Cultura a Messina | BIMARIS`, description: entry.excerpt, openGraph: entry.imageUrl ? { images: [entry.imageUrl] } : undefined };
}

export default async function CultureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);
  if (!entry) notFound();
  const hasCoordinates = Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude);
  const destination = hasCoordinates ? `${entry.latitude},${entry.longitude}` : entry.googleMapsQuery;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const mapUrl = hasCoordinates ? `/mappa?lat=${entry.latitude}&lng=${entry.longitude}` : `/mappa?q=${encodeURIComponent(entry.googleMapsQuery)}`;
  const periodLabel = historicalPeriodLabel(entry.primaryHistoricalPeriod);
  const gallery = entry.images.length ? entry.images : entry.imageUrl ? [{ imageUrl: entry.imageUrl, altText: entry.imageAlt, author: entry.imageAuthor, license: entry.imageLicense, sourceUrl: entry.imageSourceUrl, licenseUrl: entry.imageLicenseUrl, isPrimary: true }] : [];
  const hero = gallery.find(image => image.isPrimary) ?? gallery[0];
  const preserveFullHero = preserveFullHeroSlugs.has(entry.slug);
  const cultureEntries = await getPublishedCultureEntries();
  const related = cultureEntries
    .filter(candidate => candidate.slug !== entry.slug)
    .map(candidate => {
      const samePrimaryPeriod = Boolean(entry.primaryHistoricalPeriod && candidate.primaryHistoricalPeriod === entry.primaryHistoricalPeriod);
      const sameCategory = candidate.category === entry.category;
      const sharedPeriod = Boolean(entry.historicalPeriods?.some(period => candidate.historicalPeriods?.includes(period)));
      const hasAdditionalRelation = sameCategory || (sharedPeriod && !samePrimaryPeriod);
      const relationLabel = sameCategory
        ? `Stesso contesto · ${candidate.category}`
        : sharedPeriod && !samePrimaryPeriod
          ? `Periodo storico collegato`
          : null;
      const relationReason = sameCategory
        ? `BIMARIS collega questo luogo perché appartiene allo stesso contesto culturale: ${candidate.category}.`
        : sharedPeriod && !samePrimaryPeriod
          ? `BIMARIS collega questo luogo perché condivide almeno un periodo storico documentato con quello che stai esplorando.`
          : null;
      return { candidate, samePrimaryPeriod, sameCategory, sharedPeriod, hasAdditionalRelation, relationLabel, relationReason, score: (sameCategory ? 4 : 0) + (sharedPeriod && !samePrimaryPeriod ? 2 : 0) + (samePrimaryPeriod ? 1 : 0) };
    })
    .filter(item => item.hasAdditionalRelation && item.relationLabel && item.relationReason)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title, "it"))
    .slice(0, 2);

  return <>
    <UserBehaviorSignal contentType="culture" contentId={entry.slug} interestKey="cultura" weight={0.5} />
    <style>{`
      .culture-detail{background:#f7f9f7;color:#172326;padding-bottom:28px}
      .culture-detail-shell{width:min(1180px,calc(100% - 48px));margin:0 auto}
      .culture-detail-hero{background:linear-gradient(115deg,#07343b 0%,#032126 72%);color:#fff;padding:42px 0 38px}
      .culture-detail-hero h1{max-width:900px;margin:10px 0 14px;font:500 clamp(36px,3.7vw,56px)/1.04 Georgia,serif;letter-spacing:-.022em}
      .culture-detail-hero p{max-width:850px;margin:0;color:#dce8e5;font-size:17px;line-height:1.58}
      .culture-detail-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;align-items:center}
      .culture-detail-media{padding:34px 0 0}.culture-detail-main-photo{margin:0}
      .culture-detail-main-photo img{width:100%;height:clamp(360px,46vw,570px);display:block;object-fit:cover;border-radius:22px;box-shadow:0 16px 46px rgba(7,52,59,.11)}
      .culture-detail-main-photo--preserve{background:#e9efed;border-radius:22px;overflow:hidden;box-shadow:0 16px 46px rgba(7,52,59,.11)}
      .culture-detail-main-photo--preserve img{height:clamp(430px,52vw,650px);object-fit:contain;box-shadow:none;border-radius:0}
      .culture-detail-caption{max-width:980px;margin:9px 2px 0;color:#687777;font-size:11px;line-height:1.45}.culture-detail-caption a{text-decoration:underline;text-underline-offset:2px}
      .culture-detail-story{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.7fr);gap:52px;padding:58px 0 46px;align-items:start}.culture-detail-copy{max-width:760px}
      .culture-detail-copy h2,.culture-detail-sources h2{font:500 clamp(34px,4vw,48px)/1.08 Georgia,serif;margin:7px 0 22px;letter-spacing:-.02em}.culture-detail-body{font-size:17px;line-height:1.72;color:#435354;white-space:pre-line;margin:0}
      .culture-detail-side{display:grid;gap:16px;position:sticky;top:96px}.culture-detail-card{background:#fff;border:1px solid #d7dfdc;border-radius:20px;padding:24px;box-shadow:0 10px 30px rgba(7,52,59,.045)}
      .culture-detail-card h3{font:600 25px/1.15 Georgia,serif;margin:7px 0 13px}.culture-detail-card p{color:#536363;line-height:1.55;margin:0}.culture-detail-facts{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:13px}.culture-detail-facts li{padding-top:13px;border-top:1px solid #e5ebe8;color:#536363;line-height:1.4}.culture-detail-facts strong{display:block;color:#172326;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}.culture-detail-card .actions{margin-top:18px;gap:8px}.culture-detail-card .button{padding:11px 15px;font-size:14px}
      .culture-detail-sources{padding:10px 0 40px}.culture-detail-sources-card{background:#fff;border:1px solid #d7dfdc;border-radius:20px;padding:28px 30px}.culture-detail-source-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 30px;list-style:none;padding:0;margin:8px 0 0}.culture-detail-source-list li{padding:15px 0;border-top:1px solid #e5ebe8;color:#5b6969;line-height:1.45}.culture-detail-source-list a{display:block;color:#8d6b34;font-weight:700;margin-bottom:3px}
      .culture-detail-related{padding:4px 0 28px;border-top:1px solid #dce4e1}.culture-detail-related-head{display:flex;align-items:end;justify-content:space-between;gap:24px;padding:20px 0 14px}.culture-detail-related h2{font:500 30px/1.08 Georgia,serif;margin:4px 0 0;letter-spacing:-.02em}.culture-detail-related-intro{max-width:720px;margin:7px 0 0;color:#5b6969;font-size:13px;line-height:1.45}.culture-detail-related-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.culture-detail-related-card{display:grid;grid-template-columns:132px minmax(0,1fr);min-height:118px;background:#fff;border:1px solid #d7dfdc;border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;transition:border-color .18s ease,transform .18s ease}.culture-detail-related-card:hover{border-color:#caa86a;transform:translateY(-1px)}.culture-detail-related-card img{width:100%;height:100%;min-height:118px;object-fit:cover;display:block}.culture-detail-related-copy{padding:12px 16px;align-self:center}.culture-detail-related-meta{display:block;color:#9a753c;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}.culture-detail-related-title{display:block;font:600 19px/1.12 Georgia,serif;color:#172326;margin-bottom:5px}.culture-detail-related-reason{display:block;color:#5b6969;font-size:11px;line-height:1.35;margin-bottom:5px}.culture-detail-related-link{display:block;color:#536363;font-size:12px;font-weight:700}
      @media(max-width:820px){.culture-detail-shell{width:min(100% - 32px,1180px)}.culture-detail-hero{padding:34px 0}.culture-detail-story{grid-template-columns:1fr;gap:26px;padding:42px 0 36px}.culture-detail-copy{max-width:none}.culture-detail-side{position:static}.culture-detail-source-list{grid-template-columns:1fr}.culture-detail-main-photo img{height:clamp(300px,62vw,480px)}.culture-detail-main-photo--preserve img{height:clamp(390px,78vw,560px)}.culture-detail-related-grid{grid-template-columns:1fr}.culture-detail-related-head{align-items:start}.culture-detail-related-card{grid-template-columns:112px minmax(0,1fr)}}
      @media(max-width:520px){.culture-detail-shell{width:min(100% - 24px,1180px)}.culture-detail-hero h1{font-size:36px}.culture-detail-hero p{font-size:15px}.culture-detail-main-photo img{height:300px;border-radius:16px}.culture-detail-main-photo--preserve{border-radius:16px}.culture-detail-main-photo--preserve img{height:min(116vw,470px);border-radius:0}.culture-detail-body{font-size:16px}.culture-detail-card,.culture-detail-sources-card{padding:20px}.culture-detail-related-card{grid-template-columns:96px minmax(0,1fr)}.culture-detail-related-title{font-size:17px}}
    `}</style>
    <main className="culture-detail">
      <section className="culture-detail-hero"><div className="culture-detail-shell"><div className="kicker">Cultura · {entry.category}{periodLabel ? ` · ${periodLabel}` : ""}</div><h1>{entry.title}</h1><p>{entry.excerpt}</p><div className="culture-detail-actions"><Link className="button" href={mapUrl}>Apri in BIMARIS Map</Link><SaveToCollectionButton itemType="culture" itemId={entry.slug} interestKey="cultura" /></div></div></section>
      {hero && <section className="culture-detail-media"><div className="culture-detail-shell"><figure className={`culture-detail-main-photo${preserveFullHero ? " culture-detail-main-photo--preserve" : ""}`}><img src={hero.imageUrl} alt={hero.altText ?? entry.title} decoding="async" />{(hero.caption || hero.author || hero.license) && <figcaption className="culture-detail-caption">{hero.caption && <>{hero.caption} · </>}Foto: {hero.author ?? "Wikimedia Commons"}{hero.license && <> · {hero.license}</>}{hero.sourceUrl && <> · <a href={hero.sourceUrl} target="_blank" rel="noreferrer">fonte</a></>}{hero.licenseUrl && <> · <a href={hero.licenseUrl} target="_blank" rel="noreferrer">licenza</a></>}</figcaption>}</figure></div></section>}
      <div className="culture-detail-shell"><section className="culture-detail-story"><article className="culture-detail-copy"><div className="kicker">La storia</div><h2>Conosci il luogo</h2><p className="culture-detail-body">{entry.body}</p></article><aside className="culture-detail-side">{entry.historicalPeriodNote && <div className="culture-detail-card"><div className="kicker">Epoca storica</div><h3>{periodLabel ?? "Più epoche"}</h3><p>{entry.historicalPeriodNote}</p>{entry.primaryHistoricalPeriod && entry.primaryHistoricalPeriod !== "trasversale" && <Link className="text-link" style={{display:"inline-block",marginTop:14}} href={`/mappa/epoche?epoca=${entry.primaryHistoricalPeriod}`}>Vedi i luoghi della stessa epoca →</Link>}</div>}<div className="culture-detail-card"><div className="kicker">Esplora</div><h3>{entry.placeName}</h3><ul className="culture-detail-facts">{entry.address && <li><strong>Indirizzo</strong>{entry.address}</li>}<li><strong>Territorio</strong>Messina</li></ul><div className="actions"><Link className="button" href={mapUrl}>BIMARIS Map</Link><BehaviorTrackedLink className="button ghost" href={directionsUrl} target="_blank" rel="noreferrer" external analyticsEvent="directions_click" analyticsData={{ content_type: "culture", content_id: entry.id }} behaviorEvent="directions_open" contentType="culture" contentId={entry.slug} interestKey="cultura" weight={2}>Google Maps</BehaviorTrackedLink></div></div></aside></section>
      {entry.sources.length > 0 && <section className="culture-detail-sources"><div className="culture-detail-sources-card"><div className="kicker">Fonti</div><h2>Fonti e riferimenti</h2><ul className="culture-detail-source-list">{entry.sources.map((source,index)=><li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noreferrer">{source.label} →</a>{source.note && <span>{source.note}</span>}</li>)}</ul></div></section>}
      {related.length > 0 && <section className="culture-detail-related"><div className="culture-detail-related-head"><div><div className="kicker">Continua a scoprire</div><h2>Luoghi collegati a questa storia</h2><p className="culture-detail-related-intro">BIMARIS mostra solo collegamenti che può motivare con i dati culturali disponibili.</p></div><Link className="text-link" href="/cultura">Vedi tutta Cultura →</Link></div><div className="culture-detail-related-grid">{related.map(({ candidate: item, relationLabel, relationReason }) => <Link className="culture-detail-related-card" href={`/cultura/${item.slug}`} key={item.slug}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title} loading="lazy" decoding="async" /> : <div aria-hidden="true" /> }<span className="culture-detail-related-copy"><span className="culture-detail-related-meta">{relationLabel}</span><span className="culture-detail-related-title">{item.title}</span><span className="culture-detail-related-reason">{relationReason}</span><span className="culture-detail-related-link">Scopri il luogo →</span></span></Link>)}</div></section>}
      </div>
    </main>
  </>;
}
