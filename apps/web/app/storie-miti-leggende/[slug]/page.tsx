import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BehaviorTrackedLink } from "@/components/BehaviorTrackedLink";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedStoryBySlug } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const story = await getPublishedStoryBySlug(slug); if (!story) return {}; return { title: `${story.title} | Miti e leggende di Messina | BIMARIS`, description: story.excerpt, openGraph: story.imageUrl ? { images: [story.imageUrl] } : undefined }; }

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();
  const paragraphs = story.body.split(/\n\n+/).filter(Boolean);
  const secondaryImages = story.images.filter(image => !image.isPrimary);
  const contextItems = [
    ["Cosa è documentato", story.editorial?.documentedText],
    ["La tradizione", story.editorial?.traditionText],
    ["Interpretazioni", story.editorial?.interpretationsText],
    ["Cosa non è verificabile", story.editorial?.unverifiableText],
  ].filter((item): item is [string,string] => Boolean(item[1]));

  return <>
    <UserBehaviorSignal contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={0.5} />
    <section className="page-hero">
      <div className="kicker">{story.storyType} · Messina e lo Stretto</div>
      <h1>{story.title}</h1>
      <p>{story.excerpt}</p>
      <SaveToCollectionButton itemType="story" itemId={story.slug} interestKey="miti-leggende" />
    </section>

    {story.imageUrl && <section className="culture-hero-wrap"><figure className="culture-hero-figure" style={{ maxWidth: 920 }}><img src={story.imageUrl} alt={story.imageAlt ?? story.title} decoding="async" style={{ width:"100%",height:"auto",maxHeight:620,objectFit:"cover" }} /><figcaption>{story.images.find(image=>image.isPrimary)?.caption ?? story.imageAlt}{(story.imageAuthor || story.imageLicense) && <> · {story.imageAuthor ?? "BIMARIS"}{story.imageLicense && <> · {story.imageLicense}</>}{story.imageSourceUrl && <> · <a href={story.imageSourceUrl} target="_blank" rel="noreferrer">fonte</a></>}{story.imageLicenseUrl && <> · <a href={story.imageLicenseUrl} target="_blank" rel="noreferrer">licenza</a></>}</>}</figcaption></figure></section>}

    <section className="section detail-grid">
      <article>
        <div className="kicker">Il racconto</div>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:42,marginTop:8 }}>Tra storia e leggenda</h2>
        {paragraphs.map((paragraph,index)=><p key={index} style={{ fontSize:18,lineHeight:1.75,color:"#4d5962" }}>{paragraph}</p>)}
        {story.editorial?.originText && <div className="detail-panel" style={{marginTop:28}}><div className="kicker">Origine della tradizione</div><p>{story.editorial.originText}</p>{story.editorial.periodLabel && <p className="muted">{story.editorial.periodLabel}</p>}</div>}
      </article>

      <aside className="detail-panel">
        <div className="kicker">Sui luoghi della storia</div>
        <h3>Visita i luoghi collegati</h3>
        {story.editorial?.geographicReference && <p className="muted">{story.editorial.geographicReference}</p>}
        {story.places.length>0 ? <ul className="list">{story.places.map(place=>{ const hasCoordinates=Number.isFinite(place.latitude)&&Number.isFinite(place.longitude); const destination=hasCoordinates?`${place.latitude},${place.longitude}`:place.googleMapsQuery; const directionsUrl=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`; return <li key={`${place.position}-${place.googleMapsQuery}`}><strong>{place.label??place.name}</strong>{place.address&&<><br/>{place.address}</>}{place.note&&<><br/><span className="muted">{place.note}</span></>}<div style={{marginTop:12}}><BehaviorTrackedLink className="text-link" href={directionsUrl} target="_blank" rel="noreferrer" external analyticsEvent="directions_click" analyticsData={{content_type:"story",content_id:story.id}} behaviorEvent="directions_open" contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={2}>Come arrivare con Google Maps →</BehaviorTrackedLink></div></li>; })}</ul> : <p className="muted">Il racconto è legato a un’area o a una tradizione diffusa, non a un singolo punto visitabile.</p>}
        <div className="actions" style={{marginTop:22}}>{story.places.length>0&&<BehaviorTrackedLink className="button" href={`/mappa?storia=${encodeURIComponent(story.slug)}`} analyticsEvent="map_open" analyticsData={{source:"story",story_id:story.id}} behaviorEvent="map_open" contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={1.5}>Vedi sulla mappa BIMARIS</BehaviorTrackedLink>}<Link className="button ghost" href="/storie-miti-leggende">Torna alle storie</Link></div>
      </aside>
    </section>

    {contextItems.length>0 && <section className="section sand"><div className="section-head"><div><div className="kicker">Metodo BIMARIS</div><h2>Fatto, tradizione e interpretazione</h2></div><p>La scheda distingue ciò che le fonti documentano da ciò che appartiene al racconto e alla memoria locale.</p></div><div className="cards">{contextItems.map(([label,text])=><article className="card" key={label}><div className="card-body"><div className="eyebrow">{label}</div><p>{text}</p></div></article>)}</div></section>}

    {secondaryImages.length>0 && <section className="section"><div className="section-head"><div><div className="kicker">Immagini</div><h2>Il racconto nel territorio</h2></div></div><div className="cards">{secondaryImages.map(image=><figure className="card" key={image.imageUrl}><div className="card-media" style={{aspectRatio:"4 / 3",padding:0,overflow:"hidden"}}><img src={image.imageUrl} alt={image.altText ?? story.title} loading="lazy" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div><figcaption className="card-body"><p>{image.caption}</p><p className="muted">{image.author}{image.license && ` · ${image.license}`}{image.sourceUrl && <> · <a href={image.sourceUrl} target="_blank" rel="noreferrer">fonte</a></>}{image.licenseUrl && <> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">licenza</a></>}</p></figcaption></figure>)}</div></section>}

    {story.sources.length>0 && <section className="section"><div className="section-head"><div><div className="kicker">Fonti</div><h2>Per approfondire</h2></div><p>Riferimenti utilizzati per la verifica e la contestualizzazione della scheda.</p></div><div className="detail-panel"><ul className="list">{story.sources.map(source=><li key={`${source.sortOrder}-${source.label}`}><strong>{source.label}</strong>{source.sourceType && <> · <span className="muted">{source.sourceType}</span></>}{source.note && <><br/><span className="muted">{source.note}</span></>}{source.url && <><br/><a className="text-link" href={source.url} target="_blank" rel="noreferrer">Consulta la fonte →</a></>}</li>)}</ul></div></section>}
  </>;
}
