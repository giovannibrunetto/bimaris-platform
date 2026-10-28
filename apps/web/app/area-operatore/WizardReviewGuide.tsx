"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createBrowserClient} from "@supabase/ssr";

type ReviewSections={name?:string;excerpt?:string;basics?:string;description?:string;details?:string;media?:string;location?:string};
type Experience={id:string;name:string;excerpt?:string|null;description?:string|null;review_status:string;review_notes:string|null;review_sections:ReviewSections|null};
type Guide={label:string;note:string};
type RevisionFeedback={experience_id:string;status:string;review_notes:string|null;review_sections:ReviewSections|null};

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
 if(step===0&&!guides.length&&experience.review_notes?.trim())guides.push({label:"Indicazione BIMARIS",note:experience.review_notes.trim()});
 return guides;
}

function normalized(value:string|null|undefined){return (value??"").trim().toLocaleLowerCase("it-IT");}
function currentStep(root:Element){const text=root.querySelector(".experience-step__number")?.textContent??"";const match=text.match(/0?([1-6])/);return match?Math.max(0,Number(match[1])-1):0;}
function experienceFromWizard(wizard:Element,experiences:Experience[]){const values=Array.from(wizard.querySelectorAll("input,textarea")).map(node=>normalized((node as HTMLInputElement|HTMLTextAreaElement).value)).filter(Boolean);const exact=experiences.find(e=>values.includes(normalized(e.name))||values.includes(normalized(e.description))||values.includes(normalized(e.excerpt)));return exact??null;}
function cleanNote(note:string|null){return note?.replace(/^Nota generale:\s*/i,"").trim()??"";}

export default function WizardReviewGuide({experiences}:{experiences:Experience[]}){
 const supabase=useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!),[]);
 const activeId=useRef<string|null>(null);
 const [target,setTarget]=useState<Element|null>(null);
 const [listTarget,setListTarget]=useState<Element|null>(null);
 const [experience,setExperience]=useState<Experience|null>(null);
 const [step,setStep]=useState(0);
 const [feedback,setFeedback]=useState<Record<string,RevisionFeedback>>({});

 useEffect(()=>{
  let cancelled=false;
  async function load(){
   const ids=experiences.map(e=>e.id);if(!ids.length){setFeedback({});return;}
   const {data}=await supabase.from("experience_revisions").select("experience_id,status,review_notes,review_sections").in("experience_id",ids).eq("status","rejected");
   if(cancelled)return;
   const next:Record<string,RevisionFeedback>={};for(const row of data??[])next[row.experience_id]=row as RevisionFeedback;setFeedback(next);
  }
  void load();return()=>{cancelled=true};
 },[experiences,supabase]);

 useEffect(()=>{
  function sync(){
   setListTarget(document.querySelector(".experience-list"));
   const wizard=document.querySelector(".experience-wizard");
   const stepNode=wizard?.querySelector(".experience-step")??null;
   if(!wizard||!stepNode){activeId.current=null;setTarget(null);setExperience(null);return;}
   const match=experienceFromWizard(wizard,experiences);
   if(match)activeId.current=match.id;
   const active=experiences.find(e=>e.id===activeId.current)??null;
   const rejected=active&&feedback[active.id];
   setTarget(stepNode);
   setExperience(active&&rejected?{...active,review_status:"rejected",review_notes:cleanNote(rejected.review_notes),review_sections:rejected.review_sections??{}}:active);
   setStep(currentStep(wizard));
  }
  sync();const interval=window.setInterval(sync,350);return()=>window.clearInterval(interval);
 },[experiences,feedback]);

 const rejectedExperiences=experiences.filter(e=>feedback[e.id]);
 const alerts=listTarget&&rejectedExperiences.length?createPortal(<div style={{display:"grid",gap:10,marginBottom:14}}>{rejectedExperiences.map(e=><aside key={e.id} aria-label={`Correzioni richieste per ${e.name}`} style={{padding:"14px 16px",border:"1px solid rgba(153,91,42,.35)",borderRadius:14,background:"rgba(153,91,42,.08)"}}><div className="eyebrow">Correzioni richieste da BIMARIS</div><strong style={{display:"block",marginTop:5}}>{e.name}</strong><p style={{margin:"6px 0 0",whiteSpace:"pre-wrap",lineHeight:1.45}}>{cleanNote(feedback[e.id].review_notes)||"BIMARIS ha richiesto una correzione alla proposta di modifica."}</p><p style={{margin:"8px 0 0",fontSize:14}}>Apri <strong>Proponi modifica</strong> sull’esperienza per correggere e reinviare la stessa proposta.</p></aside>)}</div>,listTarget):null;

 const guides=guidesForStep(experience&&experience.review_status==="rejected"?experience:null,step);
 const guide=target&&guides.length?createPortal(<aside aria-label="Correzioni richieste da BIMARIS" style={{margin:"0 0 14px",padding:"14px 16px",border:"1px solid rgba(153,91,42,.3)",borderRadius:14,background:"rgba(153,91,42,.08)"}}><div className="eyebrow">Correzione richiesta da BIMARIS</div><div style={{display:"grid",gap:10,marginTop:8}}>{guides.map(item=><div key={item.label}><strong>{item.label}</strong><p style={{margin:"4px 0 0",whiteSpace:"pre-wrap",lineHeight:1.45}}>{item.note}</p></div>)}</div></aside>,target):null;
 return <>{alerts}{guide}</>;
}
