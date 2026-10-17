import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BehaviorTrackedLink } from "@/components/BehaviorTrackedLink";
import { ExperienceCard } from "@/components/ExperienceCard";
import { getPublishedExperiencesByOperatorSlug, getPublishedOperatorBySlug } from "@/data/operators";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function externalUrl(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function whatsappUrl(value?: string, message?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const operator = await getPublishedOperatorBySlug(slug);
  if (!operator) return {};
  return { title: `${operator.name} | Operatori BIMARIS`, description: operator.description, openGraph: operator.imageUrl ? { images: [operator.imageUrl] } : undefined };
}

export default async function OperatorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [operator, experiences] = await Promise.all([getPublishedOperatorBySlug(slug), getPublishedExperiencesByOperatorSlug(slug)]);
  if (!operator) notFound();

  const website = externalUrl(operator.website);
  const instagram = externalUrl(operator.instagram);
  const whatsappMessage = `Buongiorno, vi contatto tramite BIMARIS. Ho visto la vostra realtà sulla piattaforma e vorrei ricevere maggiori informazioni.`;
  const whatsapp = whatsappUrl(operator.whatsapp, whatsappMessage);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(operator.googleMapsQuery)}`;
  const attribution = { operatorId: operator.slug, operatorName: operator.name, sourceType: "operator", sourceId: operator.slug };
  const analyticsBase = { operator_id: operator.slug, operator_name: operator.name, source_type: "operator", source_id: operator.slug };

  return <>
    <section className="page-hero"><div className="kicker">{operator.category ?? "Operatore selezionato"} · BIMARIS</div><h1>{operator.name}</h1><p>{operator.description}</p></section>
    {operator.imageUrl && <section className="culture-hero-wrap"><figure className="culture-hero-figure"><img src={operator.imageUrl} alt={operator.imageAlt ?? operator.name} decoding="async" /></figure></section>}
    <section className="section detail-grid">
      <article><div className="kicker">La selezione BIMARIS</div><h2 style={{fontFamily:"Georgia,serif",fontSize:42,marginTop:8}}>Perché questa realtà</h2><p style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{operator.whySelected ?? "Realtà coerente con i criteri BIMARIS di qualità, autenticità e legame con il territorio."}</p>{operator.territoryName && <p style={{fontSize:17,lineHeight:1.65,color:"#4d5962"}}><strong>Territorio:</strong> {operator.territoryName}</p>}</article>
      <aside className="detail-panel"><div className="kicker">Informazioni</div><h3>Contatta l'operatore</h3>
        <ul className="list">
          {operator.address && <li><strong>Indirizzo</strong><br />{operator.address}</li>}
          {operator.phone && <li><strong>Telefono</strong><br /><BehaviorTrackedLink className="text-link" href={`tel:${operator.phone}`} external analyticsEvent="operator_contact_click" analyticsData={{...analyticsBase,action_type:"phone"}} behaviorEvent="contact_intent" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={3} actionType="phone" {...attribution}>{operator.phone}</BehaviorTrackedLink></li>}
          {operator.email && <li><strong>Email</strong><br /><BehaviorTrackedLink className="text-link" href={`mailto:${operator.email}`} external analyticsEvent="operator_contact_click" analyticsData={{...analyticsBase,action_type:"email"}} behaviorEvent="contact_intent" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={3} actionType="email" {...attribution}>{operator.email}</BehaviorTrackedLink></li>}
        </ul>
        <div className="actions" style={{marginTop:22}}>
          <BehaviorTrackedLink className="button" href={directions} target="_blank" rel="noreferrer" external analyticsEvent="directions_click" analyticsData={{...analyticsBase,action_type:"directions"}} behaviorEvent="directions_open" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={2} actionType="directions" {...attribution}>Indicazioni</BehaviorTrackedLink>
          {whatsapp && <BehaviorTrackedLink className="button ghost" href={whatsapp} target="_blank" rel="noreferrer" external analyticsEvent="whatsapp_click" analyticsData={{...analyticsBase,action_type:"whatsapp"}} behaviorEvent="contact_intent" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={3} actionType="whatsapp" {...attribution}>WhatsApp</BehaviorTrackedLink>}
          {website && <BehaviorTrackedLink className="button ghost" href={website} target="_blank" rel="noreferrer" external analyticsEvent="website_click" analyticsData={{...analyticsBase,action_type:"website"}} behaviorEvent="operator_site_open" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={2} actionType="website" {...attribution}>Sito web</BehaviorTrackedLink>}
          {instagram && <BehaviorTrackedLink className="button ghost" href={instagram} target="_blank" rel="noreferrer" external analyticsEvent="instagram_click" analyticsData={{...analyticsBase,action_type:"instagram"}} behaviorEvent="operator_social_open" contentType="operator" contentId={operator.slug} interestKey="esperienze" weight={1.5} actionType="instagram" {...attribution}>Instagram</BehaviorTrackedLink>}
        </div>
      </aside>
    </section>
    {experiences.length > 0 && <section className="section sand"><div className="section-head"><div><div className="kicker">Cosa puoi vivere</div><h2>Le esperienze di {operator.name}</h2></div><p>Attività proposte da questa realtà e selezionate da BIMARIS.</p></div><div className="cards">{experiences.map(experience=><ExperienceCard key={experience.id} experience={experience}/>)}</div></section>}
    <section className="section"><Link className="text-link" href="/operatori">← Tutti gli operatori</Link></section>
  </>;
}
