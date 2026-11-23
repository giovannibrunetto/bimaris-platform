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
 return <div className="operator-workspace-panel operator-workspace-panel--simple">
  {active==="home"?<>
   <div className="operator-workspace-welcome">
    <div className="eyebrow">Cosa vuoi fare oggi?</div>
    <h2>Scegli da dove iniziare</h2>
    <p>Trovi tutto qui, senza dover cercare tra i menu.</p>
   </div>
   <nav className="operator-quick-actions" aria-label="Cosa vuoi fare nella tua area operatore">
    {actions.map(a=>a.id==="collaborations"&&!collaborations
     ?<a key={a.id} className="operator-quick-action" href={`/area-operatore/network-b2b?operatore=${encodeURIComponent(operatorSlug)}`}>
       <span className="operator-quick-action__icon" aria-hidden="true">{a.symbol}</span>
       <strong>{a.title}</strong><small>{a.description}</small>
       <span className="operator-quick-action__arrow" aria-hidden="true">→</span>
      </a>
     :<button key={a.id} className="operator-quick-action" type="button" onClick={()=>setActive(a.id)}>
       <span className="operator-quick-action__icon" aria-hidden="true">{a.symbol}</span>
       <strong>{a.title}</strong><small>{a.description}</small>
       {a.id==="collaborations"&&collaborationCount>0&&<span className="operator-quick-action__count">{collaborationCount} da leggere</span>}
       <span className="operator-quick-action__arrow" aria-hidden="true">→</span>
      </button>
    )}
   </nav>
  </>:<>
   <nav className="operator-simple-back" aria-label="Navigazione Area Operatore">
    <button type="button" className="operator-simple-back__button" onClick={()=>setActive("home")}>← Tutte le funzioni</button>
    <span>{actions.find(a=>a.id===active)?.title}</span>
   </nav>
   {active==="experiences"&&<div id="operator-tab-experiences" className="operator-workspace-content">{experiences}</div>}
   {active==="profile"&&<div id="operator-tab-profile" className="operator-workspace-content">{profile}</div>}
   {active==="impact"&&<div id="operator-tab-impact" className="operator-workspace-content">{impact}</div>}
   {active==="collaborations"&&collaborations&&<div id="operator-tab-collaborations" className="operator-workspace-content">{collaborations}</div>}
   <nav className="operator-simple-other" aria-label="Altre sezioni">
    {options.filter(a=>a.id!==active).map(a=><button key={a.id} type="button" onClick={()=>setActive(a.id)}>{a.title}</button>)}
   </nav>
  </>}
 </div>;
}
