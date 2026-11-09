"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  return <fieldset className="b2b-options"><legend className="b2b-options__legend">{title}</legend><div className="b2b-options__grid">{options.map(([key,label])=><label key={key} className={`b2b-option${value.includes(key)?" b2b-option--selected":""}`}><input type="checkbox" checked={value.includes(key)} onChange={(e)=>onChange(e.target.checked?[...value,key]:value.filter(x=>x!==key))}/><span>{label}</span></label>)}</div></fieldset>
}

export default function B2BNetwork({ operatorId, operatorName, canManage }: Props) {
  const [profile,setProfile]=useState<B2BProfile>(emptyProfile(operatorId));
  const [matches,setMatches]=useState<Match[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const labels=useMemo<Map<string,string>>(()=>new Map(B2B_TAGS.map(([key,label])=>[key,label] as [string,string])),[]);

  async function load(){setLoading(true);const res=await fetch(`/api/operator/b2b-profile?operatorId=${operatorId}`,{cache:"no-store"});const json=await res.json();if(json.profile)setProfile(json.profile);setLoading(false);if(json.profile?.enabled)void loadMatches();}
  async function loadMatches(){const res=await fetch(`/api/operator/b2b-matches?operatorId=${operatorId}`,{cache:"no-store"});const json=await res.json();setMatches(json.matches??[]);}
  useEffect(()=>{void load();},[operatorId]);

  async function save(){setSaving(true);setMessage("");const res=await fetch("/api/operator/b2b-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});const json=await res.json();setSaving(false);if(!res.ok){setMessage(json.error??"Impossibile salvare il profilo.");return;}setProfile(json.profile);setMessage("Profilo B2B aggiornato.");if(json.profile.enabled)await loadMatches();else setMatches([]);}

  if(loading)return <div className="detail-panel"><p>Caricamento Network B2B…</p></div>;
  return <div className="b2b-network">
    <section className="b2b-network__panel">
      <header className="b2b-network__hero"><div className="eyebrow">NETWORK PROFESSIONALE · BIMARIS</div><h1>Trova operatori compatibili con {operatorName}</h1><p>Indica con precisione cosa offri e cosa cerchi. BIMARIS incrocia il tuo profilo con gli altri operatori che hanno scelto di partecipare al Network B2B.</p></header>
      <label className="b2b-network__optin"><input type="checkbox" checked={profile.enabled} disabled={!canManage} onChange={e=>setProfile({...profile,enabled:e.target.checked})}/> Voglio comparire nel Network B2B BIMARIS</label>
      <Multi title="Cosa offri agli altri operatori?" options={B2B_TAGS} value={profile.offer_tags} onChange={v=>setProfile({...profile,offer_tags:v})}/>
      <label className="b2b-network__field"><strong>Descrivi ciò che offri</strong><textarea value={profile.offer_summary??""} onChange={e=>setProfile({...profile,offer_summary:e.target.value})} rows={4} className="b2b-network__input" placeholder="Es. escursioni guidate per piccoli gruppi, anche in inglese, con partenza da Messina…"/></label>
      <Multi title="Cosa cerchi dagli altri operatori?" options={B2B_TAGS} value={profile.seek_tags} onChange={v=>setProfile({...profile,seek_tags:v})}/>
      <label><strong>Descrivi la collaborazione che cerchi</strong><textarea value={profile.seek_summary??""} onChange={e=>setProfile({...profile,seek_summary:e.target.value})} rows={4} style={{width:"100%",marginTop:8,padding:12,borderRadius:12,border:"1px solid #d8d1c6"}} placeholder="Es. cerco strutture ricettive interessate a proporre escursioni ai propri ospiti…"/></label>
      <Multi title="Tipo di collaborazione" options={COLLABORATION_TYPES} value={profile.collaboration_types} onChange={v=>setProfile({...profile,collaboration_types:v})}/>
      <Multi title="Clientela con cui lavori" options={CUSTOMER_SEGMENTS} value={profile.customer_segments} onChange={v=>setProfile({...profile,customer_segments:v})}/>
      <Multi title="Lingue" options={LANGUAGES} value={profile.languages} onChange={v=>setProfile({...profile,languages:v})}/>
      <Multi title="Disponibilità" options={AVAILABILITY_MODES} value={profile.availability_modes} onChange={v=>setProfile({...profile,availability_modes:v})}/>
      <label><strong>Aree in cui vuoi collaborare</strong><input value={profile.areas.join(", ")} onChange={e=>setProfile({...profile,areas:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} style={{width:"100%",marginTop:8,padding:12,borderRadius:12,border:"1px solid #d8d1c6"}} placeholder="Messina, Peloritani, Nebrodi, Eolie"/></label>
      <label><strong>Condizioni o informazioni importanti</strong><textarea value={profile.conditions_notes??""} onChange={e=>setProfile({...profile,conditions_notes:e.target.value})} rows={3} style={{width:"100%",marginTop:8,padding:12,borderRadius:12,border:"1px solid #d8d1c6"}} placeholder="Preavviso, minimi, limiti operativi o altre condizioni…"/></label>
      {canManage&&<div className="b2b-network__actions"><button className="button" onClick={save} disabled={saving}>{saving?"Salvataggio…":"Salva e trova compatibilità"}</button>{message&&<span style={{marginLeft:12}}>{message}</span>}</div>}
    </section>

    {profile.enabled&&<section className="b2b-network__matches"><div className="eyebrow">I TUOI MATCH</div><h2 style={{margin:"8px 0 18px"}}>{matches.length?`${matches.length} operatori compatibili trovati`:"Nessun match disponibile al momento"}</h2><div style={{display:"grid",gap:14}}>{matches.map(m=><article key={m.operator.id} style={{padding:18,border:"1px solid #ddd5c8",borderRadius:16,background:"#fff",display:"grid",gap:10}}><div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontSize:20}}>{m.operator.name}</strong>{m.operator.category&&<div style={{opacity:.7,marginTop:3}}>{m.operator.category}</div>}</div><strong style={{fontSize:22}}>{m.score}%</strong></div><div><strong>Perché è compatibile:</strong> cerchi {m.direct.map(x=>labels.get(x)??x).join(", ")}, che questo operatore offre.{m.reciprocal.length?` Inoltre cerca ${m.reciprocal.map(x=>labels.get(x)??x).join(", ")}, che rientra nella tua offerta.`:""}</div><div style={{fontSize:14,opacity:.75}}>Livello: {m.level==="molto_forte"?"match molto forte":m.level==="buono"?"buona compatibilità":"compatibilità potenziale"}</div>{canManage&&<div style={{marginTop:4}}><Link className="button" href={`/area-operatore/collaborazioni/nuova?operatorId=${encodeURIComponent(operatorId)}&partnerId=${encodeURIComponent(m.operator.id)}`}>Proponi una collaborazione</Link></div>}</article>)}</div></section>}
  </div>;
}
