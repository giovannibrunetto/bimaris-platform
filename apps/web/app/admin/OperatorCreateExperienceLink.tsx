"use client";
import {useEffect} from "react";
import {usePathname,useSearchParams} from "next/navigation";

export default function OperatorCreateExperienceLink(){
 const pathname=usePathname();
 const searchParams=useSearchParams();
 useEffect(()=>{
  if(!/^\/admin\/operatori\/[^/]+$/.test(pathname))return;
  const tab=searchParams.get("tab")??"esperienze";
  if(tab!=="esperienze")return;
  if(document.querySelector('[data-create-for-operator="true"]'))return;
  const id=pathname.split("/").filter(Boolean).pop();
  if(!id)return;
  const heading=[...document.querySelectorAll("h2")].find(el=>el.textContent?.trim()==="Esperienze");
  if(!heading)return;
  const row=document.createElement("div");
  row.style.display="flex";
  row.style.alignItems="center";
  row.style.justifyContent="space-between";
  row.style.gap="16px";
  row.style.flexWrap="wrap";
  row.style.margin="5px 0 4px";
  heading.parentElement?.insertBefore(row,heading);
  row.appendChild(heading);
  (heading as HTMLElement).style.margin="0";
  const a=document.createElement("a");
  a.href=`/admin/esperienze/nuova?operator=${encodeURIComponent(id)}&mode=on-behalf`;
  a.className="button ghost";
  a.dataset.createForOperator="true";
  a.textContent="+ Crea per conto dell'operatore";
  a.style.whiteSpace="nowrap";
  row.appendChild(a);
 },[pathname,searchParams]);
 return null;
}
