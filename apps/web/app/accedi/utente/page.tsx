"use client";
import SignInShell from "../SignInShell";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import PasswordAccess from "../PasswordAccess";

function getAuthCallback(){
 const origin=window.location.origin;
 return `${origin}/auth/callback?next=${encodeURIComponent("/profilo")}`;
}

export default function AccessoUtentePage(){
 const [message,setMessage]=useState("");
 const [googleLoading,setGoogleLoading]=useState(false);

 async function signInWithGoogle(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setGoogleLoading(true);setMessage("");
  const callback=getAuthCallback();
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:callback}});
  if(error){setGoogleLoading(false);setMessage("Accesso con Google non disponibile in questo momento. Riprova più tardi.");}
 }

 return <SignInShell kicker="Il tuo BIMARIS" title={<>Messina,<br/>come vuoi viverla tu.</>} description="Entra nel tuo spazio personale per salvare luoghi ed esperienze e lasciare che BIMARIS impari ciò che ti interessa." busy={googleLoading}>
     <button className="personal-google" type="button" onClick={signInWithGoogle} disabled={googleLoading}>
      <span aria-hidden="true" className="google-mark">G</span>
      {googleLoading?"Connessione a Google…":"Continua con Google"}
     </button>
     <div className="personal-divider"><span>oppure con email e password</span></div>
     {message&&<p role="status" aria-live="polite" className="personal-access-message">{message}</p>}
     <PasswordAccess context="utente"/>
 </SignInShell>;
}
