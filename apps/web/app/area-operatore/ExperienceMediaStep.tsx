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
  {items.length>0&&<div className="experience-thumbs">{items.map((item,index)=><div className="experience-thumb" key={item.key}>
   <img src={item.url} alt={`Foto ${index+1}`}/>
   <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:6}}>
    <button type="button" className="experience-secondary" onClick={()=>onCover(item.key)}>{coverKey===item.key?"✓ Copertina":"Copertina"}</button>
    <button type="button" className="experience-secondary" disabled={index===0} onClick={()=>onMove(item.key,-1)} aria-label="Sposta foto a sinistra">←</button>
    <button type="button" className="experience-secondary" disabled={index===items.length-1} onClick={()=>onMove(item.key,1)} aria-label="Sposta foto a destra">→</button>
    <button type="button" className="experience-secondary" onClick={()=>onRemove(item)}>Rimuovi</button>
   </div>
  </div>)}</div>}
 </div>;
}
