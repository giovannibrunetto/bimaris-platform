"use client";

import { useEffect, useState } from "react";
import type { DiscoveryAudience, DiscoveryIntent } from "@/lib/discovery";

const GOLD="#d8a94f";
const intents:Array<{key:DiscoveryIntent;label:string;hint:string}>=[
 {key:"culture",label:"Cultura",hint:"Monumenti, arte e storia"},{key:"food-wine",label:"Sapori",hint:"Degustazioni e territorio"},{key:"nature",label:"Natura",hint:"Paesaggi e percorsi"},{key:"sea",label:"Mare",hint:"Lo Stretto e la costa"},{key:"adventure",label:"Avventura",hint:"Attività ed emozioni"},{key:"relax",label:"Relax",hint:"Rallenta e respira"},{key:"stories-places",label:"Storie e luoghi",hint:"Miti, borghi e identità"},
];
const audiences:Array<{key:DiscoveryAudience;label:string;hint:string}>=[{key:"solo",label:"Da solo",hint:"Segui il tuo ritmo"},{key:"couple",label:"In coppia",hint:"Qualcosa da vivere in due"},{key:"friends",label:"Con amici",hint:"Condividi l'esperienza"},{key:"family",label:"In famiglia",hint:"Un momento da vivere insieme"}];
const durations=[{value:60,label:"1 ora",hint:"Un assaggio di Messina"},{value:120,label:"2 ore",hint:"Entra nell'atmosfera"},{value:180,label:"3 ore",hint:"Vivi un pezzo di territorio"},{value:360,label:"Mezza giornata",hint:"Lasciati portare più lontano"}];
type Props={initialIntent?:DiscoveryIntent;initialAudience?:DiscoveryAudience;initialMinutes?:number};

export default function DiscoveryWizard({initialIntent,initialAudience,initialMinutes}:Props){
 const [intent,setIntent]=useState<DiscoveryIntent|undefined>(initialIntent),[audience,setAudience]=useState<DiscoveryAudience|undefined>(initialAudience),[minutes,setMinutes]=useState<number|undefined>(initialMinutes);
 const [shownStep,setShownStep]=useState(!initialIntent?1:!initialAudience?2:!initialMinutes?3:4),[visible,setVisible]=useState(true),[locked,setLocked]=useState(false);
 const realStep=!intent?1:!audience?2:!minutes?3:4;
 useEffect(()=>{if(realStep===shownStep)return;const t=setTimeout(()=>{setShownStep(realStep);requestAnimationFrame(()=>setVisible(true));},520);return()=>clearTimeout(t)},[realStep,shownStep]);
 const choose=(fn:()=>void)=>{if(locked)return;setLocked(true);setVisible(false);setTimeout(()=>{fn();setLocked(false)},520)};
 const resetFrom=(n:number)=>choose(()=>{if(n<=1){setIntent(undefined);setAudience(undefined);setMinutes(undefined)}else if(n===2){setAudience(undefined);setMinutes(undefined)}else setMinutes(undefined)});
 const wrap:React.CSSProperties={width:"100%",opacity:visible?1:0,transform:visible?"translate3d(0,0,0) scale(1)":"translate3d(0,32px,0) scale(.965)",filter:visible?"blur(0px)":"blur(10px)",transition:"opacity .52s ease, transform .78s cubic-bezier(.16,1,.3,1), filter .52s ease"};
 const progress=(n:number)=><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:"clamp(28px,4vh,52px)"}}>{[1,2,3].map(i=><span key={i} style={{width:i===n?54:8,height:4,borderRadius:99,background:i<=n?GOLD:"rgba(244,239,229,.24)",transition:"all .7s cubic-bezier(.16,1,.3,1)"}}/>)}</div>;
 const cards=(items:any[],onClick:(x:any)=>void)=><div style={{display:"grid",gridTemplateColumns:`repeat(${items.length>4?"auto-fit":"4"},minmax(0,1fr))`,gap:"clamp(12px,1.4vw,22px)",width:"min(1180px,100%)",margin:"0 auto"}}>{items.map((x,i)=><button className="discovery-choice" type="button" key={x.key??x.value} onClick={()=>onClick(x)} style={{animationDelay:`${80+i*55}ms`}}><span className="discovery-choice-number">0{i+1}</span><strong>{x.label}</strong><small>{x.hint}</small><span className="discovery-choice-arrow">↗</span></button>)}</div>;
 const scene=(eyebrow:string,title:string,copy:string,content:React.ReactNode,back?:React.ReactNode)=><section style={{textAlign:"center"}}>{back}<div style={{color:GOLD,fontSize:"clamp(11px,.8vw,14px)",fontWeight:800,letterSpacing:".22em",textTransform:"uppercase",marginBottom:16}}>{eyebrow}</div><h2 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:"clamp(48px,6.4vw,96px)",lineHeight:.98,letterSpacing:"-.035em",color:"#f7f2e9",margin:"0 auto 22px",maxWidth:1100}}>{title}</h2><p style={{color:"rgba(247,242,233,.76)",fontSize:"clamp(17px,1.5vw,24px)",lineHeight:1.5,margin:"0 auto clamp(34px,5vh,64px)",maxWidth:720}}>{copy}</p>{content}</section>;
 return <form method="get" style={{width:"100%"}}>
  {intent&&<input type="hidden" name="intent" value={intent}/>} {audience&&<input type="hidden" name="audience" value={audience}/>} {minutes&&<input type="hidden" name="minutes" value={minutes}/>} 
  <div style={wrap}>{progress(Math.min(shownStep,3))}
   {shownStep===1&&scene("01 · Segui l'istinto","Che cosa vuoi sentire oggi?","Non scegliere una categoria. Scegli l'atmosfera in cui vuoi entrare.",cards(intents,x=>choose(()=>setIntent(x.key))))}
   {shownStep===2&&scene("02 · Scegli con chi","Con chi vuoi viverla?","La stessa Messina cambia a seconda di chi hai accanto.",cards(audiences,x=>choose(()=>setAudience(x.key))),<button className="discovery-back" type="button" onClick={()=>resetFrom(1)}>← Torna all'atmosfera</button>)}
   {shownStep===3&&scene("03 · Dai valore al tempo","Quanto tempo vuoi regalarti?","Non riempire il tempo. Scegli quanto spazio vuoi lasciare all'esperienza.",cards(durations,x=>choose(()=>setMinutes(x.value))),<button className="discovery-back" type="button" onClick={()=>resetFrom(2)}>← Torna alla compagnia</button>)}
   {shownStep===4&&scene("La scelta è pronta","Messina, ridotta a ciò che conta per te.","BIMARIS ha incrociato atmosfera, compagnia e tempo. Ora lascia spazio alla scoperta.",<div><button className="discovery-submit" type="submit">Scopri cosa vivere <span>→</span></button><div><button className="discovery-back" type="button" onClick={()=>resetFrom(3)}>← Cambia il tempo</button></div></div>)}
  </div>
  <style jsx>{`
   .discovery-choice{position:relative;min-height:clamp(150px,19vh,220px);padding:28px 28px 26px;border:1px solid rgba(216,169,79,.25);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025));color:#f7f2e9;text-align:left;cursor:pointer;overflow:hidden;backdrop-filter:blur(12px);box-shadow:0 28px 80px rgba(0,0,0,.12);transition:transform .55s cubic-bezier(.16,1,.3,1),background .55s ease,border-color .55s ease,box-shadow .55s ease;animation:choiceIn .75s cubic-bezier(.16,1,.3,1) both}
   .discovery-choice:before{content:"";position:absolute;inset:auto -25% -65% 15%;height:110%;background:radial-gradient(circle,rgba(216,169,79,.16),transparent 67%);opacity:0;transition:opacity .55s ease,transform .75s ease;transform:translateY(18px)}
   .discovery-choice:hover{transform:translateY(-10px) scale(1.018);border-color:rgba(216,169,79,.72);background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(216,169,79,.055));box-shadow:0 34px 90px rgba(0,0,0,.22)}
   .discovery-choice:hover:before{opacity:1;transform:translateY(0)}
   .discovery-choice-number{display:block;color:rgba(216,169,79,.72);font:700 13px/1 Arial,sans-serif;letter-spacing:.15em;margin-bottom:28px}
   .discovery-choice strong{position:relative;display:block;font:400 clamp(25px,2.2vw,38px)/1.05 Georgia,serif;letter-spacing:-.025em;z-index:1}
   .discovery-choice small{position:relative;display:block;color:rgba(247,242,233,.62);font:400 clamp(13px,1vw,16px)/1.4 Arial,sans-serif;margin-top:10px;z-index:1}
   .discovery-choice-arrow{position:absolute;right:24px;bottom:22px;color:${GOLD};font-size:22px;opacity:.55;transition:transform .45s ease,opacity .45s ease}
   .discovery-choice:hover .discovery-choice-arrow{transform:translate(4px,-4px);opacity:1}
   .discovery-back{display:block;margin:0 auto clamp(22px,3vh,38px);border:0;background:transparent;color:rgba(247,242,233,.58);font-size:14px;cursor:pointer;transition:color .3s ease}.discovery-back:hover{color:#f7f2e9}
   .discovery-submit{border:1px solid rgba(216,169,79,.72);border-radius:999px;padding:20px 34px;background:${GOLD};color:#0a292d;font-weight:800;font-size:clamp(16px,1.3vw,20px);cursor:pointer;box-shadow:0 22px 60px rgba(216,169,79,.16);transition:transform .45s cubic-bezier(.16,1,.3,1),box-shadow .45s ease}.discovery-submit:hover{transform:scale(1.045);box-shadow:0 28px 80px rgba(216,169,79,.25)}.discovery-submit span{margin-left:18px}
   @keyframes choiceIn{from{opacity:0;transform:translateY(28px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
   @media(max-width:900px){.discovery-choice{min-height:145px}.discovery-choice strong{font-size:26px}}
   @media(max-width:720px){.discovery-choice{min-height:130px;padding:22px}.discovery-choice-number{margin-bottom:18px}.discovery-choice strong{font-size:24px}}
   @media(max-width:620px){.discovery-choice{min-height:118px}.discovery-choice small{font-size:12px}}
   @media(max-width:560px){.discovery-choice{min-height:126px}.discovery-choice-number{margin-bottom:14px}}
  `}</style>
 </form>;
}
