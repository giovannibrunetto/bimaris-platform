"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

const labels:Record<string,string>={draft:"Bozza",pending:"In revisione",rejected:"Correzioni richieste",approved:"Approvata",applied:"Approvata"};

export default function RevisionHistoryLabels(){
 const pathname=usePathname();
 useEffect(()=>{
  if(!pathname.startsWith("/admin/esperienze/"))return;
  for(const details of Array.from(document.querySelectorAll("details"))){
   const summary=details.querySelector("summary");
   if(!summary?.textContent?.includes("Cronologia revisioni"))continue;
   for(const strong of Array.from(details.querySelectorAll("strong"))){
    const raw=(strong.textContent??"").trim();
    if(labels[raw])strong.textContent=labels[raw];
   }
   for(const row of Array.from(details.querySelectorAll("div > div"))){
    for(const node of Array.from(row.childNodes)){
     if(node.nodeType===Node.TEXT_NODE&&node.textContent?.includes(" · applicata "))node.textContent=node.textContent.replace(" · applicata "," · approvata ");
    }
   }
  }
 },[pathname]);
 return null;
}
