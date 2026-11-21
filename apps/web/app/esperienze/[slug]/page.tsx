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
export default async function ExperienceDetailPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{operatore?:string;da?:string}>}){const{slug}=await params;const experience=await getPublishedExperienceBySlug(slug);if(!experience)notFound();const[products,partners]=await Promise.all([getPublishedFoodProductsByExperienceId(experience.id),getPublishedExperiencePartners(experience.id)]);const interestKey=experience.interestKey??legacyInterest(experience.category);const origin=await searchParams;
const returnOperator=origin.operatore && (origin.operatore===experience.operatorSlug || partners.some(partner=>partner.slug===origin.operatore)) ? origin.operatore : undefined;
const taxonomy=[...(experience.interestNames??[]),...(experience.activityNames??[])];return <>
<UserBehaviorSignal contentType="experience" contentId={experience.slug} interestKey={interestKey} weight={0.75}/>
<div className="experience-page-surface">
<section className="section experience-overview">
  <nav className="experience-page-back" aria-label="Navigazione di ritorno"><Link href={returnOperator ? origin.da==="area-operatore" ? `/area-operatore?operatore=${encodeURIComponent(returnOperator)}&tab=esperienze` : `/operatori/${encodeURIComponent(returnOperator)}${origin.da==="profilo"?"?da=profilo":""}` : "/esperienze"}>← {returnOperator ? (origin.da==="area-operatore" ? "Torna all’Area Operatore" : "Torna alla scheda operatore") : "Torna a esperienze e appuntamenti"}</Link></nav>
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
html:has(.experience-page-surface){scroll-padding-top:90px}
.experience-page-surface{background:#f5f2eb;color:#123139;min-height:inherit}
.experience-overview{max-width:1160px;margin-inline:auto;padding:clamp(22px,3vw,40px) clamp(18px,4vw,48px) 64px}
.experience-page-back{margin:0 0 24px}
.experience-page-back a{display:inline-flex;align-items:center;min-height:42px;padding:9px 16px;border:1px solid #c8b68e;border-radius:999px;background:#fffdf9;color:#123d43;font-size:13px;font-weight:750}
.experience-page-back a:hover,.experience-page-back a:focus-visible{border-color:#ab8541;background:#f8eddb;outline-offset:3px}
.experience-overview-heading{margin-bottom:26px;padding-bottom:22px;border-bottom:1px solid #d9ccb2}
.experience-overview-heading .kicker{color:#8c6934;font-size:11px;line-height:1.7;letter-spacing:.12em}
.experience-overview-heading h1{font-family:Georgia,serif;font-size:clamp(34px,4.2vw,54px);line-height:1.12;font-weight:500;margin:12px 0;color:#103c40;overflow-wrap:anywhere}
.experience-overview-heading p{margin:0;max-width:74ch;color:#4d5b59;font-size:clamp(15px,1.6vw,18px);line-height:1.65}
.experience-summary{display:grid;grid-template-columns:minmax(0,1fr);gap:22px}
.experience-summary-story{min-width:0}
.experience-summary-photo{margin:0;overflow:hidden;border-radius:20px;background:#dae2dc;border:1px solid #e0d1af}
.experience-summary-photo img{display:block;width:100%;aspect-ratio:2/1;max-height:460px;object-fit:cover}
.experience-summary-content{display:grid;grid-template-columns:minmax(280px,.78fr) minmax(0,1.22fr);gap:22px;align-items:start;min-width:0}
.experience-summary-text-only .experience-summary-story{display:none}
.experience-overview .experience-info-panel{padding:clamp(20px,2.6vw,30px);background:#fffdf9;border:1px solid #d8c59d;border-top:4px solid #b89959;border-radius:18px;min-width:0;overflow-wrap:anywhere;box-shadow:0 10px 30px rgba(20,42,43,.04)}
.experience-overview .experience-info-panel .list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px 14px;margin:0;padding:0;list-style:none}
.experience-overview .experience-info-panel .list li{padding:0;font-size:14px;line-height:1.55;border:0;color:#26464a}
.experience-overview .experience-info-panel .list li strong{display:inline-block;margin-bottom:3px;color:#6f613f;font-size:11px;letter-spacing:.055em;text-transform:uppercase}
.experience-overview .text-link{color:#785921}
.experience-booking-note{margin:16px 0 0;font-size:13px;line-height:1.6}
.experience-summary-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #e7ddcc}
.experience-summary-description{padding:clamp(24px,3vw,34px);background:#fff;border:1px solid #e4d9c3;border-radius:18px;min-width:0;overflow-wrap:anywhere;box-shadow:0 10px 30px rgba(20,42,43,.04)}
.experience-detail-title{font-family:Georgia,serif;font-size:clamp(26px,2.8vw,34px);font-weight:500;line-height:1.15;margin:0 0 18px;color:#103c40}
.experience-detail-copy,.experience-selection{font-size:clamp(15px,1.5vw,17px);line-height:1.75;color:#293e40;margin:0;white-space:pre-line}
.experience-selection{margin-top:24px;padding:16px 18px;border-left:3px solid #caa86a;background:#f8f5ed;border-radius:0 10px 10px 0}
.experience-page-surface .experience-summary-actions .button.ghost,.experience-page-surface .experience-summary-actions button[aria-pressed]{background:transparent;border:1px solid #9d9383;color:#123139;box-shadow:none}
.experience-page-surface .experience-summary-actions .button.ghost:hover,.experience-page-surface .experience-summary-actions button[aria-pressed]:hover{background:#f1e8d6}
.experience-page-surface .experience-summary-actions .button[href^="https://www.google.com/maps/dir/"]{background:#caa86a;border-color:#ab874b;color:#123139}
.experience-detail-panel{margin-top:25px;padding:clamp(22px,3vw,34px);border:1px solid #d8c59d;border-radius:18px;background:#fff}
.experience-detail-panel h3{font-family:Georgia,serif;font-size:clamp(24px,2.5vw,30px);line-height:1.15;margin:8px 0 16px}
@media(max-width:860px){.experience-summary-content{grid-template-columns:1fr}.experience-summary-photo img{aspect-ratio:16/10}.experience-overview .experience-info-panel .list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.experience-overview{padding:18px 16px 42px}.experience-overview-heading{margin-bottom:18px;padding-bottom:18px}.experience-overview-heading h1{font-size:clamp(30px,9vw,42px)}.experience-summary{gap:14px}.experience-summary-content{gap:14px}.experience-summary-photo{border-radius:14px}.experience-summary-photo img{aspect-ratio:4/3}.experience-overview .experience-info-panel,.experience-summary-description{padding:20px;border-radius:14px}.experience-overview .experience-info-panel .list{grid-template-columns:1fr 1fr;gap:15px 10px}.experience-detail-copy{line-height:1.65}.experience-page-back{margin-bottom:18px}}
`}</style>
</>;}
