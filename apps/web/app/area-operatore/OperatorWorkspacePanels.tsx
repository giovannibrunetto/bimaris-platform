"use client";

import { useState, type ReactNode } from "react";
import "./operator-workspace-panels.css";

type Tab = "home" | "experiences" | "profile" | "impact" | "collaborations";
type Props = {
 initialTab?: Tab;
 operatorSlug: string;
 experiences: ReactNode;
 profile: ReactNode;
 impact: ReactNode;
 collaborations?: ReactNode;
 collaborationCount: number;
};

export default function OperatorWorkspacePanels({
 initialTab="home",operatorSlug,experiences,profile,impact,collaborations,collaborationCount
}:Props){
 const [active,setActive]=useState<Tab>(initialTab);
 const actions=[
  {id:"profile" as Tab,title:"La mia attività",description:"Controlla i dati e proponi modifiche",symbol:"⌂"},
  {id:"experiences" as Tab,title:"Le mie esperienze",description:"Crea e gestisci le tue proposte",symbol:"✦"},
  {id:"impact" as Tab,title:"I miei risultati",description:"Scopri l'interesse verso la tua attività",symbol:"▥"},
  {id:"collaborations" as Tab,title:"Collaborazioni",description:"Richieste e opportunità con altri operatori",symbol:"◎"}
 ];
 const options=actions.filter(a=>a.id!=="collaborations"||Boolean(collaborations));
 const sequence=options.map(a=>a.id);
 const currentIndex=sequence.indexOf(active);
 const next=sequence[currentIndex+1];
 const nextLabel=actions.find(a=>a.id===next)?.title;
 return <div className="operator-workspace-panel operator-workspace-panel--simple">
  {active==="home"?<>
   <div className="operator-workspace-welcome">
    <div className="eyebrow">Cosa vuoi fare oggi?</div>
    <h2>Scegli da dove iniziare</h2>
    <p>Trovi tutto qui, senza dover cercare tra i menu.</p>
   </div>
   <nav className="operator-quick-actions" aria-label="Cosa vuoi fare nella tua area operatore">
    {options.map(a=><button key={a.id} className="operator-quick-action" type="button" onClick={()=>setActive(a.id)}>
       <span className="operator-quick-action__icon" aria-hidden="true">{a.symbol}</span>
       <strong>{a.title}</strong><small>{a.description}</small>
       {a.id==="collaborations"&&collaborationCount>0&&<span className="operator-quick-action__count">{collaborationCount} da leggere</span>}
       <span className="operator-quick-action__arrow" aria-hidden="true">→</span>
      </button>)}
   </nav>
  </>:<>
   <nav className="operator-simple-back" aria-label="Navigazione Area Operatore">
    <button type="button" className="operator-simple-back__button" onClick={()=>setActive("home")}>← Tutte le funzioni</button>
    <span>{actions.find(a=>a.id===active)?.title}</span><small className="operator-simple-back__progress">{currentIndex+1} di {sequence.length}</small>
   </nav>
   {active==="experiences"&&<div id="operator-tab-experiences" className="operator-workspace-content">{experiences}</div>}
   {active==="profile"&&<div id="operator-tab-profile" className="operator-workspace-content">{profile}</div>}
   {active==="impact"&&<div id="operator-tab-impact" className="operator-workspace-content">{impact}</div>}
   {active==="collaborations"&&collaborations&&<div id="operator-tab-collaborations" className="operator-workspace-content">{collaborations}</div>}
   {next&&<nav className="operator-simple-next" aria-label="Passa alla sezione successiva">
     <button type="button" className="operator-simple-next__button" onClick={()=>{setActive(next);window.scrollTo({top:0,behavior:"smooth"});}}> {nextLabel} →</button>
   </nav>}
  </>}
 </div>;
}
