import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceDetailActions } from "@/components/ExperienceDetailActions";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedExperienceBySlug, getPublishedExperiencePartners, getPublishedFoodProductsByExperienceId } from "@/data/live";

export const dynamic="force-dynamic";export const revalidate=0;
function legacyInterest(category?:string){if(category==="degustazioni")return "sapori";if(category==="mare")return "mare";if(category==="avventura")return "avventura";if(category==="trekking-natura")return "natura-trekking";return "esperienze";}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const experience=await getPublishedExperienceBySlug(slug);if(!experience)return{};return{title:`${experience.name} | Esperienze BIMARIS`,description:experience.excerpt,openGraph:experience.imageUrl?{images:[experience.imageUrl]}:undefined};}
export default async function ExperienceDetailPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const experience=await getPublishedExperienceBySlug(slug);if(!experience)notFound();const[products,partners]=await Promise.all([getPublishedFoodProductsByExperienceId(experience.id),getPublishedExperiencePartners(experience.id)]);const interestKey=experience.interestKey??legacyInterest(experience.category);const taxonomy=[...(experience.interestNames??[]),...(experience.activityNames??[])];return <>
<UserBehaviorSignal contentType="experience" contentId={experience.slug} interestKey={interestKey} weight={0.75}/>
<div className="experience-page-surface">
<section className="section experience-overview">
  <header className="experience-overview-heading">
    <div className="kicker">{experience.location}{taxonomy.length ? ` · ${taxonomy.join(" · ")}` : experience.categoryName ? ` · ${experience.categoryName}` : ""}</div>
    <h1>{experience.name}</h1>
    <p>{experience.excerpt}</p>
  </header>
  <div className={experience.imageUrl ? "experience-summary" : "experience-summary experience-summary-text-only"}>
    <div className="experience-summary-story">
    {experience.imageUrl && (
      <figure className="experience-summary-photo">
        <img src={experience.imageUrl} alt={experience.imageAlt ?? experience.name} decoding="async"/>
      </figure>
    )}
    </div>
    <div className="experience-summary-content">
    <aside className="detail-panel experience-info-panel"><ul className="list"><li><strong>Operatore</strong><br/>{experience.operatorSlug?<Link className="text-link" href={`/operatori/${experience.operatorSlug}`}>{experience.operatorName}</Link>:experience.operatorName}</li>{partners.length>0&&<li><strong>In collaborazione con</strong><br/>{partners.map((partner,index)=><span key={partner.slug??partner.name}>{index>0?", ":""}{partner.slug?<Link className="text-link" href={`/operatori/${partner.slug}`}>{partner.name}</Link>:partner.name}</span>)}</li>}{experience.duration&&<li><strong>Durata</strong><br/>{experience.duration}</li>}{experience.priceFrom!=null&&<li><strong>Prezzo indicativo</strong><br/>Da € {experience.priceFrom}</li>}<li><strong>Territorio</strong><br/>{experience.location}</li>{experience.meetingPoint&&<li><strong>Punto di incontro</strong><br/>{experience.meetingPoint}</li>}</ul>{experience.bookingNote&&<p className="muted experience-booking-note">{experience.bookingNote}</p>}<div className="experience-summary-actions"><ExperienceDetailActions experience={experience}/><SaveToCollectionButton itemType="experience" itemId={experience.slug} interestKey={interestKey}/></div></aside>
    <div className="experience-summary-description">
      <h2 className="experience-detail-title">Cosa vivrai</h2>
      <p className="experience-detail-copy">{experience.description}</p>
      {experience.whySelected && (
        <p className="experience-selection"><strong>Perché BIMARIS l’ha scelta</strong><br/>{experience.whySelected}</p>
      )}
    </div>
    </div>
  </div>
  {partners.length>0&&<div className="detail-panel experience-detail-panel"><div className="kicker">Rete BIMARIS</div><h3>Un'esperienza costruita insieme</h3><p>Questa esperienza nasce dalla collaborazione tra operatori della rete BIMARIS.</p><ul className="list">{partners.map(partner=><li key={partner.slug??partner.name}><strong>{partner.slug?<Link className="text-link" href={`/operatori/${partner.slug}`}>{partner.name}</Link>:partner.name}</strong>{partner.activity&&<><br/>{partner.activity}</>}</li>)}</ul></div>}
</section>
{products.length>0&&<section className="section sand"><div className="section-head"><div><div className="kicker">Dall'esperienza al prodotto</div><h2>Scopri ciò che stai assaggiando</h2></div><p>Approfondisci origine, identità e territorio dei prodotti protagonisti di questa esperienza.</p></div><div className="cards">{products.map(product=><article className="card card-hit-area" key={product.slug}><div className="card-body"><div className="kicker">{product.territoryName??"Sapori e territori"}</div><h3>{product.name}</h3>{product.excerpt&&<p>{product.excerpt}</p>}<Link className="text-link card-primary-link" href={`/sapori-territori/${product.slug}`} aria-label={`Scopri ${product.name}`}>Scopri il prodotto →</Link></div></article>)}</div></section>}
</div>
<style>{`
.experience-page-surface{background:var(--sand,#f3efe6);color:var(--ink,#101820);min-height:inherit}
.experience-overview{max-width:1200px;margin-inline:auto;padding:clamp(18px,2.4vw,30px) clamp(20px,4vw,48px)}
.experience-overview-heading h1{font-family:Georgia,serif;font-size:clamp(30px,3.25vw,44px);line-height:1.1;margin:8px 0 12px;overflow-wrap:anywhere}
.experience-overview-heading p{margin:0 0 16px;max-width:90ch}
.experience-summary{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start;gap:16px 24px}
.experience-summary-text-only{grid-template-columns:minmax(0,1fr)}
.experience-summary-photo{margin:0}
.experience-summary-photo img{display:block;width:100%;aspect-ratio:16/10;max-height:310px;object-fit:cover;border-radius:18px}
.experience-summary-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:10px}
.experience-overview .experience-info-panel{padding:20px;min-width:0;overflow-wrap:anywhere}
.experience-overview .experience-info-panel .list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(120px,100%),1fr));gap:12px}
.experience-overview .experience-info-panel .list li{padding:0;border:0}
.experience-summary-story,.experience-summary-content{min-width:0}
.experience-summary-content{display:grid;gap:16px}
.experience-summary-description{min-width:0;overflow-wrap:anywhere}
.experience-summary-text-only .experience-summary-story{display:none}
.experience-overview .kicker,.experience-overview .text-link{color:#80551e}
.experience-overview .experience-info-panel{background:inherit;border:1px solid #d9c69e}
.experience-page-surface .experience-summary-actions .button.ghost,
.experience-page-surface .experience-summary-actions button[aria-pressed]{
  background:transparent;border:1px solid #9d9383;color:var(--ink,#101820);box-shadow:none
}
.experience-page-surface .experience-summary-actions .button.ghost:hover,
.experience-page-surface .experience-summary-actions button[aria-pressed]:hover{background:#f1e8d6}
.experience-page-surface .experience-summary-actions .button[href^="https://www.google.com/maps/dir/"]{
  background:var(--gold,#caa86a);border-color:#ab874b;color:var(--ink,#101820)
}
.experience-page-surface .experience-summary-actions .button[href^="https://www.google.com/maps/dir/"]:hover{background:#d5b578}
.experience-detail-title{font-family:Georgia,serif;font-size:clamp(24px,2.5vw,32px);line-height:1.15;margin:0 0 6px}
.experience-detail-copy,.experience-selection{font-size:clamp(16px,1.5vw,18px);line-height:1.45;color:var(--ink,#101820);margin:0}
.experience-selection{margin-top:8px}
.experience-detail-panel{margin-top:28px;padding:clamp(24px,3vw,34px);border:1px solid var(--line);border-radius:18px;background:#fff}.experience-detail-panel h3,.experience-info-panel h3{font-family:Georgia,serif;font-size:clamp(24px,2.5vw,30px);line-height:1.15;margin:8px 0 16px}.experience-detail-panel p:last-child{margin-bottom:0}.experience-info-panel{align-self:start;padding:clamp(24px,3vw,34px);border-radius:18px}.experience-info-panel .list{margin:0;padding:0;list-style:none}.experience-info-panel .list li{padding:14px 0;border-bottom:1px solid var(--line)}.experience-info-panel .list li:last-child{border-bottom:0}.experience-booking-note{margin-top:18px}.experience-overview .text-link:focus-visible{outline:3px solid var(--color-accent,#CAA86A);outline-offset:3px}@media(max-width:760px){.experience-summary{grid-template-columns:1fr;gap:16px}.experience-detail-panel{margin-top:20px;padding:22px}.experience-detail-copy{line-height:1.65}}`}</style>
</>;}
