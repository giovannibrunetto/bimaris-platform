"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Collaboration={experience_id:string;operator_id:string;activity_label:string|null;approval_status:string;experience_name:string;proposing_operator_name:string};

export default function CollaborationInbox({operatorId,items}:{operatorId:string;items:Collaboration[]}){
 const searchParams=useSearchParams();
 const result=searchParams.get("collaboration");
 const focusedInvitation=searchParams.get("invito");
 const message=result==="accepted"?"Collaborazione accettata.":result==="rejected"?"Collaborazione rifiutata.":result==="error"?"Non è stato possibile registrare la risposta.":result==="forbidden"?"Non sei autorizzato a rispondere a questa collaborazione.":result==="invalid"?"Richiesta non valida.":null;
 const isError=result==="error"||result==="forbidden"||result==="invalid";
 useEffect(()=>{
  if(!focusedInvitation&&!result&&!["#collaboration-inbox-title","#collaboration-inbox"].includes(window.location.hash))return;
  const el=(focusedInvitation?document.getElementById("collaboration-invite-"+focusedInvitation):null)
   ??document.getElementById("collaboration-inbox-title")
   ??document.getElementById("collaboration-inbox");
  if(el)requestAnimationFrame(()=>el.scrollIntoView({behavior:"auto",block:"start"}));
 },[result,focusedInvitation]);
 if(items.length===0)return message?<section id="collaboration-inbox" className="collaboration-inbox" aria-label="Esito collaborazione"><div className={`collaboration-inbox__notice collaboration-inbox__notice--${result}`} role={isError?"alert":"status"} aria-live="polite">{message}</div></section>:null;
 return <section id="collaboration-inbox" className="collaboration-inbox" aria-labelledby="collaboration-inbox-title" style={{scrollMarginTop:145}}>
   <div className="collaboration-inbox__head"><div><div className="eyebrow">Collaborazioni</div><h2 id="collaboration-inbox-title" style={{scrollMarginTop:145}}>Collaborazioni da confermare</h2><p>Un altro operatore BIMARIS ti ha indicato come partner di una propria esperienza. Verifica l’attività attribuita alla tua realtà prima di rispondere.</p></div><div style={{display:"grid",gap:8,justifyItems:"end"}}><span className="collaboration-inbox__count" aria-label={`${items.length} collaborazioni da confermare`}>{items.length}</span><a href="/area-operatore/collaborazioni/nuova" style={{fontSize:13}}>Crea collaborazione →</a></div></div>
   {message&&<div className={`collaboration-inbox__notice collaboration-inbox__notice--${result}`} role={isError?"alert":"status"} aria-live="polite">{message}</div>}
   <div className="collaboration-inbox__list">{items.map(item=><article id={`collaboration-invite-${item.experience_id}`} className="collaboration-request" style={{scrollMarginTop:145}} key={`${item.experience_id}-${item.operator_id}`}>
     <div className="collaboration-request__body"><div className="collaboration-request__meta">INVITO DA {item.proposing_operator_name}</div><h3>{item.experience_name}</h3><div className="collaboration-request__activity"><span>La tua attività nell’esperienza</span><strong>{item.activity_label||"Collaborazione all’esperienza"}</strong></div></div>
     <div className="collaboration-request__actions"><form method="post" action="/api/operator/collaborations"><input type="hidden" name="experience_id" value={item.experience_id}/><input type="hidden" name="operator_id" value={operatorId}/><input type="hidden" name="decision" value="rejected"/><button className="button ghost" type="submit" aria-label={`Rifiuta collaborazione per ${item.experience_name}`}>Rifiuta</button></form><form method="post" action="/api/operator/collaborations"><input type="hidden" name="experience_id" value={item.experience_id}/><input type="hidden" name="operator_id" value={operatorId}/><input type="hidden" name="decision" value="accepted"/><button className="button" type="submit" aria-label={`Accetta collaborazione per ${item.experience_name}`}>Accetta collaborazione</button></form></div>
   </article>)}</div>
 </section>;
}
