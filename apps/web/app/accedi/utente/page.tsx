"use client";
import Link from "next/link";
import { FormEvent,useEffect,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const PUBLIC_SITE_URL="https://www.bimarisnet.it";

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
  const callback=`${PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent("/profilo")}`;
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:callback}});
  if(error){setGoogleLoading(false);setMessage("Accesso con Google non ancora disponibile. Riprova più tardi.");}
 }

 async function sendMagicLink(event:FormEvent){
  event.preventDefault();
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setLoading(true);setMessage("");
  const callback=`${PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent("/profilo")}`;
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callback}});
  setLoading(false);
  setMessage(error?"Non è stato possibile inviare il link. Riprova.":"Controlla la tua email: ti abbiamo inviato il link per accedere a BIMARIS.");
 }

 return <main className="personal-access user-access-centered">
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
  <style jsx global>{`
   .user-access-centered .personal-access-shade{background:radial-gradient(circle at 50% 38%,rgba(2,9,15,.08),rgba(2,9,15,.48) 72%,rgba(2,9,15,.7) 100%)}
   .user-access-centered .personal-access-shell{width:min(980px,100%);align-items:center;padding:28px 24px 38px;text-align:center}
   .user-access-centered .personal-access-brand{width:clamp(190px,22vw,280px);height:92px;margin:0 auto 22px;display:flex;justify-content:center;overflow:hidden;border-radius:14px}
   .user-access-centered .personal-access-brand img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}
   .user-access-centered .personal-access-content{width:min(650px,100%);margin:auto;padding:10px 0 16px;text-align:center}
   .user-access-centered .personal-access-content h1{font-size:clamp(48px,6vw,76px);line-height:1.02;margin:10px auto 18px}
   .user-access-centered .personal-access-intro{max-width:620px;margin:0 auto 28px}
   .user-access-centered .personal-access-panel{width:min(590px,100%);margin:0 auto;text-align:left}
   .user-access-centered .personal-access-back{margin-top:20px}
   @media(max-width:700px){
    .user-access-centered .personal-access-shell{display:flex;padding:18px 18px max(24px,env(safe-area-inset-bottom))}
    .user-access-centered .personal-access-brand{width:180px;height:76px;margin:0 auto 24px}
    .user-access-centered .personal-access-content{margin:0 auto;padding:0}
    .user-access-centered .personal-access-content h1{font-size:clamp(40px,11vw,52px);line-height:1}
    .user-access-centered .personal-access-intro{max-width:96%;font-size:14px}
    .user-access-centered .personal-access-panel{text-align:left}
   }
  `}</style>
 </main>;
}
