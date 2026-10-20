"use client";
import Link from "next/link";
import { FormEvent,useEffect,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AccessoUtentePage(){
 const [email,setEmail]=useState("");
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 const [googleLoading,setGoogleLoading]=useState(false);

 useEffect(()=>{
  document.body.classList.add("personal-access-active");
  return()=>document.body.classList.remove("personal-access-active");
 },[]);

 async function signInWithGoogle(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setGoogleLoading(true);setMessage("");
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent("/profilo")}`}});
  if(error){setGoogleLoading(false);setMessage("Accesso con Google non ancora disponibile. Riprova più tardi.");}
 }

 async function sendMagicLink(event:FormEvent){
  event.preventDefault();
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setLoading(true);setMessage("");
  const callback=`${window.location.origin}/auth/callback?next=${encodeURIComponent("/profilo")}`;
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callback}});
  setLoading(false);
  setMessage(error?"Non è stato possibile inviare il link. Riprova.":"Controlla la tua email: ti abbiamo inviato il link per accedere a BIMARIS.");
 }

 return <main className="personal-access">
  <div className="personal-access-bg" aria-hidden="true"/>
  <div className="personal-access-shade" aria-hidden="true"/>
  <section className="personal-access-shell">
   <div className="personal-access-brand">
    <img src="/brand/bimaris-main.jpeg" alt="BIMARIS — Messina da vivere"/>
   </div>

   <div className="personal-access-content">
    <div className="kicker">Il tuo BIMARIS</div>
    <h1>Messina,<br/>come vuoi viverla tu.</h1>
    <p className="personal-access-intro">Entra nel tuo spazio personale per salvare luoghi ed esperienze e lasciare che BIMARIS impari ciò che ti interessa.</p>

    <div className="personal-access-panel">
     <button className="personal-google" type="button" onClick={signInWithGoogle} disabled={googleLoading}>
      <span aria-hidden="true" className="google-mark">G</span>
      {googleLoading?"Connessione a Google…":"Continua con Google"}
     </button>
     <div className="personal-divider"><span>oppure con email</span></div>
     <form onSubmit={sendMagicLink} className="personal-email-form">
      <label htmlFor="user-email">Email</label>
      <input id="user-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.it"/>
      <button className="personal-email-button" type="submit" disabled={loading}>{loading?"Invio…":"Ricevi il link di accesso"}</button>
     </form>
     {message&&<p role="status" className="personal-access-message">{message}</p>}
     <p className="personal-access-note">Al primo accesso il tuo account personale viene creato automaticamente.</p>
    </div>
    <Link className="personal-access-back" href="/accedi">← Scegli un altro tipo di accesso</Link>
   </div>
  </section>
 </main>;
}
