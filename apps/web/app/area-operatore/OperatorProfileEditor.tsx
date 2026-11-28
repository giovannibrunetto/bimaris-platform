"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type OperatorProfile={id:string;name:string;category:string|null;address:string|null;phone:string|null;whatsapp:string|null;email:string|null;website:string|null;instagram:string|null};
const fieldStyle={display:"grid",gap:7,fontSize:13,fontWeight:700,minWidth:0,color:"var(--ink)"} as const;
const inputStyle={width:"100%",boxSizing:"border-box" as const,minWidth:0,padding:"13px 14px",border:"1px solid var(--line)",borderRadius:12,background:"#fff",font:"inherit",fontWeight:400,color:"var(--ink)",boxShadow:"inset 0 1px 0 rgba(255,255,255,.8)"};
export default function OperatorProfileEditor({operator,pending}:{operator:OperatorProfile;pending:boolean}){
 const searchParams=useSearchParams();
 const [open,setOpen]=useState(searchParams.get("editProfile")===operator.id);
 const formId=`profilo-operatore-form-${operator.id}`;
 const sectionRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!open||pending)return;
  const frame=requestAnimationFrame(()=>{
   const section=sectionRef.current;
   if(!section)return;
   const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   section.scrollIntoView({behavior:reducedMotion?"instant":"smooth",block:"start"});
  });
  return ()=>cancelAnimationFrame(frame);
 },[open,pending]);
 const summaryRows=[
  ["Categoria",operator.category],
  ["Indirizzo",operator.address],
  ["Telefono",operator.phone],
 ];
 const additionalRows=[
  ["WhatsApp",operator.whatsapp],
  ["Email",operator.email],
  ["Sito web",operator.website],
  ["Instagram",operator.instagram],
 ];

 return <section ref={sectionRef} id={`profilo-operatore-${operator.id}`} className="operator-profile-card operator-profile-card--overview" style={{scrollMarginTop:"clamp(84px, 12vh, 132px)"}}>
   <div className="operator-profile-card__head">
     <div><div className="eyebrow">Scheda attività</div><h2>Il tuo profilo</h2>{pending&&<p>Proposta di modifica in valutazione. Sono mostrati i dati approvati.</p>}</div>
     <button className={open?"button action-cancel":"button action-open"} type="button" disabled={pending} aria-expanded={open&&!pending} aria-controls={formId} onClick={()=>setOpen(v=>!v)}>{pending?"Modifiche in valutazione":open?"Annulla modifiche":"Proponi modifiche"}</button>
   </div>
   {!open&&<div className="operator-profile-compact">
    <dl className="operator-profile-overview operator-profile-overview--summary">{summaryRows.map(([label,value])=><div key={label} className="operator-profile-overview__item"><dt>{label}</dt><dd>{value||"Non indicato"}</dd></div>)}</dl>
    <details className="operator-profile-more"><summary>Altri contatti e informazioni</summary>
      <dl className="operator-profile-overview">{additionalRows.map(([label,value])=><div key={label} className="operator-profile-overview__item"><dt>{label}</dt><dd>{value||"Non indicato"}</dd></div>)}</dl>
    </details>
  </div>}
   {open&&!pending&&<div id={formId} className="operator-profile-card__form"><div style={{marginBottom:22}}><div className="eyebrow">Il tuo racconto essenziale</div><p style={{margin:"7px 0 0",color:"var(--muted)"}}>Questi dati alimentano la tua presenza pubblica su BIMARIS. Mantienili autentici, chiari e aggiornati.</p></div><form method="post" action="/api/operator/profile-revisions"><div className="operator-profile-fields" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"20px 22px"}}><input type="hidden" name="operator_id" value={operator.id}/><label style={fieldStyle}><span>Nome della realtà</span><input style={inputStyle} name="name" autoComplete="organization" defaultValue={operator.name} required maxLength={200}/></label><label style={fieldStyle}><span>Categoria</span><input style={inputStyle} name="category" defaultValue={operator.category??""} maxLength={120}/></label><label style={{...fieldStyle,gridColumn:"1 / -1"}}><span>Dove trovarti</span><input style={inputStyle} name="address" autoComplete="street-address" defaultValue={operator.address??""} maxLength={300}/></label><label style={fieldStyle}><span>Telefono</span><input style={inputStyle} name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={operator.phone??""} maxLength={80}/></label><label style={fieldStyle}><span>WhatsApp</span><input style={inputStyle} name="whatsapp" type="tel" inputMode="tel" defaultValue={operator.whatsapp??""} maxLength={80}/></label><label style={fieldStyle}><span>Email pubblica di contatto</span><input style={inputStyle} name="email" type="email" autoComplete="email" inputMode="email" defaultValue={operator.email??""} maxLength={200}/></label><label style={fieldStyle}><span>Sito web</span><input style={inputStyle} name="website" type="url" autoComplete="url" inputMode="url" defaultValue={operator.website??""} maxLength={300}/></label><label style={fieldStyle}><span>Instagram</span><input style={inputStyle} name="instagram" defaultValue={operator.instagram??""} maxLength={200}/></label></div><div className="operator-profile-submit"><div style={{maxWidth:650}}><strong style={{display:"block",marginBottom:4}}>BIMARIS protegge la qualità della tua scheda</strong><span style={{fontSize:14,color:"var(--muted)",lineHeight:1.5}}>Gli aggiornamenti saranno verificati prima di diventare visibili ai viaggiatori.</span></div><button className="button" type="submit">Proponi gli aggiornamenti</button></div></form></div>}</section>;
}
