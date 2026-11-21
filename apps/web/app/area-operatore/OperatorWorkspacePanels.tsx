"use client";

import { useState, type ReactNode } from "react";
import "./operator-workspace-panels.css";

type Tab = "experiences" | "profile" | "impact" | "collaborations";
type Props = {
 initialTab?: Tab;
 experiences: ReactNode;
 profile: ReactNode;
 impact: ReactNode;
 collaborations?: ReactNode;
 collaborationCount: number;
};

export default function OperatorWorkspacePanels({initialTab="profile",experiences,profile,impact,collaborations,collaborationCount}:Props){
 const [active,setActive]=useState<Tab>(initialTab);
 const tabs: {id:Tab;label:string;count?:number}[] = [
  {id:"profile",label:"Profilo"},
  {id:"experiences",label:"Esperienze"},
  ...(collaborations ? [{id:"collaborations" as Tab,label:"Collaborazioni",count:collaborationCount}] : []),
  {id:"impact",label:"Statistiche"},
 ];
 return <div className="operator-workspace-panel">
  <nav className="operator-workspace-tabs" aria-label="Funzioni dell'Area Operatore">
   {tabs.map(tab=><button key={tab.id} type="button" className="operator-workspace-tabs__button" aria-current={active===tab.id?"page":undefined} aria-controls={`operator-tab-${tab.id}`} onClick={()=>setActive(tab.id)}>{tab.label}{tab.count? <span className="operator-workspace-tabs__count">{tab.count}</span>:null}</button>)}
  </nav>
  <div id="operator-tab-experiences" className="operator-workspace-content" hidden={active!=="experiences"}>{experiences}</div>
  <div id="operator-tab-profile" className="operator-workspace-content" hidden={active!=="profile"}>{profile}</div>
  <div id="operator-tab-impact" className="operator-workspace-content" hidden={active!=="impact"}>{impact}</div>
  {collaborations&&<div id="operator-tab-collaborations" className="operator-workspace-content" hidden={active!=="collaborations"}>{collaborations}</div>}
 </div>;
}
