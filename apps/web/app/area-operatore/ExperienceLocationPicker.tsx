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
 if(window.google?.maps?.Geocoder){if(!window.google.maps.places&&window.google.maps.importLibrary)await window.google.maps.importLibrary("places");return window.google.maps;}
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 if(!key)throw new Error("Google Maps non è configurato.");
 let script=document.getElementById("bimaris-google-maps") as HTMLScriptElement|null;
 if(!script){
  script=document.createElement("script");
  script.id="bimaris-google-maps";
  script.async=true;
  script.defer=true;
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places`;
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
 if(!window.google.maps.places&&window.google.maps.importLibrary)await window.google.maps.importLibrary("places");
 return window.google.maps;
}

export default function ExperienceLocationPicker({value,onChange}:{value:ExperienceLocation;onChange:(next:ExperienceLocation)=>void}){
 const [query,setQuery]=useState(value.meetingPoint);
 const [results,setResults]=useState<Candidate[]>([]);
 const [busy,setBusy]=useState(false);
 const [suggestions,setSuggestions]=useState<{description:string;placeId:string}[]>([]);
 const requestId=useRef(0);
 const [error,setError]=useState("");
 const [mapOpen,setMapOpen]=useState(false);
 const [mapError,setMapError]=useState("");
 const [pending,setPending]=useState<{latitude:number;longitude:number}|null>(null);
 const mapElement=useRef<HTMLDivElement|null>(null);
 const mapInstance=useRef<any>(null);
 const markerInstance=useRef<any>(null);
 const [mapLoading,setMapLoading]=useState(false);

 // Recover the persisted location when an existing draft is reopened or loaded.
 useEffect(()=>{setQuery(value.meetingPoint);},[value.meetingPoint]);

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
  setResults([]);setMapOpen(false);setMapError("");
 };

 const confirmed=value.latitude!==""&&value.longitude!==""&&Number.isFinite(Number(value.latitude))&&Number.isFinite(Number(value.longitude));
 useEffect(()=>{
  const current=++requestId.current;
  if(query.trim().length<3||confirmed||query.trim()===value.meetingPoint.trim()&&value.latitude!==""&&value.longitude!==""){setSuggestions([]);return;}
  const timer=window.setTimeout(async()=>{
   try{
    const maps=await googleMaps();
    if(!maps.places?.AutocompleteService)throw new Error("Google Places non disponibile: verifica API e restrizioni della chiave.");
    const service=new maps.places.AutocompleteService();
    const predictions=await Promise.race([
     service.getPlacePredictions({input:query.trim(),componentRestrictions:{country:"it"}}),
     new Promise<never>((_,reject)=>window.setTimeout(()=>reject(new Error("Google Places non risponde.")),8000))
    ]);
    if(current!==requestId.current)return;
    setSuggestions((predictions.predictions??[]).slice(0,5).map((p:any)=>({description:p.description,placeId:p.place_id})));
    setError("");
   }catch(e){if(current===requestId.current){setSuggestions([]);setError(e instanceof Error?e.message:"Suggerimenti non disponibili.");}}
  },350);
  return()=>window.clearTimeout(timer);
 },[query,value.latitude,value.longitude,value.meetingPoint,confirmed]);
 const chooseSuggestion=async(item:{description:string;placeId:string})=>{
  setBusy(true);setError("");setSuggestions([]);requestId.current++;
  try{
   const maps=await googleMaps();
   const response=await Promise.race([
    new maps.Geocoder().geocode({placeId:item.placeId}),
    new Promise<never>((_,reject)=>window.setTimeout(()=>reject(new Error("Verifica del luogo scaduta. Riprova.")),8000))
   ]);
   const location=response.results?.[0]?.geometry?.location;
   if(!location)throw new Error("Coordinate del luogo non disponibili.");
   setQuery(item.description);
   onChange({...value,meetingPoint:item.description,googleMapsPlaceId:item.placeId,latitude:String(location.lat()),longitude:String(location.lng())});
  }catch(e){setError(e instanceof Error?e.message:"Impossibile confermare il luogo.");}
  finally{setBusy(false)}
 };
 const changeQuery=(next:string)=>{
  setQuery(next);setResults([]);setSuggestions([]);setError("");
  // Re-entering an unchanged saved address must not invalidate its confirmed coordinates.
  if(next.trim()===value.meetingPoint.trim())return;
  onChange({...value,meetingPoint:next,googleMapsPlaceId:"",latitude:"",longitude:""});
 };
 const verify=async()=>{
  if(!query.trim()){setError("Inserisci un nome o un indirizzo.");return}
  setBusy(true);setError("");setResults([]);
  try{
   const maps=await googleMaps();
   const r=await Promise.race([new maps.Geocoder().geocode({address:query.trim(),region:"IT"}),new Promise<never>((_,reject)=>window.setTimeout(()=>reject(new Error("Ricerca scaduta. Riprova.")),8000))]);
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
  {suggestions.length>0&&<div className="location-results" role="listbox" aria-label="Suggerimenti Google Places">{suggestions.map(item=><button type="button" role="option" aria-selected={false} key={item.placeId} disabled={busy} onClick={()=>void chooseSuggestion(item)}>{item.description}</button>)}</div>}
  {busy&&<p role="status">Conferma del luogo in corso…</p>}
  <div className="location-actions">
   <button type="button" onClick={()=>{setMapOpen(v=>!v);setMapError("");setPending(null)}}>{mapOpen?"Chiudi la mappa":"Seleziona il punto sulla mappa"}</button>
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
  {results.length>0&&<div className="location-results" aria-label="Risultati Google Maps"><p>Conferma il punto corretto:</p>{results.map((item,i)=><button type="button" key={item.placeId||String(i)} onClick={()=>{onChange({...value,meetingPoint:item.address,googleMapsPlaceId:item.placeId,latitude:String(item.latitude),longitude:String(item.longitude)});setQuery(item.address);setResults([])}}>{item.address} — Conferma</button>)}</div>}
  {confirmed&&!mapOpen&&<p className="location-confirmed" role="status">Punto confermato: {value.meetingPoint} ({Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)})</p>}
  <style jsx>{`
   .experience-location-picker{display:grid;gap:12px;padding:18px;border:1px solid #bdad8a;border-radius:14px;background:#f8f5ee;color:#153038;margin:16px 0}
   .experience-location-picker strong{font-size:17px}
   .experience-location-picker p{margin:0;line-height:1.5;font-size:13px}
   .location-choice{display:flex;flex-wrap:wrap;align-items:center;gap:16px}
   .experience-location-picker .location-choice label{display:inline-flex;align-items:center;justify-content:flex-start;gap:8px;flex:0 1 auto;width:auto;max-width:100%;font-size:14px;white-space:normal;cursor:pointer}
   .experience-location-picker .location-choice input[type=radio]{flex:0 0 auto;width:16px;height:16px;margin:0}
   .location-actions{display:flex;flex-wrap:wrap;gap:10px}
   .location-actions button{flex:1 1 210px}
   .manual-location{display:grid;gap:12px}
   .manual-location-map{height:340px;width:100%;border:1px solid #aa9978;border-radius:12px;overflow:hidden}
   @media(max-width:600px){.manual-location-map{height:290px}.location-choice{display:grid;gap:12px}}

   .experience-location-picker>label{display:grid;gap:7px;font-weight:600;font-size:14px}
   .experience-location-picker input[type=text]{width:100%;padding:12px;border:1px solid #afa38a;border-radius:9px;background:#fff;color:#173136}
   .experience-location-picker button{padding:12px 15px;text-align:left;border:1px solid #84704a;border-radius:10px;background:#fff;color:#153038;cursor:pointer}
   .location-results{display:grid;gap:5px}.location-results button{width:100%}
   .location-confirmed{color:#205c3d;font-weight:650}
  `}</style>
 </div>;
}
