"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import "./operator-notification-bell.css";
type Notice={id:string;kind:"b2b"|"operator";category:string;title:string;description:string;url:string;createdAt:string;read:boolean};
type Payload={notifications:Notice[];unread:number};
const categoryLabels:Record<string,string>={experience:"Esperienze",profile:"Profilo",calendar:"Calendario",collaboration:"Collaborazioni",communication:"Comunicazioni"};
export default function OperatorNotificationBell({operatorId}:{operatorId:string}){
 const [opened,setOpened]=useState(false),[payload,setPayload]=useState<Payload|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState("");
 const root=useRef<HTMLDivElement>(null);
 const load=useCallback(async()=>{
  try{
   const res=await fetch(`/api/operator/notifications?operatorId=${encodeURIComponent(operatorId)}`,{cache:"no-store"});
   if(!res.ok)throw new Error("notification-fetch");
   const result=await res.json() as Payload;
   setPayload(result);setError("");
  }catch{setError("Non è stato possibile caricare le notifiche.");}
 },[operatorId]);
 useEffect(()=>{setOpened(false);setPayload(null);void load();},[load]);
 useEffect(()=>{
  if(!opened)return;
  function close(event:MouseEvent){if(root.current&&!root.current.contains(event.target as Node))setOpened(false);}
  function escape(event:KeyboardEvent){if(event.key==="Escape")setOpened(false);}
  document.addEventListener("mousedown",close);document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",escape);};
 },[opened]);
 async function read(n:Notice){
  setBusy(n.id);
  try{
   const res=await fetch("/api/operator/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operatorId,kind:n.kind,notificationId:n.id,action:"read"})});
   if(!res.ok)throw new Error("notification-update");
   setPayload(p=>p?{...p,notifications:p.notifications.map(item=>item.id===n.id&&item.kind===n.kind?{...item,read:true}:item),unread:Math.max(0,p.unread-(n.read?0:1))}:p);
   setError("");
  }catch{setError("Impossibile segnare la notifica come letta.");}
  finally{setBusy("");}
 }
 const unread=payload?.unread??0;
 return <div className="operator-notice" ref={root}>
  <button type="button" className="operator-notice__trigger" aria-label={unread?`Notifiche: ${unread} da leggere`:"Apri notifiche"} aria-expanded={opened} aria-haspopup="dialog" onClick={()=>{setOpened(v=>!v);if(!opened)void load();}}>
   <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
   {unread>0&&<span className="operator-notice__badge" aria-hidden="true">{unread>99?"99+":unread}</span>}
  </button>
  {opened&&<div className="operator-notice__panel" role="dialog" aria-modal="false" aria-label="Notifiche dell'attività">
   <div className="operator-notice__head"><strong>Notifiche</strong><button type="button" onClick={()=>setOpened(false)} aria-label="Chiudi notifiche">×</button></div>
   <p className="operator-notice__subhead">{unread>0?`${unread} ${unread===1?"novità da leggere":"novità da leggere"}`:"Tutte le novità della tua attività, in un unico posto."}</p>
   {error&&<p role="status" className="operator-notice__error">{error}<button onClick={()=>void load()} type="button">Riprova</button></p>}
   {payload&&payload.notifications.length===0&&<p className="operator-notice__empty">Nessuna novità al momento.</p>}
   <div className="operator-notice__list">
    {payload?.notifications.map(n=><article className={`operator-notice__item${n.read?" is-read":""}`} key={n.kind+":"+n.id}>
     <div className="operator-notice__item-top"><span>{categoryLabels[n.category]??"BIMARIS"}</span>{!n.read&&<span className="operator-notice__unread" aria-label="Da leggere"/>}</div>
     <strong>{n.title}</strong><p>{n.description}</p>
     <div className="operator-notice__item-actions"><Link href={n.url} onClick={()=>setOpened(false)}>Apri sezione</Link>{!n.read&&<button type="button" disabled={busy===n.id} onClick={()=>void read(n)}>{busy===n.id?"Aggiornamento…":"Segna come letta"}</button>}</div>
    </article>)}
   </div>
  </div>}
 </div>;
}
