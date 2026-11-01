import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VillageRouteBuilder from "@/components/VillageRouteBuilder";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedVillageBySlug, getPublishedVillagePoints, getVillageNarrative } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const massaSlugs = new Set(["massa-san-giorgio", "massa-san-nicola", "massa-santa-lucia", "massa-san-giovanni"]);
const massesContext = {
  title: "Un territorio condiviso, quattro identità",
  paragraphs: [
    "Sulle colline del versante tirrenico di Messina, le Masse invitano a conoscere una parte della città attraverso il suo paesaggio rurale. Massa San Giorgio, Massa San Nicola, Massa Santa Lucia e Massa San Giovanni sono identità locali distinte, unite da relazioni che precedono la forma attuale dei singoli abitati.",
    "Il nome comune richiama un'organizzazione di terreni e possedimenti. È una chiave per comprendere la storia agricola del territorio, non una data di fondazione: la presenza antica del termine non dimostra che ciascuno dei quattro villaggi esistesse già allora. Anche il loro assetto è cambiato nel tempo e non va immaginato come un sistema rimasto sempre identico.",
    "La documentazione medievale e la presenza monastica di Santa Maria di Massa introducono il rapporto fra insediamenti, coltivazioni e organizzazione religiosa. Il ruolo del monastero aiuta a leggere il contesto, ma non permette di attribuirgli con certezza la fondazione di ogni nucleo.",
    "Acqua, terrazzamenti e manufatti del lavoro raccontano un territorio che produceva e abitava le proprie risorse. La sua storia appartiene a quella di Messina: per comprenderla occorre uscire dall'immagine della sola città portuale e riconoscere il contributo delle colline e dei casali.",
    "Le trasformazioni del Novecento hanno avuto effetti diversi. Il terremoto del 1908 e le ricostruzioni hanno modificato parte del patrimonio religioso; in seguito lo spopolamento e l'abbandono di coltivazioni hanno cambiato il rapporto fra abitati e campagna. Le permanenze materiali non sono uguali ovunque: una chiesa ricostruita e una casa rurale conservata raccontano due modi differenti di attraversare il tempo.",
    "Il contesto comune serve a orientarsi, senza appiattire le differenze. Nei quattro racconti, la storia si avvicina a una fontana, a una scala esterna, a un'opera recuperata o alla memoria di una chiesa. È attraverso questi elementi che ogni Massa ritrova la propria voce dentro una geografia condivisa."
  ]
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const village = await getPublishedVillageBySlug(slug); if (!village) return {}; return { title: `${village.name} | Borghi | BIMARIS`, description: village.excerpt, openGraph: village.imageUrl ? { images: [village.imageUrl] } : undefined }; }

export default async function VillagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const village = await getPublishedVillageBySlug(slug);
  if (!village) notFound();
  const points = await getPublishedVillagePoints(village.id);
  const narrative = getVillageNarrative(village.slug);
  const isMassa = massaSlugs.has(village.slug);

  return <>
    <UserBehaviorSignal contentType="village" contentId={village.slug} interestKey="borghi" weight={0.5} />
    <section className={`page-hero village-hero${village.imageUrl ? " has-image" : ""}`} style={{position:"relative",overflow:"hidden"}}>
      {village.imageUrl&&<><img src={village.imageUrl} alt="" aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block"}}/><div aria-hidden="true" style={{position:"absolute",inset:0,background:"linear-gradient(90deg, rgba(4,15,24,.82) 0%, rgba(4,15,24,.56) 52%, rgba(4,15,24,.24) 100%)"}}/></>}
      <div className="village-hero-content" style={{position:"relative",zIndex:1}}><div className="kicker">{village.territory?.name ?? "Borghi"}</div><h1>{village.name}</h1><p>{village.excerpt}</p><SaveToCollectionButton itemType="village" itemId={village.slug} interestKey="borghi" /></div>
    </section>
    <section className="section detail-grid" style={{alignItems:"start"}}>
      <article>
        {isMassa&&<section style={{marginBottom:36,paddingBottom:30,borderBottom:"1px solid #dfe4e8"}}><div className="kicker">Le Masse di Messina</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,2.625rem)",marginTop:8}}>{massesContext.title}</h2>{massesContext.paragraphs.map((p,i)=><p key={i} style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{p}</p>)}</section>}
        {narrative?<section><div className="kicker">Il racconto</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,2.625rem)",marginTop:8}}>{narrative.title}</h2>{narrative.paragraphs.map((p,i)=><p key={i} style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{p}</p>)}</section>:<><div className="kicker">Il borgo</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,2.625rem)",marginTop:8}}>Identità e territorio</h2><p style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{village.description}</p>{village.identity&&<><h3>Perché è unico</h3><p>{village.identity}</p></>}{village.history&&<><h3>Storia</h3><p>{village.history}</p></>}</>}
        {points.length>0&&<VillageRouteBuilder villageName={village.name} points={points}/>} 
      </article>
      <aside className="detail-panel" style={{alignSelf:"start",height:"auto",minHeight:0}}>
        <div className="kicker">Esplora il territorio</div>
        <h3 style={{marginTop:8,marginBottom:10}}>Continua il viaggio da {village.name}</h3>
        <p style={{color:"#6e7680",lineHeight:1.55,marginTop:0}}>Scopri il borgo e continua a esplorare luoghi, sapori ed esperienze del territorio.</p>
        <div className="actions" style={{marginTop:20}}>
          <Link className="button" href={`/mappa?borgo=${encodeURIComponent(village.slug)}`}>Esplora sulla mappa BIMARIS</Link>
          <a className="button ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(village.googleMapsQuery)}`} target="_blank" rel="noreferrer">Raggiungi con Google Maps</a>
          <Link className="text-link" href="/borghi">Scopri gli altri borghi →</Link>
        </div>
      </aside>
    </section>
  </>;
}
