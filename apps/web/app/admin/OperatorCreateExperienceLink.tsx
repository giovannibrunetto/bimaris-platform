"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
export default function OperatorCreateExperienceLink(){const pathname=usePathname();useEffect(()=>{if(!/^\/admin\/operatori\/[^/]+$/.test(pathname))return;const header=document.querySelector("header");const actions=header?.querySelector(".actions");if(!actions||actions.querySelector('[data-create-for-operator="true"]'))return;const id=pathname.split("/").filter(Boolean).pop();if(!id)return;const a=document.createElement("a");a.href=`/admin/esperienze/nuova?operator=${encodeURIComponent(id)}&mode=on-behalf`;a.className="button ghost";a.dataset.createForOperator="true";a.textContent="+ Crea per conto";actions.insertBefore(a,actions.firstChild);},[pathname]);return null}
