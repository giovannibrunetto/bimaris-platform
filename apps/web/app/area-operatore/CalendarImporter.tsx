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
   setState("ok");setMessage(`${data.parsed_count} ${data.parsed_count===1?"appuntamento rilevato":"appuntamenti rilevati"}. Sono stati salvati come bozze e passeranno dalla verifica BIMARIS prima della pubblicazione.`);setText("");
  }catch(error){setState("error");setMessage(error instanceof Error?error.message:"Importazione non riuscita");}
 }
 return <section style={{border:"1px solid rgba(202,168,106,.28)",borderRadius:22,background:"#fff",padding:"clamp(20px,4vw,30px)",boxShadow:"0 14px 36px rgba(7,24,35,.05)"}}>
  <div className="eyebrow">Calendario attività</div>
  <h2 style={{fontFamily:"Georgia,serif",fontWeight:500,fontSize:"clamp(28px,4vw,38px)",margin:"7px 0 8px",color:"#0b2638"}}>Da WhatsApp a BIMARIS</h2>
  <p style={{maxWidth:760,color:"var(--muted)",lineHeight:1.6,margin:"0 0 18px"}}>Continua a pubblicare il calendario di {operatorName} come fai oggi. Copia il messaggio da WhatsApp e incollalo qui: BIMARIS individua date e orari, crea gli appuntamenti e li prepara per la verifica.</p>
  <form onSubmit={submit} style={{display:"grid",gap:12}}>
   <textarea value={text} onChange={e=>setText(e.target.value)} rows={8} maxLength={12000} placeholder={"Esempio:\n3 novembre - Trekking Dinnammare - ore 8:30 - €15\n10 novembre - Rocca Novara - ore 8:00 - difficoltà EE"} style={{width:"100%",resize:"vertical",border:"1px solid rgba(11,38,56,.18)",borderRadius:16,padding:16,font:"inherit",lineHeight:1.55,background:"#fbfaf7",color:"#18242c"}}/>
   <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><button className="button" type="submit" disabled={state==="loading"} style={{border:0,cursor:state==="loading"?"wait":"pointer"}}>{state==="loading"?"Analisi in corso…":"Importa calendario →"}</button><span style={{fontSize:13,color:"#69747b"}}>Gli eventi importati non vengono pubblicati automaticamente.</span></div>
   {message&&<div role="status" style={{padding:"12px 14px",borderRadius:12,background:state==="ok"?"#f1f7f2":"#fff2ef",color:state==="ok"?"#2f6841":"#8f2f24",fontSize:14,lineHeight:1.45}}>{message}</div>}
  </form>
 </section>;
}
