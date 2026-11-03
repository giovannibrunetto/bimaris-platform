import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedStories } from "@/data/stories";
import { qaStories } from "./data";
import "../../storie-miti-leggende/stories-mobile.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "QA Miti 7→11 | BIMARIS", robots: { index: false, follow: false } };

const editorialIllustrations: Record<string,string> = {
  "scilla-e-cariddi":"/storie-miti-leggende/scilla-e-cariddi.webp", colapesce:"/storie-miti-leggende/colapesce.webp",
  "fata-morgana-stretto":"/storie-miti-leggende/fata-morgana.png?v=20261030-3", "mata-e-grifone":"/storie-miti-leggende/mata-e-grifone.webp",
  "madonna-della-lettera":"/storie-miti-leggende/madonna-della-lettera.webp", "leggende-madonna-dinnammare":"/storie-miti-leggende/madonna-dinnammare.webp",
  "risa-citta-sommersa-ganzirri":"/storie-miti-leggende/risa-citta-sommersa-ganzirri.webp"
};
function typeLabel(v:string){const n=v.toLowerCase();if(n.includes("naturale"))return"Leggenda naturale";if(n.includes("devozionale")||n.includes("religioso"))return"Tradizione devozionale";if(n.includes("mito"))return"Mito";if(n.includes("popolare"))return"Leggenda popolare";return v;}
function placeLabel(n:number){return n===1?"1 luogo collegato":n>1?`${n} luoghi collegati`:"Racconto dello Stretto";}

export default async function QaMiti11Preview(){
 const existing=await getPublishedStories();
 return <>
  <section className="page-hero discovery-page-hero bimaris-ambient-hero stories-page-hero" style={{minHeight:0}}><h1 style={{marginTop:0,marginBottom:14}}>Storia, miti e leggende</h1><p style={{marginBottom:0}}>Racconti che nascono dal mare, dai quartieri e dalla memoria della città. Leggi la storia e poi raggiungi i luoghi reali cui è legata.</p></section>
  <section className="section discovery-page-first bimaris-ambient-section stories-page-first">
   <div className="section-head"><div><div className="kicker stories-section-kicker">QA · simulazione 7 → 11</div><h2>Le storie dello Stretto</h2></div><p>Preview isolata: le quattro nuove schede non sono pubblicate nel catalogo ordinario.</p></div>
   <div className="cards stories-cards">
    {existing.map(s=>{const img=editorialIllustrations[s.slug]??s.imageUrl;return <Link className="card story-card" href={`/storie-miti-leggende/${s.slug}`} key={s.id}><div className="card-media story-card-media" style={{position:"relative",minHeight:0,height:190,padding:0,overflow:"hidden",background:"linear-gradient(135deg,#8d7354,#4f3b28)"}}>{img&&<img src={img} alt={s.imageAlt??s.title} style={{width:"100%",height:"100%",display:"block",objectFit:"cover"}}/>}<span style={{position:"absolute",top:12,right:12}}>{typeLabel(s.storyType)}</span></div><div className="card-body story-card-body" style={{padding:"18px 20px 20px"}}><div className="eyebrow">{placeLabel(s.places.length)}</div><h3 style={{marginTop:8,marginBottom:8}}>{s.title}</h3><p className="story-card-excerpt" style={{marginBottom:14}}>{s.excerpt}</p><span className="text-link">Leggi la storia →</span></div></Link>})}
    {qaStories.map(s=>{const framed=s.imageMode==="contain-framed";return <Link className="card story-card" href={`/qa/miti-11-preview/${s.slug}`} key={s.slug}><div className="card-media story-card-media" style={{position:"relative",minHeight:0,height:190,padding:0,overflow:"hidden",background:framed?"linear-gradient(135deg,#153f43,#082d31)":"linear-gradient(135deg,#8d7354,#4f3b28)"}}><img src={s.image} alt={`Illustrazione BIMARIS dedicata a ${s.title}`} style={framed?{width:"calc(100% - 20px)",height:"calc(100% - 20px)",margin:10,borderRadius:8,display:"block",objectFit:"contain",objectPosition:s.imagePosition,boxShadow:"0 4px 18px rgba(0,0,0,.18)"}:{width:"100%",height:"100%",display:"block",objectFit:"cover",objectPosition:s.imagePosition}}/><span style={{position:"absolute",top:12,right:12}}>{typeLabel(s.storyType)}</span></div><div className="card-body story-card-body" style={{padding:"18px 20px 20px"}}><div className="eyebrow">Preview QA</div><h3 style={{marginTop:8,marginBottom:8}}>{s.title}</h3><p className="story-card-excerpt" style={{marginBottom:14}}>{s.excerpt}</p><span className="text-link">Leggi la storia →</span></div></Link>})}
   </div>
  </section>
 </>;
}
