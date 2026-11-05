"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

/**
 * Honor explicit admin action deep links without changing generic dossier opens.
 * The double frame waits for the destination to render; the scroll margin
 * keeps the target below the fixed public navigation.
 */
export default function AdminActionFocus(){
 const pathname=usePathname();
 useEffect(()=>{
  let first=0,second=0;
  const focusAction=()=>{
   const hash=window.location.hash;
   if(!hash||!/^#admin-(decision|review-decision)$/.test(hash))return;
   const target=document.getElementById(hash.slice(1));
   if(!target)return;
   target.scrollIntoView({block:"start",behavior:"instant"});
  };
  first=window.requestAnimationFrame(()=>{
   second=window.requestAnimationFrame(focusAction);
  });
  window.addEventListener("hashchange",focusAction);
  return()=>{window.cancelAnimationFrame(first);window.cancelAnimationFrame(second);window.removeEventListener("hashchange",focusAction)};
 },[pathname]);
 return null;
}
