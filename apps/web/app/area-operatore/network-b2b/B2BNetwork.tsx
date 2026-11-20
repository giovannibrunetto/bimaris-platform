"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import B2BNewMatchAlerts from "../B2BNewMatchAlerts";
import { AVAILABILITY_MODES, B2B_TAGS, COLLABORATION_TYPES, CUSTOMER_SEGMENTS, LANGUAGES, type B2BProfile } from "@/lib/b2b";

type Match = {
  operator: { id: string; name: string; slug: string; category: string | null };
  score: number;
  direct: string[];
  reciprocal: string[];
  level: string;
};

type Props = { operatorId: string; operatorName: string; canManage: boolean };

const emptyProfile = (operatorId: string): B2BProfile => ({
  operator_id: operatorId, enabled: false, offer_tags: [], seek_tags: [], collaboration_types: [], customer_segments: [], languages: [], areas: [], availability_modes: [], offer_summary: null, seek_summary: null, conditions_notes: null,
});

function Multi({ title, options, value, onChange }: { title: string; options: readonly (readonly [string,string])[]; value: string[]; onChange: (v:string[])=>void }) {
  const [expanded,setExpanded]=useState(false);
  const names=value.map(key=>options.find(option=>option[0]===key)?.[1]??key);
  return <section className="b2b-compact-choice" aria-label={title}>
    <div className="b2b-compact-choice__head">
      <div><h3>{title}</h3><p>{names.length?names.join(" · "):"Nessuna selezione"}</p></div>
      <button type="button" className="b2b-compact-choice__toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?"Chiudi":"Modifica"} <span aria-hidden="true">{expanded?"−":"+"}</span></button>
    </div>
    {expanded&&<fieldset className="b2b-options"><legend className="b2b-options__legend">Seleziona le opzioni</legend><div className="b2b-options__grid">{options.map(([key,label])=><label key={key} className={`b2b-option${value.includes(key)?" b2b-option--selected":""}`}><input type="checkbox" checked={value.includes(key)} onChange={(e)=>onChange(e.target.checked?[...value,key]:value.filter(x=>x!==key))}/><span>{label}</span></label>)}</div></fieldset>}
  </section>;
}

export default function B2BNetwork({ operatorId, operatorName, canManage }: Props) {
  const profilePanelRef=useRef<HTMLElement>(null);
  const alignedOperatorRef=useRef<string|null>(null);
  const [profile,setProfile]=useState<B2BProfile>(emptyProfile(operatorId));
  const [matches,setMatches]=useState<Match[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [step,setStep]=useState<0|1|2|3>(0);
  const labels=useMemo<Map<string,string>>(()=>new Map(B2B_TAGS.map(([key,label])=>[key,label] as [string,string])),[]);

  async function load(){setLoading(true);const res=await fetch(`/api/operator/b2b-profile?operatorId=${operatorId}`,{cache:"no-store"});const json=await res.json();if(json.profile)setProfile(json.profile);setLoading(false);if(json.profile?.enabled)void loadMatches();}
  async function loadMatches(){const res=await fetch(`/api/operator/b2b-matches?operatorId=${operatorId}`,{cache:"no-store"});const json=await res.json();setMatches(json.matches??[]);}
  useEffect(()=>{setStep(0);setMessage("");alignedOperatorRef.current=null;void load();},[operatorId]);

  useEffect(()=>{
    if(loading||alignedOperatorRef.current===operatorId)return;
    alignedOperatorRef.current=operatorId;
    let nextFrame=0;
    const frame=requestAnimationFrame(()=>{
      nextFrame=requestAnimationFrame(()=>{
        const panel=profilePanelRef.current;
        if(!panel)return;
        const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        panel.scrollIntoView({behavior:reducedMotion?"instant":"smooth",block:"start"});
      });
    });
    return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(nextFrame)};
  },[loading,operatorId]);

  async function save(){setSaving(true);setMessage("");const res=await fetch("/api/operator/b2b-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});const json=await res.json();setSaving(false);if(!res.ok){setMessage(json.error??"Impossibile salvare il profilo.");return;}setProfile(json.profile);setMessage("Profilo B2B aggiornato.");if(json.profile.enabled)await loadMatches();else setMatches([]);}

  if(loading)return <div className="detail-panel"><p>Caricamento Network B2B…</p></div>;
  const steps=["Cosa offri","Cosa cerchi","Disponibilità","Riepilogo"] as const;
  const next=()=>{setMessage("");setStep(s=>Math.min(s+1,3) as 0|1|2|3);};
  const back=()=>{setMessage("");setStep(s=>Math.max(s-1,0) as 0|1|2|3);};
  return <div className="b2b-network">
    <section ref={profilePanelRef} className="b2b-network__panel" style={{scrollMarginTop:"clamp(90px, 12vh, 132px)"}}>
      <B2BNewMatchAlerts operatorId={operatorId} showPreferences={canManage}/>
      <nav className="b2b-flow" aria-label="Passaggi del profilo Network B2B">
        {steps.map((label,index)=><button key={label} type="button" className={`b2b-flow__step${step===index?" is-current":""}`} aria-current={step===index?"step":undefined} onClick={()=>{setMessage("");setStep(index as 0|1|2|3)}}><span>{index+1}</span>{label}</button>)}
      </nav>
      <p className="b2b-flow__hint">Passaggio {step+1} di 4 · Puoi tornare a modificare ogni sezione prima di salvare.</p>
      {step===0&&<div className="b2b-network__group"><div className="b2b-network__group-heading"><span className="b2b-network__group-index">01</span><div><h2>Il tuo profilo nella rete</h2><p>Indica cosa puoi offrire agli altri operatori.</p></div></div>
      <label className="b2b-network__optin b2b-network__optin--contrast" style={{background:"#12383b",border:"1px solid #d8a94f",color:"#f7f2e9"}}><input type="checkbox" checked={profile.enabled} disabled={!canManage} onChange={e=>setProfile({...profile,enabled:e.target.checked})}/><span className="b2b-network__optin-text" style={{color:"#f7f2e9",fontWeight:750}}>Voglio comparire nel Network B2B BIMARIS</span></label>
      <Multi title="Cosa offri agli altri operatori?" options={B2B_TAGS} value={profile.offer_tags} onChange={v=>setProfile({...profile,offer_tags:v})}/>
      <label className="b2b-network__field"><strong>Descrivi ciò che offri</strong><textarea value={profile.offer_summary??""} onChange={e=>setProfile({...profile,offer_summary:e.target.value})} rows={4} className="b2b-network__input" placeholder="Es. escursioni guidate per piccoli gruppi, anche in inglese, con partenza da Messina…"/></label>
      </div>}
      {step===1&&<div className="b2b-network__group"><div className="b2b-network__group-heading"><span className="b2b-network__group-index">02</span><div><h2>Collaborazioni che cerchi</h2><p>Descrivi le opportunità e i partner con cui vorresti lavorare.</p></div></div>
      <Multi title="Cosa cerchi dagli altri operatori?" options={B2B_TAGS} value={profile.seek_tags} onChange={v=>setProfile({...profile,seek_tags:v})}/>
      <label className="b2b-network__field"><strong>Descrivi la collaborazione che cerchi</strong><textarea value={profile.seek_summary??""} onChange={e=>setProfile({...profile,seek_summary:e.target.value})} rows={4} className="b2b-network__input" placeholder="Es. cerco strutture ricettive interessate a proporre escursioni ai propri ospiti…"/></label>
      <Multi title="Tipo di collaborazione" options={COLLABORATION_TYPES} value={profile.collaboration_types} onChange={v=>setProfile({...profile,collaboration_types:v})}/>
      </div>}
      {step===2&&<div className="b2b-network__group"><div className="b2b-network__group-heading"><span className="b2b-network__group-index">03</span><div><h2>Disponibilità e condizioni</h2><p>Completa le informazioni utili a valutare una collaborazione.</p></div></div>
      <Multi title="Clientela con cui lavori" options={CUSTOMER_SEGMENTS} value={profile.customer_segments} onChange={v=>setProfile({...profile,customer_segments:v})}/>
      <Multi title="Lingue" options={LANGUAGES} value={profile.languages} onChange={v=>setProfile({...profile,languages:v})}/>
      <Multi title="Disponibilità" options={AVAILABILITY_MODES} value={profile.availability_modes} onChange={v=>setProfile({...profile,availability_modes:v})}/>
      <label className="b2b-network__field"><strong>Aree in cui vuoi collaborare</strong><input value={profile.areas.join(", ")} onChange={e=>setProfile({...profile,areas:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} className="b2b-network__input" placeholder="Messina, Peloritani, Nebrodi, Eolie"/></label>
      <label className="b2b-network__field"><strong>Condizioni o informazioni importanti</strong><textarea value={profile.conditions_notes??""} onChange={e=>setProfile({...profile,conditions_notes:e.target.value})} rows={3} className="b2b-network__input" placeholder="Preavviso, minimi, limiti operativi o altre condizioni…"/></label>
      </div>}
      {step===3&&<div className="b2b-network__group b2b-flow__summary"><div className="b2b-network__group-heading"><span className="b2b-network__group-index">✓</span><div><h2>Riepilogo del profilo</h2><p>Controlla le informazioni prima di salvare.</p></div></div>
        <dl className="b2b-flow__summary-list">
          <div><dt>Presenza nella rete</dt><dd>{profile.enabled?"Attiva":"Non attiva"}</dd><button type="button" onClick={()=>setStep(0)}>Modifica</button></div>
          <div><dt>Cosa offri</dt><dd>{profile.offer_tags.map(k=>labels.get(k)??k).join(", ")||"Non indicato"}{profile.offer_summary?` — ${profile.offer_summary}`:""}</dd><button type="button" onClick={()=>setStep(0)}>Modifica</button></div>
          <div><dt>Cosa cerchi</dt><dd>{profile.seek_tags.map(k=>labels.get(k)??k).join(", ")||"Non indicato"}{profile.seek_summary?` — ${profile.seek_summary}`:""}</dd><button type="button" onClick={()=>setStep(1)}>Modifica</button></div>
          <div><dt>Tipi di collaborazione</dt><dd>{profile.collaboration_types.length?profile.collaboration_types.map(k=>COLLABORATION_TYPES.find(x=>x[0]===k)?.[1]??k).join(", "):"Non indicati"}</dd><button type="button" onClick={()=>setStep(1)}>Modifica</button></div>
          <div><dt>Disponibilità e condizioni</dt><dd>{[...profile.availability_modes.map(k=>AVAILABILITY_MODES.find(x=>x[0]===k)?.[1]??k),...profile.languages.map(k=>LANGUAGES.find(x=>x[0]===k)?.[1]??k),...profile.areas,profile.conditions_notes??""].filter(Boolean).join(" · ")||"Non indicate"}</dd><button type="button" onClick={()=>setStep(2)}>Modifica</button></div>
        </dl>
      </div>}
      <div className="b2b-flow__actions">{step>0&&<button type="button" className="b2b-flow__back" onClick={back}>← Indietro</button>}{step<3&&<button type="button" className="button" onClick={next}>Continua →</button>}</div>
      {canManage&&step===3&&<div className="b2b-network__actions"><button className="button" onClick={save} disabled={saving}>{saving?"Salvataggio…":"Salva e trova compatibilità"}</button></div>}{message&&<p className="b2b-flow__feedback" role="status">{message}</p>}
    </section>

    {profile.enabled&&step===3&&<section className="b2b-network__matches"><div className="eyebrow">I TUOI MATCH</div><h2 style={{margin:"8px 0 18px"}}>{matches.length?`${matches.length} operatori compatibili trovati`:"Nessun match disponibile al momento"}</h2><div style={{display:"grid",gap:14}}>{matches.map(m=><article key={m.operator.id} style={{padding:18,border:"1px solid #ddd5c8",borderRadius:16,background:"#fff",display:"grid",gap:10}}><div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontSize:20}}>{m.operator.name}</strong>{m.operator.category&&<div style={{opacity:.7,marginTop:3}}>{m.operator.category}</div>}</div><strong style={{fontSize:22}}>{m.score}%</strong></div><div><strong>Perché è compatibile:</strong> cerchi {m.direct.map(x=>labels.get(x)??x).join(", ")}, che questo operatore offre.{m.reciprocal.length?` Inoltre cerca ${m.reciprocal.map(x=>labels.get(x)??x).join(", ")}, che rientra nella tua offerta.`:""}</div><div style={{fontSize:14,opacity:.75}}>Livello: {m.level==="molto_forte"?"match molto forte":m.level==="buono"?"buona compatibilità":"compatibilità potenziale"}</div>{canManage&&<div style={{marginTop:4}}><Link className="button" href={`/area-operatore/collaborazioni/nuova?operatorId=${encodeURIComponent(operatorId)}&partnerId=${encodeURIComponent(m.operator.id)}`}>Proponi una collaborazione</Link></div>}</article>)}</div></section>}
  </div>;
}
