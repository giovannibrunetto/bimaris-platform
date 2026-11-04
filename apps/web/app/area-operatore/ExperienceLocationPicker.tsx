"use client";

import {useState} from "react";

declare global {interface Window {google?:any}}

export type ExperienceLocation={
 locationKind:"venue"|"departure";
 meetingPoint:string;
 googleMapsPlaceId:string;
 latitude:string;
 longitude:string;
};
type Candidate={address:string;placeId:string;latitude:number;longitude:number};

async function googleMaps():Promise<any>{
 if(window.google?.maps?.Geocoder)return window.google.maps;
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 if(!key)throw new Error("Google Maps non è configurato.");
 let script=document.getElementById("bimaris-google-maps") as HTMLScriptElement|null;
 if(!script){
  script=document.createElement("script");
  script.id="bimaris-google-maps";
  script.async=true;
  script.defer=true;
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
  document.head.appendChild(script);
 }
 await new Promise<void>((resolve,reject)=>{
  if(window.google?.maps?.Geocoder){resolve();return}
  const timer=window.setTimeout(()=>{clean();reject(new Error("Google Maps non risponde."))},12000);
  const done=()=>{clean();resolve()},failed=()=>{clean();reject(new Error("Google Maps non disponibile."))};
  function clean(){window.clearTimeout(timer);script?.removeEventListener("load",done);script?.removeEventListener("error",failed)}
  script?.addEventListener("load",done,{once:true});
  script?.addEventListener("error",failed,{once:true});
 });
 if(!window.google?.maps?.Geocoder)throw new Error("Ricerca Google Maps non disponibile.");
 return window.google.maps;
}

export default function ExperienceLocationPicker({value,onChange}:{value:ExperienceLocation;onChange:(next:ExperienceLocation)=>void}){
 const [query,setQuery]=useState(value.meetingPoint);
 const [results,setResults]=useState<Candidate[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const confirmed=value.latitude!==""&&value.longitude!==""&&Number.isFinite(Number(value.latitude))&&Number.isFinite(Number(value.longitude));
 const changeQuery=(next:string)=>{setQuery(next);setResults([]);setError("");onChange({...value,meetingPoint:next,googleMapsPlaceId:"",latitude:"",longitude:""})};
 const verify=async()=>{
  if(!query.trim()){setError("Inserisci un nome o un indirizzo.");return}
  setBusy(true);setError("");setResults([]);
  try{
   const maps=await googleMaps();
   const r=await new maps.Geocoder().geocode({address:query.trim(),region:"IT"});
   const found:Candidate[]=(r.results??[]).slice(0,5).flatMap((item:any)=>{
    if(!item.geometry?.location)return[];
    return [{address:String(item.formatted_address??query),placeId:String(item.place_id??""),latitude:item.geometry.location.lat(),longitude:item.geometry.location.lng()}];
   });
   if(!found.length)setError("Nessun punto identificato. Prova con un indirizzo più preciso.");
   setResults(found);
  }catch(err){setError(err instanceof Error?err.message:"Impossibile verificare il luogo.")}
  finally{setBusy(false)}
 };
 return <div className="experience-location-picker">
  <strong>Punto geografico di riferimento</strong>
  <p>Seleziona il luogo effettivo oppure, per trekking e itinerari, il punto di ritrovo o partenza. È questo il punto usato per valutare gli spostamenti.</p>
  <div className="location-choice">
   <label><input type="radio" checked={value.locationKind==="venue"} onChange={()=>onChange({...value,locationKind:"venue"})}/> Luogo di svolgimento</label>
   <label><input type="radio" checked={value.locationKind==="departure"} onChange={()=>onChange({...value,locationKind:"departure"})}/> Punto di ritrovo o partenza</label>
  </div>
  <label>Nome del luogo o indirizzo
   <input type="text" maxLength={250} value={query} placeholder="Es. Piazza Duomo, Messina oppure Rifugio..." onChange={e=>changeQuery(e.target.value)}/>
  </label>
  <button type="button" onClick={verify} disabled={busy}>{busy?"Ricerca in corso…":"Verifica su Google Maps"}</button>
  {error&&<p role="alert">{error}</p>}
  {results.length>0&&<div className="location-results" aria-label="Risultati Google Maps"><p>Conferma il punto corretto:</p>{results.map((item,i)=><button type="button" key={item.placeId||String(i)} onClick={()=>{onChange({...value,meetingPoint:item.address,googleMapsPlaceId:item.placeId,latitude:String(item.latitude),longitude:String(item.longitude)});setQuery(item.address);setResults([])}}>{item.address} — Conferma</button>)}</div>}
  {confirmed&&<p className="location-confirmed" role="status">Punto confermato: {value.meetingPoint} ({Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)})</p>}
  <style jsx>{`
   .experience-location-picker{display:grid;gap:12px;padding:18px;border:1px solid #bdad8a;border-radius:14px;background:#f8f5ee;color:#153038;margin:16px 0}
   .experience-location-picker strong{font-size:17px}
   .experience-location-picker p{margin:0;line-height:1.5;font-size:13px}
   .location-choice{display:flex;flex-wrap:wrap;gap:14px}
   .location-choice label{display:flex;align-items:center;gap:7px;font-size:14px}
   .experience-location-picker>label{display:grid;gap:7px;font-weight:600;font-size:14px}
   .experience-location-picker input[type=text]{width:100%;padding:12px;border:1px solid #afa38a;border-radius:9px;background:#fff;color:#173136}
   .experience-location-picker button{padding:12px 15px;text-align:left;border:1px solid #84704a;border-radius:10px;background:#fff;color:#153038;cursor:pointer}
   .location-results{display:grid;gap:9px}
   .location-confirmed{color:#205c3d;font-weight:650}
  `}</style>
 </div>;
}
