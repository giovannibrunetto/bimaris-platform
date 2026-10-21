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

function guidesForStep(experience:Experience,step:number):Guide[]{
 const sections=experience.review_sections??{};
 const guides:Guide[]=[];
 if(step===0&&(sections.name?.trim()||sections.excerpt?.trim()||sections.basics?.trim()))guides.push({label:"Identità",note:correctionNote(experience,"Informazioni principali",sections.name??sections.excerpt??sections.basics??"")});
 if(step===1&&sections.description?.trim())guides.push({label:"Descrizione",note:correctionNote(experience,"Descrizione",sections.description)});
 if(step===2&&sections.details?.trim())guides.push({label:"Durata, prezzo e dettagli",note:correctionNote(experience,"Durata / prezzo / dettagli",sections.details)});
 if(step===2&&sections.location?.trim())guides.push({label:"Luogo e punto di incontro",note:correctionNote(experience,"Luogo / punto di incontro",sections.location)});
 if(step===3&&sections.media?.trim())guides.push({label:"Fotografie",note:correctionNote(experience,"Fotografie / copertina",sections.media)});
 return guides;
}

function correctionStepLabel(experience:Experience){
 const sections=experience.review_sections??{};
 if(sections.name||sections.excerpt||sections.basics)return "Step 1 — Identità";
 if(sections.description)return "Step 2 — Il racconto";
 if(sections.details||sections.location)return "Step 3 — Dettagli";
 if(sections.media)return "Step 4 — Immagini";
 return null;
}

function normalized(value:string|null|undefined){return (value??"").trim().toLocaleLowerCase("it-IT");}

function currentStep(root:Element){
 const text=root.querySelector(".experience-step__number")?.textContent??"";
 const match=text.match(/0?([1-5])/);
 return match?Math.max(0,Number(match[1])-1):0;
}

function experienceFromWizard(wizard:Element,rejected:Experience[]){
 const values=Array.from(wizard.querySelectorAll("input,textarea")).map(node=>normalized((node as HTMLInputElement|HTMLTextAreaElement).value)).filter(Boolean);
 const exact=rejected.find(e=>values.includes(normalized(e.name))||values.includes(normalized(e.description))||values.includes(normalized(e.excerpt)));
 if(exact)return exact;
 return rejected.length===1?rejected[0]:null;
}

function syncCorrectionStepLabels(rejected:Experience[]){
 for(const old of Array.from(document.querySelectorAll("[data-bimaris-correction-step]")))old.remove();
 for(const experience of rejected){
  const stepLabel=correctionStepLabel(experience);
  if(!stepLabel)continue;
  const card=Array.from(document.querySelectorAll(".experience-card")).find(node=>normalized(node.querySelector("h3")?.textContent)===normalized(experience.name));
  if(!card)continue;
  const marker=document.createElement("p");
  marker.setAttribute("data-bimaris-correction-step",experience.id);
  marker.style.margin="4px 0 8px";
  marker.style.fontSize="0.84rem";
  marker.style.color="#7d5b28";
  marker.innerHTML=`<strong>Modifica richiesta · ${stepLabel}</strong>`;
  const note=Array.from(card.querySelectorAll("p")).find(node=>normalized(node.textContent).startsWith("nota bimaris:"));
  if(note)card.insertBefore(marker,note);else card.querySelector("h3")?.insertAdjacentElement("afterend",marker);
 }
}

function blockPrematureSubmission(rejected:Experience[]){
 const names=rejected.map(e=>normalized(e.name));
 for(const button of Array.from(document.querySelectorAll("button"))){
  if(normalized(button.textContent)!=="invia a bimaris")continue;
  let node:HTMLElement|null=button.parentElement;
  let matched=false;
  for(let depth=0;node&&depth<5;depth++,node=node.parentElement){
   const text=normalized(node.textContent);
   if(names.some(name=>name&&text.includes(name))&&text.includes("da correggere")){matched=true;break;}
  }
  if(matched){
   button.disabled=true;
   button.setAttribute("aria-disabled","true");
   button.title="Prima applica e salva le correzioni richieste da BIMARIS.";
  }
 }
}

export default function WizardReviewGuide({experiences}:{experiences:Experience[]}){
 const rejected=experiences.filter(e=>e.review_status==="rejected");
 const activeId=useRef<string|null>(null);
 const [target,setTarget]=useState<Element|null>(null);
 const [experience,setExperience]=useState<Experience|null>(null);
 const [step,setStep]=useState(0);

 useEffect(()=>{
  let syncing=false;
  function sync(){
   if(syncing)return;
   syncing=true;
   blockPrematureSubmission(rejected);
   syncCorrectionStepLabels(rejected);
   const wizard=document.querySelector(".experience-wizard");
   const stepNode=wizard?.querySelector(".experience-step")??null;
   if(!wizard||!stepNode){activeId.current=null;setTarget(null);setExperience(null);syncing=false;return;}
   if(!activeId.current){
    const match=experienceFromWizard(wizard,rejected);
    if(match)activeId.current=match.id;
   }
   const active=rejected.find(e=>e.id===activeId.current)??null;
   setTarget(stepNode);setExperience(active);setStep(currentStep(wizard));
   syncing=false;
  }
  sync();
  const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("input",sync,true);
  return()=>{observer.disconnect();document.removeEventListener("input",sync,true);};
 },[experiences]);

 if(!target||!experience)return null;
 const guides=guidesForStep(experience,step);
 if(!guides.length)return null;
 return createPortal(<aside aria-label="Correzioni richieste da BIMARIS" style={{margin:"0 0 20px",padding:"14px 16px",border:"1px solid rgba(153,91,42,.3)",borderRadius:16,background:"rgba(153,91,42,.08)"}}><div className="eyebrow">Correzione richiesta da BIMARIS</div><div style={{display:"grid",gap:10,marginTop:8}}>{guides.map(guide=><div key={guide.label}><strong>{guide.label}</strong><p style={{margin:"4px 0 0",whiteSpace:"pre-wrap",lineHeight:1.45}}>{guide.note}</p></div>)}</div></aside>,target);
}
