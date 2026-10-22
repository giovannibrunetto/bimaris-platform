import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VillageRouteBuilder from "@/components/VillageRouteBuilder";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { UserBehaviorSignal } from "@/components/UserBehaviorSignal";
import { getPublishedVillageBySlug, getPublishedVillagePoints } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const village = await getPublishedVillageBySlug(slug); if (!village) return {}; return { title: `${village.name} | Borghi | BIMARIS`, description: village.excerpt, openGraph: village.imageUrl ? { images: [village.imageUrl] } : undefined }; }

export default async function VillagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const village = await getPublishedVillageBySlug(slug); if (!village) notFound(); const points = await getPublishedVillagePoints(village.id);
  return <>
    <UserBehaviorSignal contentType="village" contentId={village.slug} interestKey="borghi" weight={0.5} />
    <section className={`page-hero village-hero${village.imageUrl ? " has-image" : ""}`} style={village.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(4,15,24,.82) 0%, rgba(4,15,24,.56) 52%, rgba(4,15,24,.24) 100%), url("${village.imageUrl}")` } : undefined}><div className="village-hero-content"><div className="kicker">{village.territory?.name ?? "Borghi"}</div><h1>{village.name}</h1><p>{village.excerpt}</p><SaveToCollectionButton itemType="village" itemId={village.slug} interestKey="borghi" /></div></section>
    <section className="section detail-grid" style={{alignItems:"start"}}><article><div className="kicker">Il borgo</div><h2 style={{fontFamily:"Georgia,serif",fontSize:42,marginTop:8}}>Identità e territorio</h2><p style={{fontSize:18,lineHeight:1.75,color:"#4d5962"}}>{village.description}</p>{village.identity&&<><h3>Perché è unico</h3><p>{village.identity}</p></>}{village.history&&<><h3>Storia</h3><p>{village.history}</p></>}{points.length>0&&<VillageRouteBuilder villageName={village.name} points={points}/>}</article><aside className="detail-panel" style={{alignSelf:"start",height:"auto",minHeight:0}}><div className="kicker">Organizza la visita</div><h3>{village.name}</h3>{village.address&&<p>{village.address}</p>}<p style={{color:"#6e7680",lineHeight:1.55}}>Scegli i luoghi nella sezione “Cosa vedere” per creare il tuo itinerario nel borgo.</p><a className="button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(village.googleMapsQuery)}`} target="_blank" rel="noreferrer">Raggiungi il borgo con Google Maps</a><div style={{borderTop:"1px solid #dfe4e8",marginTop:30,paddingTop:26}}><div className="kicker">Esplora il territorio</div><h3 style={{marginTop:8,marginBottom:10}}>Continua il viaggio da {village.name}</h3><p style={{color:"#6e7680",lineHeight:1.55,marginTop:0}}>Apri la mappa BIMARIS per scoprire e combinare altri luoghi, sapori ed esperienze del territorio.</p><div className="actions" style={{marginTop:20}}><Link className="button" href={`/mappa?borgo=${encodeURIComponent(village.slug)}`}>Esplora sulla mappa BIMARIS</Link><Link className="button ghost" href="/borghi">Tutti i borghi</Link></div></div></aside></section>
  </>;
}
