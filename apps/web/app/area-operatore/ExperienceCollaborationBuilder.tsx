"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

type Experience={id:string;name:string;published:boolean;review_status:string};
type OperatorOption={id:string;name:string;category:string|null};

export default function ExperienceCollaborationBuilder({operatorId,experiences,operators,initialPartnerId=""}:{operatorId:string;experiences:Experience[];operators:OperatorOption[];initialPartnerId?:string}){
 const router=useRouter();
 const eligible=experiences.filter(e=>!e.published&&["draft","rejected"].includes(e.review_status));
 const validInitialPartner=operators.some(o=>o.id===initialPartnerId&&o.id!==operatorId)?initialPartnerId:"";
 const [experienceId,setExperienceId]=useState(eligible[0]?.id??"");
 const [partnerId,setPartnerId]=useState(validInitialPartner);
 const [activity,setActivity]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 if(!eligible.length)return <section className="collaboration-builder"><div className="eyebrow">ESPERIENZA CONDIVISA</div><h3>Prima completa l'esperienza</h3><p>La collaborazione viene definita solo dopo aver completato il racconto, i dettagli e le fotografie dell'esperienza. Carica almeno una fotografia, imposta la copertina e salva la bozza; poi torna qui per scegliere l'eventuale partner.</p></section>;
 async function invite(){if(!experienceId||!partnerId||!activity.trim()){setMessage("Seleziona esperienza e partner e indica l'attività svolta dal collaboratore.");return;}setBusy(true);setMessage("");const response=await fetch("/api/operator/collaborations/invite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({experience_id:experienceId,operator_id:operatorId,partner_operator_id:partnerId,activity_label:activity.trim()})});const body=await response.json().catch(()=>({}));setBusy(false);if(!response.ok){setMessage(body.error??"Invito non riuscito.");return;}setMessage("Invito inviato. L'esperienza potrà essere proposta a BIMARIS dopo l'accettazione del partner.");setActivity("");router.refresh();}
 return <section className="collaboration-builder"><div className="eyebrow">ESPERIENZA CONDIVISA</div><h3>Realizzi questa esperienza insieme ad altre realtà?</h3><p>L'esperienza è già completa. Se coinvolge un'altra realtà BIMARIS, seleziona il partner e indica con precisione quale attività svolgerà. Il partner dovrà accettare prima dell'invio a BIMARIS.</p><div className="collaboration-builder__grid"><label>Esperienza<select value={experienceId} onChange={e=>setExperienceId(e.target.value)}>{eligible.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Operatore partner<select value={partnerId} onChange={e=>setPartnerId(e.target.value)}><option value="">Seleziona un operatore</option>{operators.filter(o=>o.id!==operatorId).map(o=><option key={o.id} value={o.id}>{o.name}{o.category?` · ${o.category}`:""}</option>)}</select></label><label className="collaboration-builder__activity">Che cosa farà il partner?<input value={activity} onChange={e=>setActivity(e.target.value)} maxLength={160} placeholder="Es. sessione di yoga al termine del trekking"/></label></div><div className="collaboration-builder__actions"><button className="button" type="button" disabled={busy||!operators.length} onClick={invite}>{busy?"Invio…":"Invita alla collaborazione"}</button>{message&&<span>{message}</span>}</div></section>;
}
