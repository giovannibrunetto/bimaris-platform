"use client";
import { FormEvent, useState } from "react";

type Props={operatorId:string;operatorName:string};

export default function CalendarImporter({operatorId,operatorName}:Props){
 const [text,setText]=useState("");
 const [state,setState]=useState<"idle"|"loading"|"ok"|"error">("idle");
 const [message,setMessage]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(text.trim().length<8){setState("error");setMessage("Incolla prima il calendario o il messaggio WhatsApp.");return;}
  setState("loading");setMessage("");
  try{
   const response=await fetch("/api/operator/calendar-import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operator_id:operatorId,raw_text:text,source_type:"whatsapp"})});
   const data=await response.json();
   if(!response.ok)throw new Error(data?.error||"Importazione non riuscita");
   const created=Number(data.parsed_count||0),skipped=Number(data.skipped_count||0);
   const createdText=created===0?"Nessun nuovo appuntamento da creare.":`${created} ${created===1?"nuovo appuntamento rilevato":"nuovi appuntamenti rilevati"} e salvati come bozze.`;
   const skippedText=skipped>0?` ${skipped} ${skipped===1?"duplicato già presente è stato ignorato":"duplicati già presenti sono stati ignorati"}.`:"";
   setState("ok");setMessage(`${createdText}${skippedText} Le nuove bozze passeranno dalla verifica BIMARIS prima della pubblicazione.`);setText("");
  }catch(error){setState("error");setMessage(error instanceof Error?error.message:"Importazione non riuscita");}
 }
 return <section style={{border:"1px solid rgba(202,168,106,.28)",borderRadius:18,background:"#fff",padding:"clamp(20px,3vw,26px)",boxShadow:"0 12px 30px rgba(7,24,35,.045)"}}>
  <div className="eyebrow">Calendario attività</div>
  <h2 style={{fontFamily:"Georgia,serif",fontWeight:500,fontSize:"clamp(26px,3vw,34px)",margin:"6px 0 6px",color:"#0b2638"}}>Incolla il calendario</h2>
  <p style={{maxWidth:700,color:"var(--muted)",lineHeight:1.5,margin:"0 0 14px"}}>Da WhatsApp a BIMARIS: incolla qui il messaggio di {operatorName}. Riconosceremo gli appuntamenti e li prepareremo come bozze da verificare.</p>
  <form onSubmit={submit} style={{display:"grid",gap:11}}>
   <textarea value={text} onChange={e=>setText(e.target.value)} rows={6} maxLength={12000} aria-label={`Calendario di ${operatorName}`} placeholder={"Esempio:\n3 novembre - Trekking Dinnammare - ore 8:30 - €15\n10 novembre - Rocca Novara - ore 8:00 - difficoltà EE"} style={{width:"100%",minHeight:170,resize:"vertical",border:"1px solid rgba(11,38,56,.18)",borderRadius:14,padding:15,font:"inherit",lineHeight:1.5,background:"#fbfaf7",color:"#18242c"}}/>
   <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><button className="button" type="submit" disabled={state==="loading"} style={{border:0,cursor:state==="loading"?"wait":"pointer"}}>{state==="loading"?"Analisi in corso…":"Importa calendario →"}</button><span style={{fontSize:13,color:"#69747b"}}>I duplicati vengono ignorati.</span></div>
   {message&&<div role="status" style={{padding:"13px 15px",borderRadius:12,background:state==="ok"?"#f1f7f2":"#fff2ef",color:state==="ok"?"#2f6841":"#8f2f24",fontSize:14,lineHeight:1.45,fontWeight:state==="ok"?600:500}}>{message}</div>}
  </form>
 </section>;
}
