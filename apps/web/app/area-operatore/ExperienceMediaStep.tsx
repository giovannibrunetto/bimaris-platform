"use client";

import {useEffect,useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
import type { ExperienceMediaItem } from "@/lib/experience-media";
import "./experience-cover-preview.css";

type Props={items:ExperienceMediaItem[];coverKey:string|null;optimizing:boolean;experienceName?:string;excerpt?:string;duration?:string;price?:string;categoryName?:string;territoryName?:string;onFiles:(files:File[])=>void;onCover:(key:string)=>void;onMove:(key:string,delta:number)=>void;onRemove:(item:ExperienceMediaItem)=>void;};
type Preview={experienceName:string;excerpt:string;duration:string;price:string;categoryName:string;territoryName:string};
const blank:Preview={experienceName:"",excerpt:"",duration:"",price:"",categoryName:"",territoryName:""};

export default function ExperienceMediaStep({items,coverKey,optimizing,experienceName="",excerpt="",duration="",price="",categoryName="",territoryName="",onFiles,onCover,onMove,onRemove}:Props){
 const cover=items.find(item=>item.key===coverKey)??items[0]??null;
 const [loaded,setLoaded]=useState<Preview>(blank);
 useEffect(()=>{
  if(experienceName||categoryName||territoryName)return;
  let active=true;
  (async()=>{
   const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
   const {data:claims}=await supabase.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)return;
   const {data:members}=await supabase.from("operator_memberships").select("operator_id").eq("user_id",userId);const ids=(members??[]).map(row=>row.operator_id);if(!ids.length)return;
   const {data:e}=await supabase.from("experiences").select("name,excerpt,duration_minutes,price_from,category_id,territory_id,updated_at").in("operator_id",ids).order("updated_at",{ascending:false}).limit(1).maybeSingle();
   if(!e||!active)return;
   const [{data:cat},{data:terr}]=await Promise.all([e.category_id?supabase.from("categories").select("name").eq("id",e.category_id).maybeSingle():Promise.resolve({data:null}),e.territory_id?supabase.from("territories").select("name").eq("id",e.territory_id).maybeSingle():Promise.resolve({data:null})]);
   if(active)setLoaded({experienceName:e.name??"",excerpt:e.excerpt??"",duration:e.duration_minutes==null?"":String(e.duration_minutes),price:e.price_from==null?"":String(e.price_from),categoryName:cat?.name??"",territoryName:terr?.name??""});
  })();
  return()=>{active=false;};
 },[experienceName,categoryName,territoryName]);
 const view:Preview={experienceName:experienceName||loaded.experienceName,excerpt:excerpt||loaded.excerpt,duration:duration||loaded.duration,price:price||loaded.price,categoryName:categoryName||loaded.categoryName,territoryName:territoryName||loaded.territoryName};
 return <div className="experience-step">
  <div className="experience-step__number">04 · Le immagini</div><h3>Prima ancora di leggerla, devono desiderare di viverla.</h3><p className="experience-step__lead">Scegli la fotografia che rappresenterà la tua esperienza e guarda subito l'effetto che avrà su chi la scopre in BIMARIS.</p>
  <p className="experience-step__lead"><strong>Per il successivo invio a BIMARIS è necessario caricare almeno una fotografia e scegliere la foto di copertina.</strong> Completa prima l'esperienza e le immagini; l'eventuale collaborazione con un altro operatore viene definita dopo.</p>
  <div className="experience-cover-section"><div className="experience-cover-section__head"><div><span>Foto di copertina</span><strong>Così apparirà la tua esperienza</strong></div><small>Puoi cambiarla in qualsiasi momento scegliendo una foto dalla galleria.</small></div><div className="experience-cover-card"><div className="experience-cover-card__image">{cover?<img src={cover.url} alt={`Copertina di ${view.experienceName||"esperienza"}`}/>:<span>La foto di copertina apparirà qui</span>}</div><div className="experience-cover-card__copy"><div className="experience-cover-card__meta">{[view.categoryName,view.territoryName].filter(Boolean).join(" · ")||"Esperienza BIMARIS"}</div><h4>{view.experienceName||"La tua esperienza"}</h4>{view.excerpt&&<p>{view.excerpt}</p>}{(view.duration||view.price)&&<strong>{view.duration?`${view.duration} min`:""}{view.duration&&view.price?" · ":""}{view.price?`da € ${view.price}`:""}</strong>}</div></div></div>
  <label className="experience-upload"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={optimizing||items.length>=6} onChange={e=>{const files=Array.from(e.target.files??[]);if(files.length)onFiles(files);e.currentTarget.value="";}}/><strong>{optimizing?"Ottimizzo le fotografie…":"+ Aggiungi fotografie"}</strong><span>JPG, PNG, WebP o AVIF · massimo 6 immagini · fino a 20 MB in origine · ottimizzazione automatica</span></label>
  {items.length>0&&<><div className="experience-gallery-heading"><strong>Galleria dell'esperienza</strong><span>Riordina le immagini o scegline una come nuova copertina.</span></div><div className="experience-thumbs">{items.map((item,index)=>{const selected=cover?.key===item.key;return <div className={`experience-thumb-card${selected?" is-cover":""}`} key={item.key}><div className="experience-thumb-card__photo"><img src={item.url} alt={`Foto ${index+1}`}/>{selected&&<span className="experience-thumb-card__badge">★ Copertina</span>}</div><div className="experience-thumb-card__toolbar"><button type="button" className="experience-thumb-card__cover" disabled={selected} onClick={()=>onCover(item.key)}>{selected?"Foto principale":"Usa come copertina"}</button><div className="experience-thumb-card__tools"><button type="button" disabled={index===0} onClick={()=>onMove(item.key,-1)} aria-label="Sposta foto a sinistra">←</button><button type="button" disabled={index===items.length-1} onClick={()=>onMove(item.key,1)} aria-label="Sposta foto a destra">→</button><button type="button" onClick={()=>onRemove(item)} aria-label="Rimuovi fotografia">×</button></div></div></div>})}</div></>}
 </div>;
}
