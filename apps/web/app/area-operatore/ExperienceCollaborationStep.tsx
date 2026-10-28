"use client";

import {useEffect,useMemo,useState} from "react";
import {createBrowserClient} from "@supabase/ssr";

type OperatorOption={id:string;name:string;category:string|null};
export type ExperienceCollaboration={operatorId:string;operatorName:string;activity:string;status:"pending"|"accepted"|"rejected"};

export default function ExperienceCollaborationStep({operatorId,experienceId,onChange,onReadyChange}:{operatorId:string;experienceId:string|null;disabled?:boolean;onChange:(value:ExperienceCollaboration|null)=>void;onReadyChange:(ready:boolean)=>void}){
 const supabase=useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!),[]);
 const [mode,setMode]=useState<""|"solo"|"partner">("");
 const [operators,setOperators]=useState<OperatorOption[]>([]);
 const [partnerId,setPartnerId]=useState("");
 const [activity,setActivity]=useState("");
 const [invited,setInvited]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const partner=operators.find(o=>o.id===partnerId);

 useEffect(()=>{let live=true;(async()=>{const {data}=await supabase.from("operators").select("id,name,category").eq("published",true).eq("selection_status","selected").neq("id",operatorId).order("name");if(live)setOperators((data??[]) as OperatorOption[])})();return()=>{live=false}},[operatorId,supabase]);

 useEffect(()=>{let live=true;if(!experienceId)return; (async()=>{
  const {data,error}=await supabase.from("experience_operators").select("operator_id,activity_label,approval_status").eq("experience_id",experienceId).eq("role","participant").limit(1).maybeSingle();
  if(!live||error||!data)return;
  const {data:partnerRow}=await supabase.from("operators").select("name").eq("id",data.operator_id).maybeSingle();
  if(!live)return;
  const status:ExperienceCollaboration["status"]=data.approval_status==="accepted"?"accepted":data.approval_status==="rejected"?"rejected":"pending";
  const value:ExperienceCollaboration={operatorId:data.operator_id,operatorName:partnerRow?.name??"Operatore BIMARIS",activity:data.activity_label??"",status};
  setMode("partner");setPartnerId(data.operator_id);setActivity(data.activity_label??"");onChange(value);
  if(status==="rejected"){
   setInvited(false);onReadyChange(false);
   setMessage("Il partner ha rifiutato la collaborazione. Puoi modificare il partner o l'attività e inviare un nuovo invito.");
  }else{
   setInvited(true);onReadyChange(true);
   setMessage(status==="accepted"?"Collaborazione confermata dal partner.":"Invito già inviato. Nell'anteprima il partner sarà indicato come in attesa di conferma.");
  }
 })();return()=>{live=false}},[experienceId,supabase,onChange,onReadyChange]);

 useEffect(()=>{onReadyChange(mode==="solo"||(mode==="partner"&&invited))},[mode,invited,onReadyChange]);
 async function invite(){
  if(!experienceId)return setMessage("Salva la bozza prima di invitare il partner.");
  if(!partnerId||!activity.trim())return setMessage("Seleziona il partner e indica che cosa farà nell'esperienza.");
  setBusy(true);setMessage("");
  const response=await fetch("/api/operator/collaborations/invite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({experience_id:experienceId,operator_id:operatorId,partner_operator_id:partnerId,activity_label:activity.trim()})});
  const body=await response.json().catch(()=>({}));setBusy(false);
  if(!response.ok)return setMessage(body.error??"Invito non riuscito.");
  setInvited(true);onChange({operatorId:partnerId,operatorName:partner?.name??"Operatore BIMARIS",activity:activity.trim(),status:"pending"});
  setMessage("Invito inviato. Nell'anteprima il partner sarà indicato come in attesa di conferma.");
 }
 function chooseSolo(){setMode("solo");setPartnerId("");setActivity("");setInvited(false);setMessage("");onChange(null)}
 function choosePartner(){setMode("partner");setInvited(false);setMessage("");onChange(null)}
 return <div className="experience-step"><div className="experience-step__number">05 · Collaborazione</div><h3>Questa esperienza è realizzata insieme ad altre realtà?</h3><p>Definisci ora chi partecipa: l'informazione sarà visibile nell'anteprima dell'esperienza.</p><div className="choice-row"><button type="button" className={`button ${mode==="solo"?"button--primary":"button--ghost"}`} onClick={chooseSolo}>No, la realizziamo noi</button><button type="button" className={`button ${mode==="partner"?"button--primary":"button--ghost"}`} onClick={choosePartner}>Sì, collaboriamo con altri operatori</button></div>{mode==="partner"&&<div style={{display:"grid",gap:14,marginTop:20}}><div className="experience-field"><label>Operatore partner</label><select value={partnerId} onChange={e=>{setPartnerId(e.target.value);setInvited(false);onChange(null)}}><option value="">Seleziona un operatore</option>{operators.map(o=><option key={o.id} value={o.id}>{o.name}{o.category?` · ${o.category}`:""}</option>)}</select></div><div className="experience-field"><label>Che cosa farà il partner?</label><input value={activity} onChange={e=>{setActivity(e.target.value);setInvited(false);onChange(null)}} maxLength={160} placeholder="Es. preparazione e servizio dell'aperitivo al termine del trekking"/></div><button type="button" className="button button--primary" disabled={busy||!partnerId||!activity.trim()||invited||!experienceId} onClick={invite}>{busy?"Invio…":invited?"Invito inviato":"Invita alla collaborazione"}</button>{!experienceId&&<small>Salva prima la bozza per poter inviare l'invito al partner.</small>}</div>}{message&&<p style={{marginTop:14}}><strong>{message}</strong></p>}</div>;
}
