"use client";

import { useState } from "react";
import type { DiscoveryAudience, DiscoveryIntent } from "@/lib/discovery";

const intents: Array<{key:DiscoveryIntent;label:string;hint:string}> = [
 {key:"culture",label:"Cultura",hint:"Monumenti, arte e storia"},
 {key:"food-wine",label:"Sapori",hint:"Degustazioni e territorio"},
 {key:"nature",label:"Natura",hint:"Paesaggi e percorsi"},
 {key:"sea",label:"Mare",hint:"Lo Stretto e la costa"},
 {key:"adventure",label:"Avventura",hint:"Attività ed emozioni"},
 {key:"relax",label:"Relax",hint:"Rallenta e goditi il territorio"},
 {key:"stories-places",label:"Storie e luoghi",hint:"Miti, borghi e identità"},
];
const audiences:Array<{key:DiscoveryAudience;label:string;hint:string}> = [
 {key:"solo",label:"Da solo",hint:"Segui il tuo ritmo"},
 {key:"couple",label:"In coppia",hint:"Qualcosa da vivere in due"},
 {key:"friends",label:"Con amici",hint:"Condividi l'esperienza"},
 {key:"family",label:"In famiglia",hint:"Una proposta adatta a tutti"},
];
const durations = [
 {value:60,label:"1 ora",hint:"Un assaggio di Messina"},
 {value:120,label:"2 ore",hint:"Il tempo per entrare nell'atmosfera"},
 {value:180,label:"3 ore",hint:"Vivi un pezzo di territorio"},
 {value:360,label:"Mezza giornata",hint:"Lasciati portare più lontano"},
];

type Props={initialIntent?:DiscoveryIntent;initialAudience?:DiscoveryAudience;initialMinutes?:number};

export default function DiscoveryWizard({initialIntent,initialAudience,initialMinutes}:Props){
 const [intent,setIntent]=useState<DiscoveryIntent|undefined>(initialIntent);
 const [audience,setAudience]=useState<DiscoveryAudience|undefined>(initialAudience);
 const [minutes,setMinutes]=useState<number|undefined>(initialMinutes);
 const step = !intent ? 1 : !audience ? 2 : !minutes ? 3 : 4;
 const resetFrom=(n:number)=>{if(n<=1){setIntent(undefined);setAudience(undefined);setMinutes(undefined)}else if(n===2){setAudience(undefined);setMinutes(undefined)}else{setMinutes(undefined)}};
 const card=(active=false):React.CSSProperties=>({border:active?"2px solid #e0a246":"1px solid rgba(255,255,255,.22)",background:active?"rgba(224,162,70,.13)":"rgba(255,255,255,.07)",color:"#fff",borderRadius:20,padding:"20px 22px",textAlign:"left",cursor:"pointer",minHeight:92,transition:"transform .18s ease,border-color .18s ease,background .18s ease",boxShadow:"0 14px 36px rgba(0,0,0,.12)"});
 return <form method="get" style={{width:"100%",maxWidth:920,margin:"0 auto"}}>
  {intent&&<input type="hidden" name="intent" value={intent}/>} {audience&&<input type="hidden" name="audience" value={audience}/>} {minutes&&<input type="hidden" name="minutes" value={minutes}/>} 
  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28}}>{[1,2,3].map(n=><span key={n} style={{width:n===step||step===4?34:10,height:6,borderRadius:99,background:n<step||step===4?"#e0a246":"rgba(255,255,255,.22)",transition:"all .25s ease"}}/>)}</div>
  {step===1&&<section style={{textAlign:"center"}}><div style={{color:"#e0a246",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>Prima scelta</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,50px)",color:"#fff",margin:"10px 0 8px"}}>Che cosa vuoi sentire oggi?</h2><p style={{color:"#d7cbbf",margin:"0 auto 28px",maxWidth:560,fontSize:17}}>Non scegliere una categoria. Scegli l'atmosfera in cui vuoi entrare.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>{intents.map(x=><button type="button" key={x.key} onClick={()=>setIntent(x.key)} style={card()}><strong style={{display:"block",fontSize:18}}>{x.label}</strong><span style={{display:"block",marginTop:5,color:"#cfc2b5",fontSize:13}}>{x.hint}</span></button>)}</div></section>}
  {step===2&&<section style={{textAlign:"center"}}><button type="button" onClick={()=>resetFrom(1)} style={{border:0,background:"transparent",color:"#d7cbbf",cursor:"pointer",marginBottom:18}}>← Cambia atmosfera</button><div style={{color:"#e0a246",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>Seconda scelta</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,50px)",color:"#fff",margin:"10px 0 8px"}}>Con chi vuoi viverla?</h2><p style={{color:"#d7cbbf",margin:"0 auto 28px",maxWidth:520,fontSize:17}}>La stessa Messina cambia a seconda di chi hai accanto.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>{audiences.map(x=><button type="button" key={x.key} onClick={()=>setAudience(x.key)} style={card()}><strong style={{display:"block",fontSize:18}}>{x.label}</strong><span style={{display:"block",marginTop:5,color:"#cfc2b5",fontSize:13}}>{x.hint}</span></button>)}</div></section>}
  {step===3&&<section style={{textAlign:"center"}}><button type="button" onClick={()=>resetFrom(2)} style={{border:0,background:"transparent",color:"#d7cbbf",cursor:"pointer",marginBottom:18}}>← Cambia compagnia</button><div style={{color:"#e0a246",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>Ultima scelta</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,50px)",color:"#fff",margin:"10px 0 8px"}}>Quanto tempo vuoi regalarti?</h2><p style={{color:"#d7cbbf",margin:"0 auto 28px",maxWidth:560,fontSize:17}}>Al resto pensa BIMARIS.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>{durations.map(x=><button type="button" key={x.value} onClick={()=>setMinutes(x.value)} style={card()}><strong style={{display:"block",fontSize:18}}>{x.label}</strong><span style={{display:"block",marginTop:5,color:"#cfc2b5",fontSize:13}}>{x.hint}</span></button>)}</div></section>}
  {step===4&&<section style={{textAlign:"center",padding:"18px 0"}}><div style={{color:"#e0a246",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>La tua esperienza prende forma</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(34px,5vw,52px)",color:"#fff",margin:"12px 0"}}>BIMARIS ha capito cosa cerchi.</h2><p style={{color:"#d7cbbf",fontSize:17,margin:"0 auto 28px",maxWidth:570}}>Ora restringiamo Messina a ciò che ha davvero senso per te, oggi.</p><button type="submit" style={{border:0,borderRadius:999,padding:"17px 30px",background:"#e0a246",color:"#211b16",fontWeight:900,fontSize:16,cursor:"pointer",boxShadow:"0 12px 30px rgba(224,162,70,.25)"}}>Scopri cosa vivere →</button><div><button type="button" onClick={()=>resetFrom(3)} style={{border:0,background:"transparent",color:"#bcae9f",cursor:"pointer",marginTop:20}}>← Cambia il tempo</button></div></section>}
 </form>;
}
