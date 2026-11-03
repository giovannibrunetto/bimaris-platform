import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { qaStories } from "../data";
import "../../../storie-miti-leggende/[slug]/story-detail-mobile.css";

export const metadata: Metadata={title:"QA dettaglio Miti | BIMARIS",robots:{index:false,follow:false}};
export function generateStaticParams(){return qaStories.map(s=>({slug:s.slug}));}

export default async function QaStoryDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const s=qaStories.find(x=>x.slug===slug); if(!s)notFound();
 const framed=s.imageMode==="contain-framed";
 const imageStyle=framed?{width:"calc(100% - 20px)",height:"calc(100% - 20px)",margin:10,borderRadius:8,display:"block",objectFit:"contain" as const,objectPosition:s.imagePosition,boxShadow:"0 4px 18px rgba(0,0,0,.18)"}:{width:"100%",height:"100%",display:"block",objectFit:"cover" as const,objectPosition:"center center"};
 return <>
  <section className="section story-detail-context" style={{paddingTop:36}}>
   <div style={{marginBottom:22}}><div className="kicker">QA · simulazione dettaglio</div><Link className="text-link" href="/qa/miti-11-preview">← Torna alle 11 storie</Link></div>
   <div className="story-detail-hero-grid" style={{display:"grid",gridTemplateColumns:"minmax(280px,.72fr) minmax(0,1.38fr)",gap:30,alignItems:"start",marginBottom:28}}>
    <div className="story-detail-media-column"><figure className="culture-hero-figure story-detail-figure" style={{margin:0,height:286,overflow:"hidden",background:framed?"linear-gradient(135deg,#153f43,#082d31)":"linear-gradient(135deg,#8d7354,#4f3b28)"}}><img src={s.image} alt={`Illustrazione BIMARIS dedicata a ${s.title}`} style={imageStyle}/></figure></div>
    <article className="story-detail-article"><div className="kicker">{s.storyType}</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(34px,4vw,58px)",lineHeight:1.02,margin:"8px 0 16px"}}>{s.title}</h1><p style={{fontSize:19,lineHeight:1.6,color:"#344448",margin:0}}>{s.excerpt}</p></article>
   </div>
   <article style={{maxWidth:820,margin:"34px auto 20px",fontSize:18,lineHeight:1.75}}>{s.body.map((p,i)=><p key={i}>{p}</p>)}</article>
  </section>
 </>;
}
