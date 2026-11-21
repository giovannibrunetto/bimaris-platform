"use client";

import {useEffect,useRef,useState} from "react";

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
 const [searchState,setSearchState]=useState<"idle"|"searching"|"results"|"no-results"|"unavailable">("idle");
 const requestId=useRef(0);
 const [mapOpen,setMapOpen]=useState(false);
 const [mapError,setMapError]=useState("");
 const [pending,setPending]=useState<{latitude:number;longitude:number}|null>(null);
 const mapElement=useRef<HTMLDivElement|null>(null);
 const mapInstance=useRef<any>(null);
 const markerInstance=useRef<any>(null);
 const [mapLoading,setMapLoading]=useState(false);

 // Recover the persisted location when an existing draft is reopened or loaded.
 useEffect(()=>{setQuery(value.meetingPoint);},[value.meetingPoint]);
 // Search only after typing stops. Late Google responses must not overwrite newer suggestions.
 useEffect(()=>{
  const term=query.trim();
  const isConfirmed=term===value.meetingPoint.trim()&&value.latitude!==""&&value.longitude!=="";
  const active=++requestId.current;
  if(term.length<4||isConfirmed){setResults([]);setSearchState("idle");setBusy(false);return;}
  setSearchState("searching");
  const timer=window.setTimeout(async()=>{
   setBusy(true);
   try{
    const maps=await googleMaps();
    const response=await new maps.Geocoder().geocode({address:term,region:"IT"});
    if(requestId.current!==active)return;
    const found:Candidate[]=(response.results??[]).slice(0,5).flatMap((item:any)=>item.geometry?.location?[{address:String(item.formatted_address??term),placeId:String(item.place_id??""),latitude:item.geometry.location.lat(),longitude:item.geometry.location.lng()}]:[]);
    setResults(found);
    setSearchState(found.length?"results":"no-results");
   }catch(err){
    if(requestId.current!==active)return;
    const noResults=err instanceof Error&&/ZERO_RESULTS|zero results/i.test(err.message);
    setResults([]);setSearchState(noResults?"no-results":"unavailable");
   }finally{if(requestId.current===active)setBusy(false);}
  },650);
  return()=>{window.clearTimeout(timer);requestId.current++;};
 },[query,value.meetingPoint,value.latitude,value.longitude]);

 useEffect(()=>{
  if(!mapOpen)return;
  let cancelled=false,listener:any=null;
  setMapLoading(true);setMapError("");
  (async()=>{
   try{
    const maps=await googleMaps();
    if(cancelled||!mapElement.current)return;
    const lat=Number(value.latitude),lng=Number(value.longitude);
    const hasSaved=value.latitude!==""&&value.longitude!==""&&Number.isFinite(lat)&&Number.isFinite(lng);
    const center=hasSaved?{lat,lng}:{lat:38.1938,lng:15.5540};
    const map=new maps.Map(mapElement.current,{center,zoom:hasSaved?16:12,streetViewControl:false,mapTypeControl:false,fullscreenControl:true});
    mapInstance.current=map;
    const marker=new maps.Marker({map,position:hasSaved?center:undefined,draggable:true,title:"Punto da confermare"});
    markerInstance.current=marker;
    if(hasSaved)setPending({latitude:lat,longitude:lng});
    const update=(position:any)=>{const point={latitude:position.lat(),longitude:position.lng()};setPending(point);marker.setPosition(position)};
    listener=map.addListener("click",(event:any)=>{if(event.latLng)update(event.latLng)});
    marker.addListener("dragend",(event:any)=>{if(event.latLng)update(event.latLng)});
   }catch(e){if(!cancelled)setMapError(e instanceof Error?e.message:"Mappa non disponibile.")}
   finally{if(!cancelled)setMapLoading(false)}
  })();
  return()=>{cancelled=true;if(listener)listener.remove();if(markerInstance.current){markerInstance.current.setMap(null);markerInstance.current=null}mapInstance.current=null};
 },[mapOpen]);
 const confirmManual=()=>{
  if(!pending)return setMapError("Tocca la mappa per indicare il punto.");
  const name=query.trim();
  if(!name)return setMapError("Inserisci un nome descrittivo del punto di partenza o svolgimento, anche se Google non lo conosce.");
  onChange({...value,meetingPoint:name,googleMapsPlaceId:"",latitude:String(pending.latitude),longitude:String(pending.longitude)});
  setResults([]);setMapOpen(false);setMapError("");setSearchState("idle");
 };

 const confirmed=value.latitude!==""&&value.longitude!==""&&Number.isFinite(Number(value.latitude))&&Number.isFinite(Number(value.longitude));
 const changeQuery=(next:string)=>{
  setQuery(next);setResults([]);setError("");setSearchState("idle");
  // Re-entering an unchanged saved address must not invalidate its confirmed coordinates.
  if(next.trim()===value.meetingPoint.trim())return;
  onChange({...value,meetingPoint:next,googleMapsPlaceId:"",latitude:"",longitude:""});
 };
 return <div className="experience-location-picker">
  <strong>Punto geografico di riferimento</strong>
  <p>Seleziona il luogo effettivo oppure, per trekking e itinerari, il punto di ritrovo o partenza. È questo il punto usato per valutare gli spostamenti.</p>
  <div className="location-choice" role="radiogroup" aria-label="Tipo di punto geografico">
   <label className="location-choice__option"><input type="radio" name="experience-location-kind" checked={value.locationKind==="venue"} onChange={()=>onChange({...value,locationKind:"venue"})}/><span className="location-choice__copy"><strong>Luogo di svolgimento</strong><small>Il punto in cui si tiene l’esperienza</small></span></label>
   <label className="location-choice__option"><input type="radio" name="experience-location-kind" checked={value.locationKind==="departure"} onChange={()=>onChange({...value,locationKind:"departure"})}/><span className="location-choice__copy"><strong>Punto di ritrovo o partenza</strong><small>Il punto da cui prende avvio l’esperienza</small></span></label>
  </div>
  <label>Nome del luogo o indirizzo
   <input type="text" maxLength={250} value={query} placeholder="Es. Piazza Duomo, Messina oppure Rifugio..." onChange={e=>changeQuery(e.target.value)} autoComplete="off" aria-describedby="location-search-guidance"/>
  </label>
  <p id="location-search-guidance" className="location-guidance">Scrivi almeno 4 caratteri: i suggerimenti Google Maps compariranno automaticamente. Se il luogo non compare, indicalo sulla mappa.</p>
  {searchState==="searching"&&<p className="location-search-state" role="status">Ricerca del luogo su Google Maps…</p>}
  {(searchState==="no-results"||searchState==="unavailable")&&<div className="location-fallback" role="status"><strong>{searchState==="no-results"?"Luogo non trovato su Google Maps.":"Ricerca Google Maps non disponibile."}</strong><p>Puoi comunque scegliere il punto preciso sulla mappa, senza perdere il nome inserito.</p><button type="button" onClick={()=>{setMapOpen(true);setMapError("");setPending(null)}}>Scegli un punto sulla mappa</button></div>}
  <div className="location-actions">
   <button type="button" onClick={()=>{setMapOpen(v=>!v);setMapError("");setPending(null)}}>{mapOpen?"Chiudi la mappa":"Indica il punto sulla mappa"}</button>
  </div>
  {mapOpen&&<div className="manual-location">
   <p>Individua il luogo reale, tocca la mappa e, se necessario, trascina il segnaposto. Per un trekking scegli il punto di partenza o ritrovo, non il centro della località.</p>
   <div ref={mapElement} className="manual-location-map" role="region" aria-label="Mappa per selezionare il punto geografico"/>
   {mapLoading&&<p role="status">Caricamento mappa…</p>}
   {pending&&<p role="status">Punto da confermare: {pending.latitude.toFixed(6)}, {pending.longitude.toFixed(6)}</p>}
   {mapError&&<p role="alert">{mapError}</p>}
   <button type="button" onClick={confirmManual} disabled={!pending||mapLoading}>Conferma questo punto</button>
  </div>}
  {error&&<p role="alert">{error}</p>}
  {results.length>0&&<div className="location-results" aria-label="Suggerimenti Google Maps"><p>Scegli il luogo corretto tra i suggerimenti Google Maps:</p>{results.map((item,i)=><button type="button" key={item.placeId||String(i)} onClick={()=>{requestId.current++;onChange({...value,meetingPoint:item.address,googleMapsPlaceId:item.placeId,latitude:String(item.latitude),longitude:String(item.longitude)});setQuery(item.address);setResults([]);setSearchState("idle");}}>{item.address} — Seleziona</button>)}</div>}
  {confirmed&&!mapOpen&&<p className="location-confirmed" role="status">Punto confermato: {value.meetingPoint} ({Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)})</p>}
  <style jsx>{`
   .experience-location-picker{display:grid;gap:12px;padding:18px;border:1px solid #bdad8a;border-radius:14px;background:#f8f5ee;color:#153038;margin:16px 0}
   .experience-location-picker strong{font-size:17px}
   .experience-location-picker p{margin:0;line-height:1.5;font-size:13px}
   .location-choice{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
   .experience-location-picker .location-choice > .location-choice__option{display:flex;align-items:center;gap:12px;min-width:0;min-height:76px;margin:0;padding:14px;border:1.5px solid #cfc5b4;border-radius:14px;background:#fff;color:#032126;cursor:pointer;transition:border-color .15s ease,background-color .15s ease,box-shadow .15s ease}
   .experience-location-picker .location-choice > .location-choice__option:has(:checked){border-color:#b58d46;background:#f5ecda;box-shadow:inset 0 0 0 1px #b58d46}
   .experience-location-picker .location-choice > .location-choice__option:has(:focus-visible){outline:3px solid #032126;outline-offset:3px}
   .experience-location-picker .location-choice > .location-choice__option > input[type="radio"]{appearance:auto;width:20px!important;height:20px!important;min-height:20px!important;min-width:20px!important;flex:0 0 20px;margin:0!important;padding:0!important;accent-color:#032126}
   .location-choice__copy{display:grid;gap:3px;min-width:0}
   .experience-location-picker .location-choice__copy strong{font-size:14px;line-height:1.25;color:#032126}
   .experience-location-picker .location-choice__copy small{font-size:12px;line-height:1.4;color:#536263}
   @media(hover:hover){.experience-location-picker .location-choice > .location-choice__option:hover{border-color:#b58d46}}
   @media(prefers-reduced-motion:reduce){.experience-location-picker .location-choice > .location-choice__option{transition:none}}
   .location-actions{display:flex;flex-wrap:wrap;gap:10px}
   .location-actions button{flex:1 1 210px}
   .manual-location{display:grid;gap:12px}
   .manual-location-map{height:340px;width:100%;border:1px solid #aa9978;border-radius:12px;overflow:hidden}
   @media(max-width:600px){.manual-location-map{height:290px}.location-choice{grid-template-columns:minmax(0,1fr);gap:10px}.experience-location-picker .location-choice > .location-choice__option{min-height:68px}}

   .experience-location-picker>label{display:grid;gap:7px;font-weight:600;font-size:14px}
   .experience-location-picker input[type=text]{width:100%;padding:12px;border:1px solid #afa38a;border-radius:9px;background:#fff;color:#173136}
   .experience-location-picker button{padding:12px 15px;text-align:left;border:1px solid #84704a;border-radius:10px;background:#fff;color:#153038;cursor:pointer}
   .location-results{display:grid;gap:9px;padding:12px;border:1px solid #d5c5a6;border-radius:12px;background:#fff}
   .location-results button{width:100%;border-color:#d5c5a6;text-align:left}
   .location-results button:hover{background:#f5ecda}
   .location-guidance{color:#475b5c}
   .location-search-state{font-weight:600;color:#385e64}
   .location-fallback{display:grid;gap:8px;padding:12px;border:1px solid #b58d46;border-radius:12px;background:#fff}
   .location-fallback strong{font-size:14px}
   .location-fallback button{justify-self:start}
   .location-confirmed{color:#205c3d;font-weight:650}
  `}</style>
 </div>;
}
