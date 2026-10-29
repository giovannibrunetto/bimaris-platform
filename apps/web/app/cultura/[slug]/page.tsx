import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BehaviorTrackedLink } from "@/components/BehaviorTrackedLink";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedCultureEntryBySlug } from "@/data/live";
import { historicalPeriodLabel } from "@/lib/historical-periods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const secondaryImages = gallery.filter(image => image !== hero);

  return <>
    <UserBehaviorSignal contentType="culture" contentId={entry.slug} interestKey="cultura" weight={0.5} />
    <section className="page-hero" style={{ paddingBottom: 28 }}><div className="kicker">Cultura · {entry.category}{periodLabel ? ` · ${periodLabel}` : ""}</div><h1>{entry.title}</h1><p>{entry.excerpt}</p><div className="actions" style={{ marginTop: 18 }}><Link className="button" href={mapUrl}>Apri in BIMARIS Map</Link><SaveToCollectionButton itemType="culture" itemId={entry.slug} interestKey="cultura" /></div></section>

    {hero && <section className="culture-hero-wrap"><figure className="culture-hero-figure"><img src={hero.imageUrl} alt={hero.altText ?? entry.title} decoding="async" />{(hero.caption || hero.author || hero.license) && <figcaption>{hero.caption && <>{hero.caption} · </>}Foto: {hero.author ?? "Wikimedia Commons"}{hero.license && <> · {hero.license}</>}{hero.sourceUrl && <> · <a href={hero.sourceUrl} target="_blank" rel="noreferrer">fonte</a></>}{hero.licenseUrl && <> · <a href={hero.licenseUrl} target="_blank" rel="noreferrer">licenza</a></>}</figcaption>}</figure></section>}

    <section className="section detail-grid"><article><div className="kicker">La storia</div><h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Conosci il luogo</h2><p style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962", whiteSpace: "pre-line" }}>{entry.body}</p>{entry.historicalPeriodNote && <div className="detail-panel" style={{ marginTop: 24 }}><div className="kicker">Epoca storica</div><h3>{periodLabel ?? "Più epoche"}</h3><p>{entry.historicalPeriodNote}</p>{entry.primaryHistoricalPeriod && entry.primaryHistoricalPeriod !== "trasversale" && <Link className="text-link" href={`/mappa/epoche?epoca=${entry.primaryHistoricalPeriod}`}>Vedi i luoghi della stessa epoca →</Link>}</div>}</article><aside className="detail-panel"><div className="kicker">Esplora</div><h3>{entry.placeName}</h3><ul className="list">{periodLabel && <li><strong>Epoca</strong><br />{periodLabel}</li>}{entry.address && <li><strong>Indirizzo</strong><br />{entry.address}</li>}<li><strong>Territorio</strong><br />Messina</li></ul><div className="actions" style={{ marginTop: 20 }}><Link className="button" href={mapUrl}>BIMARIS Map</Link><BehaviorTrackedLink className="button ghost" href={directionsUrl} target="_blank" rel="noreferrer" external analyticsEvent="directions_click" analyticsData={{ content_type: "culture", content_id: entry.id }} behaviorEvent="directions_open" contentType="culture" contentId={entry.slug} interestKey="cultura" weight={2}>Indicazioni Google Maps</BehaviorTrackedLink></div></aside></section>

    {secondaryImages.length > 0 && <section className="section"><div className="kicker">Galleria</div><h2 style={{ fontFamily: "Georgia,serif", fontSize: 36, marginTop: 8 }}>Altri sguardi</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 22 }}>{secondaryImages.map((image,index)=><figure className="culture-hero-figure" key={`${image.imageUrl}-${index}`} style={{ margin: 0 }}><img src={image.imageUrl} alt={image.altText ?? `${entry.title} — immagine ${index+2}`} loading="lazy" decoding="async" style={{ height: 260, objectFit: "cover" }} />{(image.caption || image.author || image.license) && <figcaption>{image.caption && <>{image.caption} · </>}Foto: {image.author ?? "Wikimedia Commons"}{image.license && <> · {image.license}</>}{image.sourceUrl && <> · <a href={image.sourceUrl} target="_blank" rel="noreferrer">fonte</a></>}{image.licenseUrl && <> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">licenza</a></>}</figcaption>}</figure>)}</div></section>}

    {entry.sources.length > 0 && <section className="section"><div className="detail-panel"><div className="kicker">Fonti</div><h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, marginTop: 8 }}>Per approfondire</h2><ul className="list" style={{ marginTop: 14 }}>{entry.sources.map((source,index)=><li key={`${source.url}-${index}`}><a className="text-link" href={source.url} target="_blank" rel="noreferrer">{source.label} →</a>{source.note && <><br /><span>{source.note}</span></>}</li>)}</ul></div></section>}

    <section className="section" style={{ paddingTop: 0 }}><Link className="text-link" href="/cultura">← Torna a Cultura</Link></section>
  </>;
}
