"use client";

import type { ExperienceMediaItem } from "@/lib/experience-media";

type Props={
 items:ExperienceMediaItem[];
 coverKey:string|null;
 optimizing:boolean;
 onFiles:(files:File[])=>void;
 onCover:(key:string)=>void;
 onMove:(key:string,delta:number)=>void;
 onRemove:(item:ExperienceMediaItem)=>void;
};

export default function ExperienceMediaStep({items,coverKey,optimizing,onFiles,onCover,onMove,onRemove}:Props){
 return <div className="experience-step">
  <div className="experience-step__number">04 · Le immagini</div>
  <h3>Prima ancora di leggerla, devono desiderare di viverla.</h3>
  <p className="experience-step__lead">Gestisci fino a 6 fotografie in un unico ordine. Puoi scegliere la copertina, spostare liberamente immagini già salvate e nuove, oppure rimuoverle prima del salvataggio.</p>
  <label className="experience-upload">
   <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={optimizing||items.length>=6} onChange={e=>{const files=Array.from(e.target.files??[]);if(files.length)onFiles(files);e.currentTarget.value="";}}/>
   <strong>{optimizing?"Ottimizzo le fotografie…":"+ Aggiungi fotografie"}</strong>
   <span>JPG, PNG, WebP o AVIF · massimo 6 immagini · fino a 20 MB in origine · ottimizzazione automatica</span>
  </label>
  {items.length>0&&<div className="experience-thumbs">{items.map((item,index)=>{const selected=coverKey===item.key;return <div className={`experience-thumb-card${selected?" is-cover":""}`} key={item.key}>
   <div className="experience-thumb-card__photo"><img src={item.url} alt={`Foto ${index+1}`}/>{selected&&<span className="experience-thumb-card__badge">★ Copertina</span>}</div>
   <div className="experience-thumb-card__toolbar">
    <button type="button" className="experience-thumb-card__cover" disabled={selected} onClick={()=>onCover(item.key)}>{selected?"Foto principale":"Scegli copertina"}</button>
    <div className="experience-thumb-card__tools"><button type="button" disabled={index===0} onClick={()=>onMove(item.key,-1)} aria-label="Sposta foto a sinistra" title="Sposta a sinistra">←</button><button type="button" disabled={index===items.length-1} onClick={()=>onMove(item.key,1)} aria-label="Sposta foto a destra" title="Sposta a destra">→</button><button type="button" onClick={()=>onRemove(item)} aria-label="Rimuovi fotografia" title="Rimuovi fotografia">×</button></div>
   </div>
  </div>})}</div>}
 </div>;
}
