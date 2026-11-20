"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createPortal} from "react-dom";
import "./operator-notification-bell.css";
type Notice={id:string;kind:"b2b"|"operator";category:string;title:string;description:string;url:string;createdAt:string;read:boolean};
type Payload={notifications:Notice[];unread:number};
const categoryLabels:Record<string,string>={experience:"Esperienze",profile:"Profilo",calendar:"Calendario",collaboration:"Collaborazioni",communication:"Comunicazioni"};
export default function OperatorNotificationBell({operatorId}:{operatorId:string}){
 const [opened,setOpened]=useState(false),[payload,setPayload]=useState<Payload|null>(null),[loadedOperatorId,setLoadedOperatorId]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState("");
 const router=useRouter();
 const closeButtonRef=useRef<HTMLButtonElement>(null);
 const lastFocusedRef=useRef<HTMLElement|null>(null);
 const lastLoadRef=useRef(0);
 const load=useCallback(async()=>{
  const sequence=++lastLoadRef.current;
  try{
   const res=await fetch(`/api/operator/notifications?operatorId=${encodeURIComponent(operatorId)}`,{cache:"no-store"});
   if(!res.ok)throw new Error("notification-fetch");
   const result=await res.json() as Payload;
   if(sequence!==lastLoadRef.current)return;
   setPayload(result);setLoadedOperatorId(operatorId);setError("");
  }catch{
   if(sequence===lastLoadRef.current)setError("Non è stato possibile caricare le notifiche.");
  }
 },[operatorId]);
 useEffect(()=>{
  setOpened(false);setPayload(null);setLoadedOperatorId("");setError("");setBusy("");
  void load();
  return()=>{lastLoadRef.current++;};
 },[load]);
 useEffect(()=>{
  if(!opened)return;
  lastFocusedRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  closeButtonRef.current?.focus();
  function keys(event:KeyboardEvent){
   if(event.key==="Escape"){setOpened(false);return;}
   if(event.key==="Tab"){
    const panel=document.querySelector<HTMLElement>(".operator-notice__panel");
    if(!panel)return;
    const items=Array.from(panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  }
  document.addEventListener("keydown",keys);
  return()=>{
   document.removeEventListener("keydown",keys);
   document.body.style.overflow=previousOverflow;
   lastFocusedRef.current?.focus();
  };
 },[opened]);
 async function readAll(){
  const sourceGeneration=lastLoadRef.current;
  setBusy("all");
  try{
   const res=await fetch("/api/operator/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operatorId,action:"read-all"})});
   if(!res.ok)throw new Error("notification-update");
   if(sourceGeneration!==lastLoadRef.current)return;
   setPayload(p=>p?{...p,notifications:p.notifications.map(item=>({...item,read:true})),unread:0}:p);
   setError("");
  }catch{
   if(sourceGeneration===lastLoadRef.current){
    setError("Impossibile segnare tutte le notifiche come lette.");
    await load();
   }
  }finally{if(sourceGeneration===lastLoadRef.current)setBusy("");}
 }
 async function openNotice(n:Notice){
  if(busy)return;
  if(!n.read){
   const sourceGeneration=lastLoadRef.current;
   setBusy(n.id);
   try{
    const res=await fetch("/api/operator/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operatorId,kind:n.kind,notificationId:n.id,action:"read"})});
    if(!res.ok)throw new Error("notification-update");
    if(sourceGeneration!==lastLoadRef.current)return;
    setPayload(p=>p?{...p,notifications:p.notifications.map(item=>item.id===n.id&&item.kind===n.kind?{...item,read:true}:item),unread:Math.max(0,p.unread-1)}:p);
   }catch{
    if(sourceGeneration===lastLoadRef.current)setError("Impossibile registrare la lettura. Riprova.");
    return;
   }finally{
    if(sourceGeneration===lastLoadRef.current)setBusy("");
   }
  }
  setOpened(false);
  router.push(n.url);
 }
 const visiblePayload=loadedOperatorId===operatorId?payload:null;
 const unread=visiblePayload?.unread??0;
 return <div className="operator-notice">
  <button type="button" className="operator-notice__trigger" aria-label={unread?`Notifiche: ${unread} da leggere`:"Apri notifiche"} aria-expanded={opened} aria-haspopup="dialog" onClick={()=>{setOpened(v=>!v);if(!opened)void load();}}>
   <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
   {unread>0&&<span className="operator-notice__badge" aria-hidden="true">{unread>99?"99+":unread}</span>}
  </button>
  {opened&&typeof document!=="undefined"&&createPortal(<div className="operator-notice__overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setOpened(false)}}><div className="operator-notice__panel" role="dialog" aria-modal="true" aria-label="Notifiche dell'attività">
   <div className="operator-notice__head"><strong>Notifiche</strong><div className="operator-notice__head-actions">{unread>0&&<button className="operator-notice__read-all" type="button" disabled={busy==="all"} onClick={()=>void readAll()}>{busy==="all"?"Aggiornamento…":"Segna tutte come lette"}</button>}<button ref={closeButtonRef} className="operator-notice__close" type="button" onClick={()=>setOpened(false)} aria-label="Chiudi notifiche">×</button></div></div>
   <p className="operator-notice__subhead">{unread>0?`${unread} ${unread===1?"novità da leggere":"novità da leggere"}`:"Tutte le novità della tua attività, in un unico posto."}</p>
   {error&&<p role="status" className="operator-notice__error">{error}<button onClick={()=>void load()} type="button">Riprova</button></p>}
   {visiblePayload&&visiblePayload.notifications.length===0&&<p className="operator-notice__empty">Nessuna novità al momento.</p>}
   <div className="operator-notice__list">
    {visiblePayload?.notifications.map(n=><article className={`operator-notice__item${n.read?" is-read":""}`} key={n.kind+":"+n.id}>
     <div className="operator-notice__item-top"><span>{categoryLabels[n.category]??"BIMARIS"}</span>{!n.read&&<span className="operator-notice__unread" aria-label="Da leggere"/>}</div>
     <Link className="operator-notice__item-link" href={n.url} onClick={event=>{event.preventDefault();void openNotice(n)}} aria-label={`Apri e segna come letta: ${n.title}`}><strong>{n.title}</strong><span>{n.description}</span></Link>

    </article>)}
   </div>
  </div></div>,document.body)}
 </div>;
}
