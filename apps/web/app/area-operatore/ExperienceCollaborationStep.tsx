"use client";

import {useEffect,useState} from "react";

type OperatorOption={id:string;name:string;category:string|null};
type Collaboration={operatorId:string;operatorName:string;activity:string;status:"pending"|"accepted"};

export default function ExperienceCollaborationStep({operatorId,experienceId,operators,onChange}:{operatorId:string;experienceId:string;operators:OperatorOption[];onChange:(value:Collaboration|null)=>void}){
 const [mode,setMode]=useState<""|"solo"|"partner">("");
 const [partnerId,setPartnerId]=useState("");
 const [activity,setActivity]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const partner=operators.find(o=>o.id===partnerId);
 useEffect(()=>{if(mode==="solo")onChange(null)},[mode,onChange]);
 async function invite(){
  if(!experienceId)return setMessage("Prima di invitare un partner completa e salva i dati dell'esperienza.");
  if(!partnerId||!activity.trim())return setMessage("Seleziona il partner e indica che cosa farà nell'esperienza.");
  setBusy(true);setMessage("");
  const response=await fetch("/api/operator/collaborations/invite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({experience_id:experienceId,operator_id:operatorId,partner_operator_id:partnerId,activity_label:activity.trim()})});
  const body=await response.json().catch(()=>({}));setBusy(false);
  if(!response.ok)return setMessage(body.error??"Invito non riuscito.");
  const value={operatorId:partnerId,operatorName:partner?.name??"Operatore BIMARIS",activity:activity.trim(),status:"pending" as const};
  onChange(value);setMessage("Invito inviato. Il partner dovrà confermare la collaborazione prima dell'invio a BIMARIS.");
 }
 return <div className="experience-step"><div className="experience-step__number">05 · Collaborazione</div><h3>Questa esperienza è realizzata insieme ad altre realtà?</h3><p>Definisci ora chi partecipa all'esperienza: questa informazione comparirà nell'anteprima prima dell'invio a BIMARIS.</p><div className="choice-row"><button type="button" className={`button ${mode==="solo"?"button--primary":"button--ghost"}`} onClick={()=>{setMode("solo");setPartnerId("");setActivity("");setMessage("")}}>No, la realizziamo noi</button><button type="button" className={`button ${mode==="partner"?"button--primary":"button--ghost"}`} onClick={()=>{setMode("partner");setMessage("")}}>Sì, collaboriamo con altri operatori</button></div>{mode==="partner"&&<div style={{display:"grid",gap:14,marginTop:20}}><div className="experience-field"><label>Operatore partner</label><select value={partnerId} onChange={e=>setPartnerId(e.target.value)}><option value="">Seleziona un operatore</option>{operators.filter(o=>o.id!==operatorId).map(o=><option key={o.id} value={o.id}>{o.name}{o.category?` · ${o.category}`:""}</option>)}</select></div><div className="experience-field"><label>Che cosa farà il partner?</label><input value={activity} onChange={e=>setActivity(e.target.value)} maxLength={160} placeholder="Es. preparazione e servizio dell'aperitivo al termine del trekking"/></div><button type="button" className="button button--primary" disabled={busy||!partnerId||!activity.trim()} onClick={invite}>{busy?"Invio…":"Invita alla collaborazione"}</button></div>}{message&&<p style={{marginTop:14}}><strong>{message}</strong></p>}</div>;
}
