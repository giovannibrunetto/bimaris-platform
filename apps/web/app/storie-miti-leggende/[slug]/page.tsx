import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BehaviorTrackedLink } from "@/components/BehaviorTrackedLink";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedStoryBySlug } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const editorialIllustrations: Record<string, string> = {
  "scilla-e-cariddi": "/storie-miti-leggende/scilla-e-cariddi.webp",
  colapesce: "/storie-miti-leggende/colapesce.webp",
  "fata-morgana-stretto": "/storie-miti-leggende/fata-morgana.png?v=20261030-3",
  "mata-e-grifone": "/storie-miti-leggende/mata-e-grifone.webp",
};

const storyTypeLabels: Record<string, string> = {
  "tradizione leggendaria legata a un fenomeno naturale": "Leggenda naturale",
  "racconto religioso/devozionale": "Tradizione devozionale",
  "racconto religioso / devozionale": "Tradizione devozionale",
  "leggenda popolare": "Leggenda popolare",
  mito: "Mito",
  leggenda: "Leggenda",
  "tradizione popolare": "Tradizione popolare",
};

function shortStoryType(value: string) {
  return storyTypeLabels[value.trim().toLowerCase()] ?? value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) return {};
  const image = editorialIllustrations[slug] ?? story.imageUrl;
  return { title: `${story.title} | Miti e leggende di Messina | BIMARIS`, description: story.excerpt, openGraph: image ? { images: [image] } : undefined };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();

  const normalizedBody = story.body.replace(/\\n/g, "\n");
  const paragraphs = normalizedBody.split(/\n\s*\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
  const narrativeIllustration = editorialIllustrations[slug];
  const heroImage = narrativeIllustration ?? story.imageUrl;
  const heroAlt = narrativeIllustration ? `Illustrazione BIMARIS dedicata a ${story.title}` : story.imageAlt ?? story.title;
  const typeLabel = shortStoryType(story.storyType);
  const actionStyle = { width: "100%", height: 48, minHeight: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 12px", textAlign: "center" as const, whiteSpace: "nowrap" as const, fontSize: 14 };
  const contextItems = [
    ["Cosa è documentato", story.editorial?.documentedText],
    ["La tradizione", story.editorial?.traditionText],
    ["Interpretazioni", story.editorial?.interpretationsText],
    ["Cosa non è verificabile", story.editorial?.unverifiableText],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return <>
    <UserBehaviorSignal contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={0.5} />

    <section className="section" style={{ paddingTop: 24, paddingBottom: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,.72fr) minmax(0,1.38fr)", gap: 30, alignItems: "start" }}>
        <div>
          {heroImage && <figure className="culture-hero-figure" style={{ margin: 0, overflow: "hidden" }}>
            <img src={heroImage} alt={heroAlt} decoding="async" style={{ width: "100%", height: 286, objectFit: "cover", display: "block" }} />
            {!narrativeIllustration && <figcaption>{story.images.find(image => image.isPrimary)?.caption ?? story.imageAlt}</figcaption>}
          </figure>}
          <div style={{ display: "grid", gridTemplateColumns: story.places.length > 0 ? "repeat(2,minmax(0,1fr))" : "1fr", gap: 10, marginTop: 12 }}>
            {story.places.length > 0 && <BehaviorTrackedLink className="button" style={actionStyle} href={`/mappa?storia=${encodeURIComponent(story.slug)}`} analyticsEvent="map_open" analyticsData={{ source: "story", story_id: story.id }} behaviorEvent="map_open" contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={1.5}>Vedi sulla mappa BIMARIS</BehaviorTrackedLink>}
            <SaveToCollectionButton itemType="story" itemId={story.slug} interestKey="miti-leggende" buttonClassName="button" buttonStyle={actionStyle} wrapperStyle={{ marginTop: 0, width: "100%", height: 48 }} />
          </div>
        </div>

        <article>
          <div className="kicker">{typeLabel} · Messina e lo Stretto</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(34px,3.2vw,48px)", lineHeight: 1.02, margin: "7px 0 9px" }}>{story.title}</h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.4, color: "#4d5962", margin: "0 0 12px" }}>{story.excerpt}</p>
          <div className="kicker" style={{ marginBottom: 6 }}>Il racconto</div>
          {paragraphs.map((paragraph, index) => <p key={index} style={{ fontSize: 15, lineHeight: 1.5, color: "#344448", margin: index === 0 ? 0 : "8px 0 0" }}>{paragraph}</p>)}
        </article>
      </div>
    </section>

    <section className="section sand" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.62fr) minmax(270px,.5fr)", gap: 18, alignItems: "start" }}>
        <div>
          <div style={{ marginBottom: 10 }}><div className="kicker">Approfondisci</div><h2 style={{ fontFamily:"Georgia,serif", fontSize: 32, fontWeight:500, margin:"3px 0 0" }}>Dettagli del racconto</h2></div>
          {contextItems.length > 0 && <div className="cards" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            {contextItems.map(([label, text]) => <article className="card" key={label}><div className="card-body" style={{ padding: 12 }}><div className="eyebrow">{label}</div><p style={{ margin: "5px 0 0", fontSize: 13.5, lineHeight: 1.35 }}>{text}</p></div></article>)}
          </div>}
          {story.editorial?.originText && <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,.72)", borderRadius: 14 }}><div className="eyebrow">Origine della tradizione</div><p style={{ margin:"5px 0 0", fontSize:13.5, lineHeight:1.35 }}>{story.editorial.originText}</p>{story.editorial.periodLabel && <p className="muted" style={{ margin: "4px 0 0", fontSize: 12.5 }}>{story.editorial.periodLabel}</p>}</div>}
        </div>

        <aside className="detail-panel" style={{ padding: 16 }}>
          <div className="kicker">Nel territorio</div>
          <h3 style={{ margin:"5px 0 8px" }}>Luoghi collegati</h3>
          {story.editorial?.geographicReference && <p className="muted" style={{ fontSize:13.5, marginTop:0 }}>{story.editorial.geographicReference}</p>}
          {story.places.length > 0 ? <ul className="list">{story.places.map(place => {
            const hasCoordinates = Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
            const destination = hasCoordinates ? `${place.latitude},${place.longitude}` : place.googleMapsQuery;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            return <li key={`${place.position}-${place.googleMapsQuery}`} style={{ fontSize:13.5 }}><strong>{place.label ?? place.name}</strong>{place.address && <><br />{place.address}</>}{place.note && <><br /><span className="muted">{place.note}</span></>}<div style={{ marginTop: 5 }}><BehaviorTrackedLink className="text-link" href={directionsUrl} target="_blank" rel="noreferrer" external analyticsEvent="directions_click" analyticsData={{ content_type: "story", content_id: story.id }} behaviorEvent="directions_open" contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={2}>Come arrivare →</BehaviorTrackedLink></div></li>;
          })}</ul> : <p className="muted">Il racconto è legato a un’area o a una tradizione diffusa.</p>}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>{story.places.length > 0 && <BehaviorTrackedLink className="button" href={`/mappa?storia=${encodeURIComponent(story.slug)}`} analyticsEvent="map_open" analyticsData={{ source: "story", story_id: story.id }} behaviorEvent="map_open" contentType="story" contentId={story.slug} interestKey="miti-leggende" weight={1.5}>Mappa BIMARIS</BehaviorTrackedLink>}<Link className="button ghost" href="/storie-miti-leggende">Torna alle storie</Link></div>
        </aside>
      </div>
    </section>

    {story.sources.length > 0 && <section className="section" style={{ paddingTop: 14, paddingBottom: 16 }}>
      <details className="detail-panel" style={{ padding: "12px 16px" }}>
        <summary style={{ cursor:"pointer", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center", gap:20 }}><span><span className="kicker">Verifica</span><strong style={{ display:"block", fontFamily:"Georgia,serif", fontSize:24, marginTop:2 }}>Fonti e riferimenti</strong></span><span className="text-link">Mostra fonti ↓</span></summary>
        <ul className="list" style={{ columns: story.sources.length > 3 ? 2 : 1, columnGap: 36, marginTop:14 }}>{story.sources.map(source => <li key={`${source.sortOrder}-${source.label}`} style={{ breakInside: "avoid", fontSize:13.5 }}><strong>{source.label}</strong>{source.sourceType && <> · <span className="muted">{source.sourceType}</span></>}{source.note && <><br /><span className="muted">{source.note}</span></>}{source.url && <><br /><a className="text-link" href={source.url} target="_blank" rel="noreferrer">Consulta la fonte →</a></>}</li>)}</ul>
      </details>
    </section>}
  </>;
}
