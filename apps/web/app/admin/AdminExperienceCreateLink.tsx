"use client";
import {useEffect} from "react";
export default function AdminExperienceCreateLink(){useEffect(()=>{const rewrite=()=>{for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href="/admin/esperienze#crea-esperienza"]')))link.href="/admin/esperienze/nuova"};rewrite();const observer=new MutationObserver(rewrite);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);return null}
