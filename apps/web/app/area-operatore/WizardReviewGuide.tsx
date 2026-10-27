"use client";

import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";

type ReviewSections={name?:string;excerpt?:string;basics?:string;description?:string;details?:string;media?:string;location?:string};
type Experience={id:string;name:string;excerpt?:string|null;description?:string|null;review_status:string;review_notes:string|null;review_sections:ReviewSections|null};
type Guide={label:string;note:string};

function correctionNote(experience:Experience,label:string,sectionNote:string){
 const note=sectionNote.trim();
 const general=(experience.review_notes??"").trim();
 return note.toLocaleLowerCase("it-IT")===label.toLocaleLowerCase("it-IT")&&general?general:note;
}

function guidesForStep(experience:Experience|null,step:number):Guide[]{
 if(!experience)return [];
 const sections=experience.review_sections??{};
 const guides:Guide[]=[];
 if(step===0&&(sections.name?.trim()||sections.excerpt?.trim()||sections.basics?.trim()))guides.push({label:"Identità",note:correctionNote(experience,"Informazioni principali",sections.name??sections.excerpt??sections.basics??"")});
 if(step===1&&sections.description?.trim())guides.push({label:"Descrizione",note:correctionNote(experience,"Descrizione",sections.description)});
 if(step===2&&sections.details?.trim())guides.push({label:"Durata, prezzo e dettagli",note:correctionNote(experience,"Durata / prezzo / dettagli",sections.details)});
 if(step===2&&sections.location?.trim())guides.push({label:"Luogo e punto di incontro",note:correctionNote(experience,"Luogo / punto di incontro",sections.location)});
 if(step===3&&sections.media?.trim())guides.push({label:"Fotografie",note:correctionNote(experience,"Fotografie / copertina",sections.media)});
 return guides;
}

function normalized(value:string|null|undefined){return (value??"").trim().toLocaleLowerCase("it-IT");}
function currentStep(root:Element){const text=root.querySelector(".experience-step__number")?.textContent??"";const match=text.match(/0?([1-5])/);return match?Math.max(0,Number(match[1])-1):0;}
function experienceFromWizard(wizard:Element,experiences:Experience[]){const values=Array.from(wizard.querySelectorAll("input,textarea")).map(node=>normalized((node as HTMLInputElement|HTMLTextAreaElement).value)).filter(Boolean);const exact=experiences.find(e=>values.includes(normalized(e.name))||values.includes(normalized(e.description))||values.includes(normalized(e.excerpt)));return exact??null;}

export default function WizardReviewGuide({experiences}:{experiences:Experience[]}){
 const rejected=experiences.filter(e=>e.review_status==="rejected");
 const activeId=useRef<string|null>(null);
 const [target,setTarget]=useState<Element|null>(null);
 const [experience,setExperience]=useState<Experience|null>(null);
 const [step,setStep]=useState(0);
 const [collaboration,setCollaboration]=useState<"solo"|"partners"|null>(null);

 useEffect(()=>{
  function sync(){
   const wizard=document.querySelector(".experience-wizard");
   const stepNode=wizard?.querySelector(".experience-step")??null;
   if(!wizard||!stepNode){activeId.current=null;setTarget(null);setExperience(null);setCollaboration(null);return;}
   const match=experienceFromWizard(wizard,experiences);
   if(match)activeId.current=match.id;
   const active=experiences.find(e=>e.id===activeId.current)??null;
   setTarget(stepNode);setExperience(active);setStep(currentStep(wizard));
  }
  sync();
  const interval=window.setInterval(sync,350);
  return()=>window.clearInterval(interval);
 },[experiences]);

 if(!target)return null;
 const guides=guidesForStep(experience&&rejected.some(e=>e.id===experience.id)?experience:null,step);
 const showCollaboration=step===1;
 if(!guides.length&&!showCollaboration)return null;
 return createPortal(<>
   {guides.length>0&&<aside aria-label="Correzioni richieste da BIMARIS" style={{margin:"0 0 14px",padding:"14px 16px",border:"1px solid rgba(153,91,42,.3)",borderRadius:14,background:"rgba(153,91,42,.08)"}}><div className="eyebrow">Correzione richiesta da BIMARIS</div><div style={{display:"grid",gap:10,marginTop:8}}>{guides.map(guide=><div key={guide.label}><strong>{guide.label}</strong><p style={{margin:"4px 0 0",whiteSpace:"pre-wrap",lineHeight:1.45}}>{guide.note}</p></div>)}</div></aside>}
   {showCollaboration&&<aside aria-label="Collaborazione esperienza" className="experience-network-guide" style={{margin:"10px 0 0",padding:"14px 16px",border:"1px solid #d7c3a0",borderRadius:14,background:"#f8f3ea",color:"#2b241c",boxSizing:"border-box",maxWidth:720}}><div className="eyebrow" style={{color:"#986a20"}}>RETE BIMARIS</div><h4 style={{fontFamily:"Georgia,serif",fontSize:"1.08rem",lineHeight:1.25,margin:"5px 0 5px",color:"#2b241c"}}>Questa esperienza è realizzata insieme ad altre realtà?</h4><p style={{margin:"0 0 10px",lineHeight:1.4,color:"#5e5448",fontSize:".88rem"}}>Indica se l’esperienza è interamente tua oppure se coinvolge altri operatori. Un partner dovrà confermare la propria partecipazione prima dell’invio a BIMARIS.</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" className={collaboration==="solo"?"button":"experience-secondary"} style={collaboration==="solo"?{color:"#21180d",background:"#d8ad5d",border:"1px solid #d8ad5d"}:{color:"#342a20",background:"#fff",border:"1px solid #bda989"}} onClick={()=>setCollaboration("solo")}>No, la realizziamo noi</button><button type="button" className={collaboration==="partners"?"button":"experience-secondary"} style={collaboration==="partners"?{color:"#21180d",background:"#d8ad5d",border:"1px solid #d8ad5d"}:{color:"#342a20",background:"#fff",border:"1px solid #bda989"}} onClick={()=>setCollaboration("partners")}>Sì, collaboriamo con altri operatori</button></div>{collaboration==="partners"&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(202,168,106,.35)"}}><p style={{margin:"0 0 9px",color:"#5e5448",lineHeight:1.4}}>La bozza è già stata salvata: puoi collegare uno o più operatori e attribuire a ciascuno la propria attività.</p><a className="button" href="/area-operatore/collaborazioni/nuova">Aggiungi i partner →</a></div>}</aside>}
 </>,target);
}
