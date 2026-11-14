"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createPortal} from "react-dom";
import {createBrowserClient} from "@supabase/ssr";
import {optimizeExperienceImages} from "@/lib/optimize-experience-image";
import {deleteExperienceMedia,uploadExperienceMedia,uploadRevisionMedia,deleteRevisionMedia} from "@/lib/experience-media-persistence";
import {effectiveCoverKey,existingMediaKey,moveMediaByKey,newMediaKey,safeStorageFilename,type ExperienceMediaItem,type NewExperienceMedia} from "@/lib/experience-media";
import ExperienceMediaStep from "./ExperienceMediaStep";
import ExperienceCollaborationStep,{type ExperienceCollaboration} from "./ExperienceCollaborationStep";
import "./experience-manager.css";
import ExperienceLocationPicker,{type ExperienceLocation} from "./ExperienceLocationPicker";

type Experience={id:string;name:string;excerpt:string|null;description:string|null;duration_minutes:number|null;price_from:number|null;category_id:string|null;territory_id:string|null;locality:string|null;meeting_point:string|null;google_maps_place_id:string|null;latitude:number|null;longitude:number|null;location_kind:"venue"|"departure"|null;published:boolean;review_status:string;review_notes:string|null;draft_step:number};
type BookingRequirement="none"|"recommended"|"required";
type WeatherDependency="none"|"partial"|"required";
type Draft={name:string;excerpt:string;description:string;duration:string;price:string;territoryId:string;locality:string;location:ExperienceLocation;interestKeys:string[];activityKeys:string[];bookingRequirement:BookingRequirement;bookingNoticeDays:string;bookingCutoffTime:string;weatherDependency:WeatherDependency;weatherConstraints:string[]};
type Option={id:string;name:string};type KeyOption={key:string;label:string};

const empty:Draft={name:"",excerpt:"",description:"",duration:"",price:"",territoryId:"",locality:"",location:{locationKind:"venue",meetingPoint:"",googleMapsPlaceId:"",latitude:"",longitude:""},interestKeys:[],activityKeys:[],bookingRequirement:"none",bookingNoticeDays:"0",bookingCutoffTime:"",weatherDependency:"none",weatherConstraints:[]};
// Enable only after the coordinated Staging database migration has passed independent QA.
const REVISION_TAXONOMY_ENABLED=process.env.NEXT_PUBLIC_BIMARIS_REVISION_TAXONOMY_V2==="true";
const weatherOptions=[{key:"rain",label:"Pioggia"},{key:"strong_wind",label:"Vento forte"},{key:"extreme_heat",label:"Caldo intenso"},{key:"rough_sea",label:"Mare mosso"}];
function slugify(v:string){return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)}
function newExperienceSlug(name:string){return `${slugify(name)}-${Date.now().toString(36)}`}
function hasContent(d:Draft){return Boolean(d.name.trim()||d.excerpt.trim()||d.description.trim()||d.duration||d.price||d.territoryId||d.locality.trim()||d.interestKeys.length||d.activityKeys.length)}
function errorMessage(error:unknown,fallback:string){
 if(error&&typeof error==="object"&&"message" in error&&typeof error.message==="string")return error.message;
 return error instanceof Error?error.message:fallback;
}
function isAuthWriteError(error:unknown){
 if(!error||typeof error!=="object")return false;
 const e=error as {code?:string;status?:number;message?:string};
 return e.code==="42501"||e.status===401||/JWT|not authenticated|permission denied|row-level security/i.test(e.message??"");
}
function safeStep(v:number|null|undefined){return Math.max(0,Math.min(5,Number.isFinite(v)?Number(v):0))}
function complete(d:Draft){return Boolean(d.interestKeys.length&&d.activityKeys.length&&d.location.meetingPoint.trim()&&d.location.latitude!==""&&d.location.longitude!==""&&Number.isFinite(Number(d.location.latitude))&&Number.isFinite(Number(d.location.longitude)))}

export default function ExperienceManager({operatorId,experiences,interests,activities,territories,initialExperienceId,initialStep,initialRevisionExperienceId,standaloneEditor=false}:{operatorId:string;experiences:Experience[];interests:KeyOption[];activities:KeyOption[];territories:Option[];initialExperienceId?:string;initialStep?:number;initialRevisionExperienceId?:string;standaloneEditor?:boolean}){
 const router=useRouter();
 const wizardRef=useRef<HTMLDivElement|null>(null);
 const sectionRef=useRef<HTMLElement|null>(null);
 const taxonomyBaseRef=useRef<{interestKeys:string[];activityKeys:string[]}>({interestKeys:[],activityKeys:[]});
 const openedDeepLinkRef=useRef<string|null>(null);
 const [wizardScrollRequest,setWizardScrollRequest]=useState(0);
 const [showAllExperiences,setShowAllExperiences]=useState(false);
 const [submissionNotice,setSubmissionNotice]=useState("");
 const [open,setOpen]=useState(false),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [openingRevisionId,setOpeningRevisionId]=useState<string|null>(null);
 const [revisionStates,setRevisionStates]=useState<Record<string,"draft"|"pending"|"rejected"|"approved">>({});
 const [revisionStatesLoaded,setRevisionStatesLoaded]=useState(false);
 const [draft,setDraft]=useState<Draft>(empty),[media,setMedia]=useState<ExperienceMediaItem[]>([]),[removedPaths,setRemovedPaths]=useState<string[]>([]),[editingId,setEditingId]=useState<string|null>(null),[revisionId,setRevisionId]=useState<string|null>(null),[revisionRows,setRevisionRows]=useState<Record<string,{id:string;sourceMediaId:string|null}>>({}),[saved,setSaved]=useState(true),[optimizing,setOptimizing]=useState(false),[coverKey,setCoverKey]=useState<string|null>(null);
 const [collaboration,setCollaboration]=useState<ExperienceCollaboration|null>(null),[collaborationReady,setCollaborationReady]=useState(false);
 const supabase=useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!),[]),localKey=`bimaris:experience-draft:${operatorId}`;
 useEffect(()=>{
  if(!open||wizardScrollRequest===0)return;
  // Scroll after React has rendered the new step. A smooth scroll can be
  // interrupted by changing step heights and leave the heading off screen.
  let nextFrame=0;
  const frame=window.requestAnimationFrame(()=>{
   nextFrame=window.requestAnimationFrame(()=>{
    const target=initialExperienceId&&initialStep===5&&step===5?document.getElementById("collaboration-action")??wizardRef.current:wizardRef.current;
    if(!target)return;
    const screen=target.closest<HTMLElement>(".experience-edit-screen");
    if(screen){screen.scrollTo({top:0,behavior:"instant"});return;}
    const header=document.querySelector("body > header, header");
    const headerRect=header?.getBoundingClientRect();
    const fixedHeaderOffset=headerRect&&headerRect.top<=1&&headerRect.bottom>0
     ?Math.min(headerRect.bottom,140):76;
    const position=Math.max(0,window.scrollY+target.getBoundingClientRect().top-fixedHeaderOffset-16);
    window.scrollTo({top:position,behavior:"instant" as ScrollBehavior});
   });
  });
  return()=>{window.cancelAnimationFrame(frame);window.cancelAnimationFrame(nextFrame);};
 },[open,wizardScrollRequest,initialExperienceId,initialStep,step]);
 // Keep the active wizard step in view after forward/back navigation.
 function navigateStep(delta:number){
  setStep(current=>Math.max(0,Math.min(5,current+delta)));
  setWizardScrollRequest(request=>request+1);
 }
 useEffect(()=>{
  if(!submissionNotice||open)return;
  // After the wizard collapses, restore the viewport to the visible confirmation.
  // The former scroll position may otherwise end up near the page footer.
  const frame=window.requestAnimationFrame(()=>{
   const target=sectionRef.current;
   if(!target)return;
   const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-120);
   window.scrollTo({top,behavior:"instant"});
  });
  return()=>window.cancelAnimationFrame(frame);
 },[submissionNotice,open]);
 useEffect(()=>{
  let active=true;
  void (async()=>{
   const {data,error}=await supabase.from("experience_revisions")
    .select("experience_id,status").eq("operator_id",operatorId)
    .in("status",["draft","pending","rejected","approved"]);
   if(!active)return;
   if(error){setMessage("Impossibile verificare lo stato delle modifiche delle esperienze. Riprova il caricamento.");return;}
   const next:Record<string,"draft"|"pending"|"rejected"|"approved">={};
   for(const revision of data??[]){
    if(revision.status==="draft"||revision.status==="pending"||revision.status==="rejected"||revision.status==="approved")next[revision.experience_id]=revision.status;
   }
   setRevisionStates(next);setRevisionStatesLoaded(true);
  })();
  return()=>{active=false};
 },[operatorId,supabase]);
 useEffect(()=>{
  if(open||!message)return;
  const frame=window.requestAnimationFrame(()=>{
   const alert=sectionRef.current?.querySelector<HTMLElement>('[role="alert"]');
   if(!alert)return;
   const top=Math.max(0,window.scrollY+alert.getBoundingClientRect().top-130);
   window.scrollTo({top,behavior:"instant"});
  });
  return()=>window.cancelAnimationFrame(frame);
 },[open,message]);
 useEffect(()=>{
  if(!open)return;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  return()=>{document.body.style.overflow=oldOverflow};
 },[open]);
 const onCollaborationChange=useCallback((value:ExperienceCollaboration|null)=>setCollaboration(value),[]);
 const onCollaborationReady=useCallback((ready:boolean)=>setCollaborationReady(ready),[]);

 useEffect(()=>{try{const raw=localStorage.getItem(localKey);if(!raw)return;const p=JSON.parse(raw),recovered={...empty,...p.draft,location:{...empty.location,...p.draft?.location},interestKeys:Array.isArray(p.draft?.interestKeys)?p.draft.interestKeys:[],activityKeys:Array.isArray(p.draft?.activityKeys)?p.draft.activityKeys:[],weatherConstraints:Array.isArray(p.draft?.weatherConstraints)?p.draft.weatherConstraints:[]};if(hasContent(recovered)){setDraft(recovered);setStep(safeStep(p.step));setEditingId(p.editingId??null);setSaved(false)}}catch{}},[localKey]);
 useEffect(()=>{if(!hasContent(draft)||saved||revisionId)return;const t=window.setTimeout(()=>{try{localStorage.setItem(localKey,JSON.stringify({draft,step,editingId,updatedAt:new Date().toISOString()}))}catch{}},450);return()=>window.clearTimeout(t)},[draft,step,editingId,saved,localKey,revisionId]);
 function clearLocal(){try{localStorage.removeItem(localKey)}catch{}}
 function change(k:keyof Draft,v:string){setDraft(d=>({...d,[k]:v}));setSaved(false)}
 function toggleInterest(k:string){setDraft(d=>{const has=d.interestKeys.includes(k);if(!has&&d.interestKeys.length>=3){setMessage("Puoi scegliere al massimo 3 interessi.");return d}return {...d,interestKeys:has?d.interestKeys.filter(x=>x!==k):[...d.interestKeys,k]}});setSaved(false)}
 function toggleActivity(k:string){setDraft(d=>({...d,activityKeys:d.activityKeys.includes(k)?d.activityKeys.filter(x=>x!==k):[...d.activityKeys,k]}));setSaved(false)}
 function setBookingRequirement(v:BookingRequirement){setDraft(d=>({...d,bookingRequirement:v,...(v==="none"?{bookingNoticeDays:"0",bookingCutoffTime:""}:{})}));setSaved(false)}
 function setNoticeDays(v:string){const n=Math.max(0,Number(v)||0);setDraft(d=>({...d,bookingNoticeDays:String(n),bookingCutoffTime:n?d.bookingCutoffTime:""}));setSaved(false)}
 function setWeatherDependency(v:WeatherDependency){setDraft(d=>({...d,weatherDependency:v,weatherConstraints:v==="none"?[]:d.weatherConstraints}));setSaved(false)}
 function toggleWeather(k:string){setDraft(d=>({...d,weatherConstraints:d.weatherConstraints.includes(k)?d.weatherConstraints.filter(x=>x!==k):[...d.weatherConstraints,k]}));setSaved(false)}
 function releaseNewMedia(){for(const i of media)if(i.kind==="new")URL.revokeObjectURL(i.url)}
 function resetMedia(){releaseNewMedia();setMedia([]);setRemovedPaths([]);setCoverKey(null);setRevisionRows({})}
 function resetCollaboration(){setCollaboration(null);setCollaborationReady(false)}
 function start(){setSubmissionNotice("");setDraft(empty);resetMedia();resetCollaboration();setEditingId(null);setRevisionId(null);setStep(0);setMessage("");setSaved(true);setOpen(true);setWizardScrollRequest(n=>n+1);clearLocal()}

 async function loadTaxonomy(id:string){const [{data:i,error:interestError},{data:a,error:activityError}]=await Promise.all([supabase.from("experience_discovery_intents").select("intent_key").eq("experience_id",id),supabase.from("experience_activity_links").select("activity_key").eq("experience_id",id).eq("operator_id",operatorId)]);if(interestError||activityError)throw new Error("Impossibile leggere interessi e attività della scheda originale. Nessuna scelta è stata cancellata: riprova il caricamento.");taxonomyBaseRef.current={interestKeys:(i??[]).map(x=>x.intent_key),activityKeys:(a??[]).map(x=>x.activity_key)};setDraft(d=>({...d,...taxonomyBaseRef.current}))}
 async function loadProfile(id:string){const {data,error}=await supabase.from("experience_discovery_profiles").select("booking_requirement,booking_notice_hours,booking_cutoff_day_offset,booking_cutoff_time,weather_dependency,weather_constraints").eq("experience_id",id).maybeSingle();if(error)throw new Error("Impossibile leggere le condizioni di prenotazione e meteo dell’esperienza originale: "+error.message);if(data)setDraft(d=>({...d,bookingRequirement:(data.booking_requirement??"none") as BookingRequirement,bookingNoticeDays:String(data.booking_cutoff_day_offset??Math.ceil((data.booking_notice_hours??0)/24)),bookingCutoffTime:data.booking_cutoff_time?String(data.booking_cutoff_time).slice(0,5):"",weatherDependency:(data.weather_dependency??"none") as WeatherDependency,weatherConstraints:Array.isArray(data.weather_constraints)?data.weather_constraints:[]}))}
 async function loadMedia(id:string){const {data}=await supabase.from("experience_media").select("id,storage_path,is_cover").eq("experience_id",id).order("sort_order");const items:ExperienceMediaItem[]=(data??[]).map(x=>({kind:"existing",key:existingMediaKey(x.id),id:x.id,storagePath:x.storage_path,url:supabase.storage.from("experience-media").getPublicUrl(x.storage_path).data.publicUrl}));setMedia(items);const c=(data??[]).find(x=>x.is_cover)??data?.[0];setCoverKey(c?existingMediaKey(c.id):null)}
 async function loadRevisionMedia(id:string){const {data,error}=await supabase.from("experience_revision_media").select("id,source_media_id,storage_path,is_cover").eq("revision_id",id).order("sort_order");if(error)throw new Error("Impossibile caricare le fotografie della revisione: "+error.message);const rows:Record<string,{id:string;sourceMediaId:string|null}>={},items:ExperienceMediaItem[]=[];for(const x of data??[]){const key=existingMediaKey(x.id);rows[key]={id:x.id,sourceMediaId:x.source_media_id};let url="";if(x.source_media_id){url=supabase.storage.from("experience-media").getPublicUrl(x.storage_path).data.publicUrl}else{const signed=await supabase.storage.from("experience-revision-media").createSignedUrl(x.storage_path,300);if(signed.error||!signed.data?.signedUrl)throw new Error("Impossibile autorizzare una fotografia privata della revisione.");url=signed.data.signedUrl}items.push({kind:"existing",key,id:x.id,storagePath:x.storage_path,url})}setRevisionRows(rows);setMedia(items);const loadedKeys=new Set(items.map(i=>i.key));const c=(data??[]).find(x=>x.is_cover&&loadedKeys.has(existingMediaKey(x.id)))??(data??[]).find(x=>loadedKeys.has(existingMediaKey(x.id)));setCoverKey(c?existingMediaKey(c.id):null)}
 async function loadCollaboration(id:string){const {data,error}=await supabase.from("experience_operators").select("operator_id,activity_label,approval_status,operators:operators!experience_operators_operator_id_fkey(name)").eq("experience_id",id).eq("role","participant").limit(1).maybeSingle();if(error)throw new Error("Impossibile verificare la collaborazione esistente. Nessuna associazione è stata modificata.");if(!data){resetCollaboration();return}const related=data.operators as {name?:string}|{name?:string}[]|null;const name=Array.isArray(related)?related[0]?.name:related?.name;const status:ExperienceCollaboration["status"]=data.approval_status==="accepted"?"accepted":data.approval_status==="rejected"?"rejected":"pending";setCollaboration({operatorId:data.operator_id,operatorName:name??"Operatore BIMARIS",activity:data.activity_label??"",status});setCollaborationReady(status==="accepted")}
 async function edit(e:Experience,requestedStep?:number){
  setSubmissionNotice("");
  setBusy(true);setMessage("");
  try{
   // Always retrieve the current persisted draft. Do not rely on potentially stale
   // server-rendered list props or independently racing setDraft updates.
   const [experienceResult,intentResult,activityResult,profileResult]=await Promise.all([
    supabase.from("experiences").select("id,name,excerpt,description,duration_minutes,price_from,territory_id,locality,meeting_point,google_maps_place_id,latitude,longitude,location_kind,draft_step").eq("id",e.id).eq("operator_id",operatorId).single(),
    supabase.from("experience_discovery_intents").select("intent_key").eq("experience_id",e.id),
    supabase.from("experience_activity_links").select("activity_key").eq("experience_id",e.id).eq("operator_id",operatorId),
    supabase.from("experience_discovery_profiles").select("booking_requirement,booking_notice_hours,booking_cutoff_day_offset,booking_cutoff_time,weather_dependency,weather_constraints").eq("experience_id",e.id).maybeSingle()
   ]);
   if(experienceResult.error||!experienceResult.data)throw experienceResult.error??new Error("Bozza non trovata");
   if(intentResult.error||activityResult.error||profileResult.error)throw intentResult.error??activityResult.error??profileResult.error;
   const savedExperience=experienceResult.data,profile=profileResult.data;
   const restored:Draft={
    ...empty,
    name:savedExperience.name??"",
    excerpt:savedExperience.excerpt??"",
    description:savedExperience.description??"",
    duration:savedExperience.duration_minutes==null?"":String(savedExperience.duration_minutes),
    price:savedExperience.price_from==null?"":String(savedExperience.price_from),
    territoryId:savedExperience.territory_id??"",
    locality:savedExperience.locality??"",
    location:{locationKind:savedExperience.location_kind==="departure"?"departure":"venue",meetingPoint:savedExperience.meeting_point??"",googleMapsPlaceId:savedExperience.google_maps_place_id??"",latitude:savedExperience.latitude==null?"":String(savedExperience.latitude),longitude:savedExperience.longitude==null?"":String(savedExperience.longitude)},
    interestKeys:(intentResult.data??[]).map(item=>item.intent_key),
    activityKeys:(activityResult.data??[]).map(item=>item.activity_key),
    bookingRequirement:(profile?.booking_requirement??"none") as BookingRequirement,
    bookingNoticeDays:String(profile?.booking_cutoff_day_offset??Math.ceil((profile?.booking_notice_hours??0)/24)),
    bookingCutoffTime:profile?.booking_cutoff_time?String(profile.booking_cutoff_time).slice(0,5):"",
    weatherDependency:(profile?.weather_dependency??"none") as WeatherDependency,
    weatherConstraints:Array.isArray(profile?.weather_constraints)?profile.weather_constraints:[]
   };
   setDraft(restored);
   resetMedia();resetCollaboration();
   setEditingId(e.id);setRevisionId(null);setStep(requestedStep===undefined?safeStep(savedExperience.draft_step):safeStep(requestedStep));setSaved(true);
   clearLocal();
   setOpen(true);setWizardScrollRequest(n=>n+1);
   await Promise.all([loadMedia(e.id),loadCollaboration(e.id)]);
  }catch(error){
   setMessage("Impossibile ripristinare tutti i dettagli della bozza. "+errorMessage(error,"Riprova."));
  }finally{setBusy(false)}
 }
 useEffect(()=>{
  if(!initialExperienceId)return;
  if(openedDeepLinkRef.current===initialExperienceId)return;
  openedDeepLinkRef.current=initialExperienceId;
  const target=experiences.find(e=>e.id===initialExperienceId);
  if(target&&["draft","rejected"].includes(target.review_status)){
   void edit(target,initialStep);
  }else{
   setMessage("La bozza richiesta non è disponibile per questo operatore.");
   const el=document.getElementById("operator-experiences");
   el?.scrollIntoView({behavior:"auto",block:"start"});
  }
  // Run once per requested deep link; callbacks are intentionally not reactive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[initialExperienceId]);
 async function proposeRevision(e:Experience){setSubmissionNotice("");setBusy(true);setOpeningRevisionId(e.id);setMessage("");try{const {data:existing,error:existingError}=await supabase.from("experience_revisions").select("id,status,draft_step,content").eq("experience_id",e.id).eq("operator_id",operatorId).in("status",["draft","pending","rejected","approved"]).maybeSingle();if(existingError)throw new Error("Impossibile verificare le proposte esistenti: "+existingError.message);if(existing&&(existing.status==="pending"||existing.status==="approved")){setRevisionStates(current=>({...current,[e.id]:existing.status as "pending"|"approved"}));setMessage(existing.status==="pending"?"Questa esperienza ha già una proposta in valutazione. Attendi la decisione amministrativa prima di proporre altre modifiche.":"La proposta è già approvata e attende la conclusione dell’applicazione. Non è possibile crearne un’altra.");return}let revision=existing;if(!revision){const created=await supabase.from("experience_revisions").insert({experience_id:e.id,operator_id:operatorId,status:"draft",draft_step:0,content:{name:e.name,excerpt:e.excerpt,description:e.description,duration_minutes:e.duration_minutes,price_from:e.price_from,territory_id:e.territory_id,locality:e.locality,meeting_point:e.meeting_point,google_maps_place_id:e.google_maps_place_id,latitude:e.latitude,longitude:e.longitude,location_kind:e.location_kind},media:[]}).select("id,status,draft_step,content").single();if(created.error||!created.data){setMessage(created.error?.message??"Creazione proposta non riuscita");setBusy(false);return}revision=created.data}setRevisionStates(current=>({...current,[e.id]:revision.status as "draft"|"rejected"}));setDraft({...empty,name:String(revision.content?.name??e.name),excerpt:String(revision.content?.excerpt??e.excerpt??""),description:String(revision.content?.description??e.description??""),duration:revision.content?.duration_minutes==null?String(e.duration_minutes??""):String(revision.content.duration_minutes),price:revision.content?.price_from==null?String(e.price_from??""):String(revision.content.price_from),territoryId:String(revision.content?.territory_id??e.territory_id??""),locality:String(revision.content?.locality??e.locality??""),location:{locationKind:revision.content?.location_kind==="departure"?"departure":"venue",meetingPoint:String(revision.content?.meeting_point??e.meeting_point??""),googleMapsPlaceId:String(revision.content?.google_maps_place_id??e.google_maps_place_id??""),latitude:String(revision.content?.latitude??e.latitude??""),longitude:String(revision.content?.longitude??e.longitude??"")}});setRevisionId(revision.id);setEditingId(null);setStep(safeStep(revision.draft_step));await Promise.all([loadRevisionMedia(revision.id),loadTaxonomy(e.id),loadProfile(e.id),loadCollaboration(e.id)]);
if(REVISION_TAXONOMY_ENABLED){
 const stored=revision.content as Record<string,unknown>|null;
 // Preserve the original baseline across draft reopening. Refreshing the current
 // live taxonomy must not silently reset the optimistic-concurrency snapshot.
 if(Array.isArray(stored?.base_interest_keys)&&Array.isArray(stored?.base_activity_keys)){
  taxonomyBaseRef.current={interestKeys:stored.base_interest_keys.filter((x):x is string=>typeof x==="string"),activityKeys:stored.base_activity_keys.filter((x):x is string=>typeof x==="string")};
 }
 setDraft(current=>({...current,
  interestKeys:Array.isArray(stored?.interest_keys)?stored.interest_keys.filter((x):x is string=>typeof x==="string"):current.interestKeys,
  activityKeys:Array.isArray(stored?.activity_keys)?stored.activity_keys.filter((x):x is string=>typeof x==="string"):current.activityKeys
 }));
}
setOpen(true);setWizardScrollRequest(n=>n+1);
}catch(error){setOpen(false);setMessage("Apertura della proposta non riuscita. "+errorMessage(error,"Riprova."));}finally{setBusy(false);setOpeningRevisionId(null)}}

 useEffect(()=>{
  if(!standaloneEditor||!initialRevisionExperienceId||!revisionStatesLoaded)return;
  if(openedDeepLinkRef.current===initialRevisionExperienceId)return;
  openedDeepLinkRef.current=initialRevisionExperienceId;
  const selected=experiences.find(item=>item.id===initialRevisionExperienceId&&item.review_status==="approved");
  if(!selected){setMessage("La modifica richiesta non è disponibile per questo operatore.");return;}
  void proposeRevision(selected);
  // Only run for the explicit, authenticated experience route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[standaloneEditor,initialRevisionExperienceId,revisionStatesLoaded]);

 async function selectPhotos(files:File[]){const remaining=Math.max(0,6-media.length);if(!remaining)return;setOptimizing(true);setMessage("");try{const {optimized,rejected}=await optimizeExperienceImages(files,remaining);const incoming:NewExperienceMedia[]=optimized.map((file,index)=>({kind:"new",key:newMediaKey(file,index),file,url:URL.createObjectURL(file)}));if(incoming.length){setMedia(m=>[...m,...incoming].slice(0,6));setCoverKey(c=>c??incoming[0]?.key??null);setSaved(false)}if(rejected.length)setMessage(`Impossibile caricare ${rejected.join(", ")}. Verifica che le immagini siano leggibili e riprova.`)}catch(error){setMessage(error instanceof Error?error.message:"Caricamento delle fotografie non riuscito. Riprova.")}finally{setOptimizing(false)}}
 function moveMedia(k:string,d:number){setMedia(m=>moveMediaByKey(m,k,d));setSaved(false)}
 async function removeMedia(item:ExperienceMediaItem){if(revisionId&&item.kind==="existing"){const row=revisionRows[item.key];if(row){const r=await deleteRevisionMedia(supabase,revisionId,{id:row.id,storagePath:item.storagePath,sourceMediaId:row.sourceMediaId});if(!r.ok)return setMessage("Impossibile rimuovere la fotografia.")}}else if(item.kind==="existing")setRemovedPaths(p=>[...p,item.storagePath]);else URL.revokeObjectURL(item.url);const next=media.filter(x=>x.key!==item.key);setMedia(next);setCoverKey(c=>effectiveCoverKey(next,c===item.key?null:c));setSaved(false)}

 async function syncTaxonomy(id:string){const {error:di}=await supabase.from("experience_discovery_intents").delete().eq("experience_id",id);if(di)return di.message;if(draft.interestKeys.length){const {error}=await supabase.from("experience_discovery_intents").insert(draft.interestKeys.map(k=>({experience_id:id,intent_key:k,weight:1})));if(error)return error.message}const {error:da}=await supabase.from("experience_activity_links").delete().eq("experience_id",id).eq("operator_id",operatorId);if(da)return da.message;if(draft.activityKeys.length){const {error}=await supabase.from("experience_activity_links").insert(draft.activityKeys.map(k=>({experience_id:id,activity_key:k,operator_id:operatorId})));if(error)return error.message}return null}
 async function syncProfile(id:string){const days=Math.max(0,Number(draft.bookingNoticeDays)||0),patch={booking_requirement:draft.bookingRequirement,booking_notice_hours:days*24,booking_cutoff_day_offset:days,booking_cutoff_time:days>0&&draft.bookingCutoffTime?draft.bookingCutoffTime:null,weather_dependency:draft.weatherDependency,weather_constraints:draft.weatherDependency==="none"?[]:draft.weatherConstraints,discovery_active:true};const {data:existing,error:r}=await supabase.from("experience_discovery_profiles").select("experience_id").eq("experience_id",id).maybeSingle();if(r)return r.message;if(existing){const {error}=await supabase.from("experience_discovery_profiles").update(patch).eq("experience_id",id);return error?.message??null}const {error}=await supabase.from("experience_discovery_profiles").insert({experience_id:id,audiences:[],children_allowed:null,minimum_age:null,environment:null,editorial_weight:0,...patch});return error?.message??null}
 async function syncRevisionGallery(id:string){
  const persisted:{id:string;key:string}[]=[];
  for(let i=0;i<media.length;i++){
   const item=media[i];
   if(item.kind==="existing"){persisted.push({id:item.id,key:item.key});continue}
   const r=await uploadRevisionMedia(supabase,{revisionId:id,operatorId,file:item.file,storageFilename:safeStorageFilename(i),sortOrder:i,altText:`${draft.name} - foto ${i+1}`});
   if(!r.ok)throw new Error(`Caricamento foto ${i+1} non riuscito: ${r.reason}`);
   persisted.push({id:r.id,key:item.key});
   setRevisionRows(previous=>({...previous,[item.key]:{id:r.id,sourceMediaId:null}}));
   setMedia(previous=>previous.map(photo=>photo.key===item.key?{kind:"existing",key:item.key,id:r.id,storagePath:r.storagePath,url:r.url}:photo));
   URL.revokeObjectURL(item.url);
  }
  const clear=await supabase.from("experience_revision_media").update({is_cover:false}).eq("revision_id",id);
  if(clear.error)throw clear.error;
  for(let i=0;i<persisted.length;i++){
   const order=await supabase.from("experience_revision_media").update({sort_order:i}).eq("id",persisted[i].id).eq("revision_id",id);
   if(order.error)throw order.error;
  }
  if(persisted.length){
   const chosen=effectiveCoverKey(media,coverKey),selected=persisted.find(x=>x.key===chosen)??persisted[0];
   const cover=await supabase.from("experience_revision_media").update({is_cover:true}).eq("id",selected.id).eq("revision_id",id);
   if(cover.error)throw cover.error;
  }
 }
 async function syncLiveGallery(id:string){
  const persisted:{id:string;key:string}[]=[];
  for(let i=0;i<media.length;i++){
   const item=media[i];
   if(item.kind==="existing"){persisted.push({id:item.id,key:item.key});continue}
   const r=await uploadExperienceMedia(supabase,{operatorId,experienceId:id,file:item.file,storageFilename:safeStorageFilename(i),sortOrder:i,altText:`${draft.name} - foto ${i+1}`});
   if(!r.ok)throw new Error(`Caricamento foto ${i+1} non riuscito: ${r.reason}`);
   persisted.push({id:r.id,key:item.key});
   setMedia(previous=>previous.map(photo=>photo.key===item.key?{kind:"existing",key:item.key,id:r.id,storagePath:r.storagePath,url:r.url}:photo));
   URL.revokeObjectURL(item.url);
  }
  const clear=await supabase.from("experience_media").update({is_cover:false}).eq("experience_id",id);
  if(clear.error)throw clear.error;
  for(let i=0;i<persisted.length;i++){
   const order=await supabase.from("experience_media").update({sort_order:i}).eq("id",persisted[i].id).eq("experience_id",id);
   if(order.error)throw order.error;
  }
  if(persisted.length){
   const chosen=effectiveCoverKey(media,coverKey),selected=persisted.find(x=>x.key===chosen)??persisted[0];
   const cover=await supabase.from("experience_media").update({is_cover:true}).eq("id",selected.id).eq("experience_id",id);
   if(cover.error)throw cover.error;
  }
  // Delete replaced photos only after the new gallery and its cover are persisted.
  // A failed upload must not permanently remove the previous gallery.
  if(removedPaths.length){
   const deletion=await deleteExperienceMedia(supabase,id,removedPaths);
   if(!deletion.ok)throw new Error("Impossibile rimuovere le fotografie eliminate.");
   setRemovedPaths([]);
  }
 }

 async function classifyLocation(){
  const lat=draft.location.latitude===""?NaN:Number(draft.location.latitude);
  const lon=draft.location.longitude===""?NaN:Number(draft.location.longitude);
  type Assignment={territoryId:string|null;status:string|null;code:string|null};
  let existing:{territory_id:string|null;territory_assignment_status:string|null;territory_municipality_code:string|null;latitude:number|null;longitude:number|null}|null=null;
  try{
   let sourceId=editingId;
   if(!sourceId&&revisionId){
    const {data:revision}=await supabase.from("experience_revisions").select("experience_id").eq("id",revisionId).single();
    sourceId=revision?.experience_id??null;
   }
   if(sourceId){
    const {data}=await supabase.from("experiences").select("territory_id,territory_assignment_status,territory_municipality_code,latitude,longitude").eq("id",sourceId).maybeSingle();
    existing=data;
   }
  }catch{/* A lookup failure must not generate a false classification. */}
  const samePoint=existing?.latitude!=null&&existing.longitude!=null&&
   Number.isFinite(lat)&&Number.isFinite(lon)&&
   Math.abs(Number(existing.latitude)-lat)<0.0000001&&Math.abs(Number(existing.longitude)-lon)<0.0000001;
  const previous:Assignment={territoryId:existing?.territory_id??null,status:existing?.territory_assignment_status??null,code:existing?.territory_municipality_code??null};
  // Preserve an editorial decision for exactly the same point, and avoid discarding
  // a previously valid classification when an external polygon service is unavailable.
  if(samePoint&&previous.status==="editorial"&&previous.territoryId)return previous;
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return {territoryId:null,status:"review",code:null};
  try{
   const response=await fetch("/api/operator/territory-classify",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({operatorId,latitude:lat,longitude:lon})
   });
   if(!response.ok)throw new Error("Classification API unavailable");
   const data=await response.json() as {status:string;municipalityCode:string|null;territorySlug:string|null};
   const label=data.territorySlug==="messina"?"Messina":data.territorySlug==="area-ionica"?"Area Ionica":data.territorySlug==="area-tirrenica"?"Area Tirrenica":null;
   const territoryId=label?territories.find(t=>t.name===label)?.id??null:null;
   if(data.status==="unavailable"&&samePoint&&previous.territoryId)return previous;
   return {territoryId,status:territoryId?"automatic":data.status==="outside"?"outside":data.status==="unavailable"?"unavailable":"review",code:data.municipalityCode};
  }catch{
   if(samePoint&&previous.territoryId)return previous;
   return {territoryId:null,status:"unavailable",code:null};
  }
 }
 async function saveDraft({keepBusy=false}:{keepBusy?:boolean}={}):Promise<string|null>{setBusy(true);setMessage("");try{
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw new Error("La sessione autenticata non è disponibile nel browser. Ricarica l'Area Operatore; se il problema persiste, sarà necessario ripristinare l'accesso operatore.");const classification=await classifyLocation();if(revisionId){const {data,error}=await supabase.from("experience_revisions").update({status:"draft",draft_step:step,content:{name:draft.name,excerpt:draft.excerpt,description:draft.description,duration_minutes:draft.duration?Number(draft.duration):null,price_from:draft.price?Number(draft.price):null,territory_id:classification.territoryId,territory_assignment_status:classification.status,territory_municipality_code:classification.code,meeting_point:draft.location.meetingPoint.trim()||null,google_maps_place_id:draft.location.googleMapsPlaceId||null,latitude:draft.location.latitude===""?null:Number(draft.location.latitude),longitude:draft.location.longitude===""?null:Number(draft.location.longitude),location_kind:draft.location.locationKind,...(REVISION_TAXONOMY_ENABLED?{interest_keys:draft.interestKeys,activity_keys:draft.activityKeys,base_interest_keys:taxonomyBaseRef.current.interestKeys,base_activity_keys:taxonomyBaseRef.current.activityKeys}:{})}}).eq("id",revisionId).eq("operator_id",operatorId).in("status",["draft","rejected"]).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("La proposta non è più modificabile o non è stata aggiornata. Ricarica la pagina.");await syncRevisionGallery(revisionId);setSaved(true);setMessage("Bozza delle modifiche salvata.");return revisionId}if(editingId){const {error}=await supabase.from("experiences").update({name:draft.name,excerpt:draft.excerpt,description:draft.description,duration_minutes:draft.duration?Number(draft.duration):null,price_from:draft.price?Number(draft.price):null,territory_id:classification.territoryId,territory_assignment_status:classification.status,territory_municipality_code:classification.code,meeting_point:draft.location.meetingPoint.trim()||null,google_maps_place_id:draft.location.googleMapsPlaceId||null,latitude:draft.location.latitude===""?null:Number(draft.location.latitude),longitude:draft.location.longitude===""?null:Number(draft.location.longitude),location_kind:draft.location.locationKind,draft_step:step}).eq("id",editingId);if(error)throw error;const te=await syncTaxonomy(editingId);if(te)throw new Error(te);const pe=await syncProfile(editingId);if(pe)throw new Error(pe);await syncLiveGallery(editingId);setSaved(true);setMessage("Bozza salvata.");return editingId}const {data,error}=await supabase.from("experiences").insert({operator_id:operatorId,name:draft.name||"Nuova esperienza",slug:newExperienceSlug(draft.name||"esperienza"),excerpt:draft.excerpt||null,description:draft.description||null,duration_minutes:draft.duration?Number(draft.duration):null,price_from:draft.price?Number(draft.price):null,territory_id:classification.territoryId,territory_assignment_status:classification.status,territory_municipality_code:classification.code,meeting_point:draft.location.meetingPoint.trim()||null,google_maps_place_id:draft.location.googleMapsPlaceId||null,latitude:draft.location.latitude===""?null:Number(draft.location.latitude),longitude:draft.location.longitude===""?null:Number(draft.location.longitude),location_kind:draft.location.locationKind,review_status:"draft",draft_step:step,published:false}).select("id").single();if(error||!data)throw error??new Error("Creazione esperienza non riuscita");setEditingId(data.id);const te=await syncTaxonomy(data.id);if(te)throw new Error(te);const pe=await syncProfile(data.id);if(pe)throw new Error(pe);await syncLiveGallery(data.id);setSaved(true);clearLocal();setMessage("Bozza salvata.");return data.id}catch(err){setMessage(isAuthWriteError(err)?"Autorizzazione al salvataggio non disponibile. Ricarica l'Area Operatore e verifica la sessione.":errorMessage(err,"Salvataggio non riuscito"));return null}finally{if(!keepBusy)setBusy(false)}}
 async function submit(){if(media.length===0){setMessage("Prima dell’invio aggiungi almeno una fotografia e seleziona la copertina nel passaggio 4.");setStep(3);return}if(!complete(draft)){setMessage("Prima dell’invio completa interessi, attività e conferma il luogo di svolgimento o partenza sulla mappa. La macroarea sarà classificata da BIMARIS.");return}setBusy(true);setMessage("");try{const classification=await classifyLocation();if(revisionId){await syncRevisionGallery(revisionId);const {data,error}=await supabase.from("experience_revisions").update({status:"pending",draft_step:5,submitted_at:new Date().toISOString(),content:{name:draft.name,excerpt:draft.excerpt,description:draft.description,duration_minutes:draft.duration?Number(draft.duration):null,price_from:draft.price?Number(draft.price):null,territory_id:classification.territoryId,territory_assignment_status:classification.status,territory_municipality_code:classification.code,meeting_point:draft.location.meetingPoint.trim()||null,google_maps_place_id:draft.location.googleMapsPlaceId||null,latitude:draft.location.latitude===""?null:Number(draft.location.latitude),longitude:draft.location.longitude===""?null:Number(draft.location.longitude),location_kind:draft.location.locationKind,...(REVISION_TAXONOMY_ENABLED?{interest_keys:draft.interestKeys,activity_keys:draft.activityKeys,base_interest_keys:taxonomyBaseRef.current.interestKeys,base_activity_keys:taxonomyBaseRef.current.activityKeys}:{})}}).eq("id",revisionId).eq("operator_id",operatorId).in("status",["draft","rejected"]).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("La proposta non è più modificabile o non è stata aggiornata. Ricarica la pagina.");setSaved(true);setSubmissionNotice("Modifica inviata correttamente a BIMARIS. La proposta è ora in revisione.");setOpen(false);router.refresh();return}const id=await saveDraft({keepBusy:true});if(!id)throw new Error("Salvataggio della bozza non riuscito: impossibile inviare.");const {data,error}=await supabase.from("experiences").update({review_status:"pending",draft_step:5,submitted_at:new Date().toISOString()}).eq("id",id).eq("operator_id",operatorId).in("review_status",["draft","rejected"]).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("Non è stato confermato l’invio: la scheda non è più modificabile.");setSaved(true);clearLocal();setSubmissionNotice("Esperienza inviata correttamente a BIMARIS. La proposta è ora in revisione.");setOpen(false);router.refresh()}catch(err){setMessage(err instanceof Error?err.message:"Invio non riuscito")}finally{setBusy(false)}}

 return <section ref={sectionRef} id="operator-experiences" className="experience-manager" style={{scrollMarginTop:120}}>{standaloneEditor&&!open&&<div className="experience-edit-route__loading" role={message?"alert":"status"}><p>{message||"Caricamento della modifica in corso…"}</p><button type="button" onClick={()=>router.push(`/area-operatore?operatore=${encodeURIComponent(operatorId)}`)}>← Torna alle esperienze</button></div>}{!standaloneEditor&&<><div className="experience-manager__head"><div><div className="eyebrow">Le tue esperienze</div><h2>Gestisci ciò che proponi</h2><p>Crea, completa e invia le esperienze a BIMARIS. Puoi salvare e riprendere una bozza in qualsiasi momento.</p></div></div>{!open&&message&&<div className="experience-manager__submission-notice" role="alert" aria-live="assertive"><strong>Impossibile aprire la modifica</strong><p>{message}</p></div>}{!open&&submissionNotice&&<div className="experience-manager__submission-notice" role="status" aria-live="polite"><strong>Invio completato</strong><p>{submissionNotice}</p></div>}{!open&&<div className="experience-manager__create-primary"><button className="button" onClick={start}>+ Nuova esperienza</button></div>}{experiences.length>0&&<div className={`experience-manager__list${showAllExperiences?" experience-manager__list--expanded":""}`}>{experiences.map(e=><article key={e.id} className="experience-manager__card"><div><strong>{e.name}</strong><span>{e.review_status==="draft"?"Bozza":e.review_status==="pending"?"In revisione":e.review_status==="approved"?"Approvata":e.review_status==="rejected"?"Da correggere":"In lavorazione"}</span>{e.review_notes&&<small>{e.review_notes}</small>}</div>{e.review_status==="approved"?(revisionStates[e.id]==="pending"||revisionStates[e.id]==="approved"?<span role="status" className="experience-manager__revision-status">{revisionStates[e.id]==="pending"?"Modifica in valutazione":"Modifica già approvata"}</span>:<button className="experience-manager__propose-revision" type="button" onClick={()=>router.push(`/area-operatore?operatore=${encodeURIComponent(operatorId)}&modifica=${encodeURIComponent(e.id)}`)} disabled={busy||!revisionStatesLoaded} aria-busy={openingRevisionId===e.id}>{!revisionStatesLoaded?"Verifica stato…":openingRevisionId===e.id?"Apertura in corso…":revisionStates[e.id]==="draft"||revisionStates[e.id]==="rejected"?"Riprendi modifica":"Proponi modifica"}</button>):e.review_status==="pending"?<button disabled>In revisione</button>:<button onClick={()=>edit(e)}>Apri</button>}</article>)}</div>}{experiences.length>2&&<button type="button" className="experience-manager__show-all" aria-expanded={showAllExperiences} onClick={()=>setShowAllExperiences(value=>!value)}>{showAllExperiences?"Mostra meno esperienze":`Mostra tutte le esperienze (${experiences.length})`}</button>}{!open&&<div className="experience-manager__create">{experiences.length===0&&<p>Non hai ancora creato esperienze. Inizia dalla prima.</p>}<div className="experience-manager__collaboration"><strong>Vuoi collaborare con un altro operatore?</strong><p>Proponi un’attività condivisa e sviluppa nuove opportunità con altri operatori BIMARIS.</p><a href="/area-operatore/collaborazioni/nuova">Proponi una collaborazione →</a></div></div>}</>}{open&&typeof document!=="undefined"&&createPortal(<div className="experience-manager experience-edit-screen" role="dialog" aria-modal="true" aria-label={`Gestione esperienza: ${draft.name||"Nuova esperienza"}`}><div className="experience-edit-screen__layout"><div className="experience-edit-screen__header"><button type="button" className="experience-edit-screen__back" onClick={()=>{releaseNewMedia();if(standaloneEditor){router.push(`/area-operatore?operatore=${encodeURIComponent(operatorId)}`)}else{setOpen(false)}}} disabled={busy}>← Torna alle esperienze</button><div className="experience-edit-screen__eyebrow">AREA OPERATORE · {revisionId?"REVISIONE ESPERIENZA":"GESTIONE ESPERIENZA"}</div><h1>{draft.name||"Nuova esperienza"}</h1><p>{revisionId?"Le modifiche alla scheda approvata saranno valutate da BIMARIS prima di essere applicate.":"Completa la scheda e salva i tuoi progressi."}</p></div><div ref={wizardRef} className="experience-wizard"><div className="experience-wizard__progress"><span>Passaggio {step+1} di 6</span><div><i style={{width:`${((step+1)/6)*100}%`}}/></div></div>{step===0&&<div className="experience-step"><h3>Partiamo dall’essenziale</h3><p>Racconta in poche parole cosa rende riconoscibile questa esperienza.</p><label>Nome esperienza<input value={draft.name} onChange={e=>change("name",e.target.value)} placeholder="Es. Tramonto in barca nello Stretto"/></label><label>In breve<textarea value={draft.excerpt} onChange={e=>change("excerpt",e.target.value)} placeholder="Una frase chiara che faccia capire subito cosa vivrà la persona."/></label></div>}{step===1&&<div className="experience-step"><h3>Racconta l’esperienza</h3><p>Descrivi cosa succede, cosa rende speciale il momento e cosa può aspettarsi chi partecipa.</p><label>Descrizione<textarea rows={7} value={draft.description} onChange={e=>change("description",e.target.value)} placeholder="Racconta il ritmo, i momenti principali, l’atmosfera..."/></label></div>}{step===2&&<div className="experience-step"><h3>Dettagli utili</h3><div className="experience-grid"><label>Durata (minuti)<input type="number" min="1" value={draft.duration} onChange={e=>change("duration",e.target.value)}/></label><label>Prezzo da (€)<input type="number" min="0" step="0.01" value={draft.price} onChange={e=>change("price",e.target.value)}/></label></div><ExperienceLocationPicker value={draft.location} onChange={location=>{setDraft(d=>({...d,location}));setSaved(false)}}/><div className="experience-fieldset"><strong>Interessi collegati</strong><p>{revisionId?(REVISION_TAXONOMY_ENABLED?"Le nuove scelte saranno sottoposte ad approvazione insieme alla revisione.":"Interessi della scheda originale, conservati senza modifiche. La modifica degli interessi richiede un flusso di revisione dedicato."):"Scegli fino a 3 interessi che descrivono meglio l’esperienza."}</p><div className="experience-chips">{interests.map(i=><button type="button" key={i.key} className={draft.interestKeys.includes(i.key)?"is-active":""} onClick={()=>toggleInterest(i.key)} disabled={Boolean(revisionId)&&!REVISION_TAXONOMY_ENABLED}>{i.label}</button>)}</div></div><div className="experience-fieldset"><strong>Attività principali</strong><p>{revisionId?(REVISION_TAXONOMY_ENABLED?"Le modifiche saranno applicate soltanto dopo l’approvazione amministrativa.":"Attività collegate alla scheda originale; non verranno cancellate o modificate dalla proposta."):"Indica cosa si fa concretamente durante l’esperienza."}</p><div className="experience-chips">{activities.map(a=><button type="button" key={a.key} className={draft.activityKeys.includes(a.key)?"is-active":""} onClick={()=>toggleActivity(a.key)} disabled={Boolean(revisionId)&&!REVISION_TAXONOMY_ENABLED}>{a.label}</button>)}</div></div></div>}{step===3&&<ExperienceMediaStep items={media} coverKey={coverKey} experienceName={draft.name} excerpt={draft.excerpt} duration={draft.duration} price={draft.price} territoryName={territories.find(t=>t.id===draft.territoryId)?.name??""} busy={busy||optimizing} onFiles={selectPhotos} onRemove={removeMedia} onCover={k=>{setCoverKey(k);setSaved(false)}} onMove={moveMedia}/>} {step===4&&(revisionId?<div className="experience-step" role="note"><h3>Disponibilità e condizioni</h3><p>Le condizioni di prenotazione e meteo della scheda approvata restano invariate durante questa revisione. Non sono modificabili in questo flusso.</p><p>Prenotazione: <strong>{draft.bookingRequirement==="required"?"Obbligatoria":draft.bookingRequirement==="recommended"?"Consigliata":"Non richiesta"}</strong>. Dipendenza dal meteo: <strong>{draft.weatherDependency==="required"?"Forte":draft.weatherDependency==="partial"?"Parziale":"Nessuna"}</strong>.</p></div>:<div className="experience-step"><h3>Disponibilità e condizioni</h3><p>Queste informazioni aiutano BIMARIS a proporre l’esperienza nel momento giusto.</p><div className="experience-grid"><label>Prenotazione<select value={draft.bookingRequirement} onChange={e=>setBookingRequirement(e.target.value as BookingRequirement)}><option value="none">Non richiesta</option><option value="recommended">Consigliata</option><option value="required">Obbligatoria</option></select></label>{draft.bookingRequirement!=="none"&&<><label>Preavviso minimo (giorni)<input type="number" min="0" value={draft.bookingNoticeDays} onChange={e=>setNoticeDays(e.target.value)}/></label>{Number(draft.bookingNoticeDays)>0&&<label>Orario limite del giorno precedente<input type="time" value={draft.bookingCutoffTime} onChange={e=>change("bookingCutoffTime",e.target.value)}/></label>}</>}<label>Dipendenza dal meteo<select value={draft.weatherDependency} onChange={e=>setWeatherDependency(e.target.value as WeatherDependency)}><option value="none">Nessuna</option><option value="partial">Parziale</option><option value="required">Forte</option></select></label></div>{draft.weatherDependency!=="none"&&<div className="experience-fieldset"><strong>Condizioni che possono limitarla</strong><div className="experience-chips">{weatherOptions.map(w=><button type="button" key={w.key} className={draft.weatherConstraints.includes(w.key)?"is-active":""} onClick={()=>toggleWeather(w.key)}>{w.label}</button>)}</div></div>}</div>)} {step===5&&(revisionId?<div className="experience-step" role="status"><div className="experience-step__number">05 · Collaborazione</div><h3>Collaborazione già associata</h3>{collaboration?<p><strong>{collaboration.operatorName}</strong> — {collaboration.activity||"Attività non specificata"} · {collaboration.status==="accepted"?"Confermata":collaboration.status==="pending"?"In attesa":"Rifiutata"}. La collaborazione della scheda originale rimane invariata durante la revisione.</p>:<p>Non risulta un partner associato alla scheda originale. La revisione non crea né cancella collaborazioni.</p>}</div>:<ExperienceCollaborationStep operatorId={operatorId} experienceId={editingId} disabled={busy} onChange={onCollaborationChange} onReadyChange={onCollaborationReady}/>)}<div className="experience-wizard__actions"><button type="button" onClick={()=>{releaseNewMedia();if(standaloneEditor){router.push(`/area-operatore?operatore=${encodeURIComponent(operatorId)}`)}else{setOpen(false)}}} disabled={busy}>Chiudi</button><button type="button" onClick={()=>{void saveDraft()}} disabled={busy||optimizing}>{busy?"Salvataggio…":"Salva bozza"}</button>{step>0&&<button type="button" onClick={()=>navigateStep(-1)} disabled={busy}>← Indietro</button>}{step<5?<button type="button" className="button" onClick={()=>navigateStep(1)} disabled={busy}>Continua →</button>:<button type="button" className="button" onClick={submit} disabled={busy||optimizing||(!revisionId&&!collaborationReady)}>{busy?"Invio…":revisionId?"Invia modifiche":"Invia a BIMARIS"}</button>}</div>{message&&<p className="experience-wizard__message">{message}</p>}</div></div></div>,document.body)}</section>
}
