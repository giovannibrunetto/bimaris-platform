"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type Notice={id:string;name:string;slug:string;score:number;createdAt:string;read:boolean};
type Payload={notifications:Notice[];unread:number;emailEnabled:boolean};
export default function B2BNewMatchAlerts({operatorId,showPreferences=false}:{operatorId:string;showPreferences?:boolean}){
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  setData(null);setError("");
  void fetch(`/api/operator/b2b-notifications?operatorId=${encodeURIComponent(operatorId)}`,{cache:"no-store"})
    .then(async r=>{if(!r.ok)throw new Error("Notifications unavailable");return r.json() as Promise<Payload>})
    .then(p=>{if(!cancelled)setData(p)})
    .catch(()=>{if(!cancelled)setError("Avvisi non disponibili al momento.")});
  return()=>{cancelled=true};
 },[operatorId]);
 async function action(body:Record<string,unknown>){
  setBusy(true);
  try{
   const r=await fetch("/api/operator/b2b-notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operatorId,...body})});
   if(!r.ok)throw new Error("Update failed");
   if(body.action==="preference")setData(p=>p?{...p,emailEnabled:body.emailEnabled===true}:p);
   if(body.action==="read")setData(p=>p?{...p,notifications:p.notifications.map(n=>n.id===body.notificationId?{...n,read:true}:n),unread:Math.max(0,p.unread-1)}:p);
   setError("");
  }catch{setError("Aggiornamento non riuscito. Riprova.")}
  finally{setBusy(false)}
 }
 if(!data&&!error)return null;
 if(!showPreferences&&(!data||data.unread===0))return null;
 return <section className="b2b-alerts" aria-label="Nuove opportunità di collaborazione">
  <div className="b2b-alerts__heading"><strong>{data?.unread?"Nuove opportunità B2B":"Avvisi nuove collaborazioni"}</strong>{data?.unread?<span>{data.unread} da leggere</span>:null}</div>
  {data?.notifications.filter(n=>!n.read).slice(0,5).map(n=><div className="b2b-alerts__notice" key={n.id}><div><strong>{n.name}</strong><p>Nuova compatibilità: {n.score}%</p></div><div className="b2b-alerts__actions"><Link href="/area-operatore/network-b2b">Apri Network B2B</Link><button type="button" disabled={busy} onClick={()=>void action({action:"read",notificationId:n.id})}>Segna come letta</button></div></div>)}
  {showPreferences&&<label className="b2b-alerts__preference"><input type="checkbox" disabled={busy||!data} checked={data?.emailEnabled??false} onChange={e=>void action({action:"preference",emailEnabled:e.target.checked})}/><span>Ricevi anche una email quando nasce una nuova compatibilità</span></label>}
  {error&&<p role="status" className="b2b-alerts__error">{error}</p>}
 </section>
}
