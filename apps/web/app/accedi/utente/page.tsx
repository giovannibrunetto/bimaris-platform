"use client";
import Link from "next/link";
import { FormEvent,useEffect,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getAuthCallback(){
 const origin=window.location.origin;
 return `${origin}/auth/callback?next=${encodeURIComponent("/profilo")}`;
}

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
  const callback=getAuthCallback();
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:callback}});
  if(error){setGoogleLoading(false);setMessage("Accesso con Google non ancora disponibile. Riprova più tardi.");}
 }

 async function sendMagicLink(event:FormEvent){
  event.preventDefault();
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setLoading(true);setMessage("");
  const callback=getAuthCallback();
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callback}});
  setLoading(false);
  setMessage(error?"Non è stato possibile inviare il link. Riprova.":"Controlla la tua email: ti abbiamo inviato il link per accedere a BIMARIS.");
 }

 return <main className="personal-access user-access-centered">
  <div className="personal-access-home-visual" aria-hidden="true"><img src="/brand/bimaris-main.jpeg" alt=""/></div>
  <div className="personal-access-shade" aria-hidden="true"/>
  <section className="personal-access-shell">
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
   .user-access-centered{background:#06111a}
   .user-access-centered .personal-access-home-visual{position:absolute;inset:0;overflow:hidden;background:#06111a}
   .user-access-centered .personal-access-home-visual img{width:100%;height:100%;display:block;object-fit:cover;object-position:center;filter:saturate(.72) contrast(1.04);opacity:.44;transform:scale(1.035)}
   .user-access-centered .personal-access-shade{background:linear-gradient(180deg,rgba(2,10,16,.52) 0%,rgba(2,10,16,.66) 42%,rgba(2,10,16,.88) 100%),radial-gradient(circle at 50% 34%,rgba(5,26,38,.12),rgba(2,9,15,.54) 72%)}
   .user-access-centered .personal-access-shell{width:min(980px,100%);align-items:center;justify-content:center;padding:36px 24px 38px;text-align:center}
   .user-access-centered .personal-access-content{width:min(650px,100%);margin:auto;padding:22px 0 16px;text-align:center}
   .user-access-centered .personal-access-content::before{content:"BIMARIS";display:block;margin:0 auto 26px;color:#e6c785;font:600 clamp(18px,2.1vw,25px) Georgia,serif;letter-spacing:.28em;text-indent:.28em;text-shadow:0 2px 18px rgba(0,0,0,.45)}
   .user-access-centered .personal-access-content h1{font-size:clamp(48px,6vw,76px);line-height:1.02;margin:10px auto 18px;text-shadow:0 3px 24px rgba(0,0,0,.35)}
   .user-access-centered .personal-access-intro{max-width:620px;margin:0 auto 28px;color:#edf2f4;text-shadow:0 2px 12px rgba(0,0,0,.45)}
   .user-access-centered .personal-access-panel{width:min(590px,100%);margin:0 auto;text-align:left;background:rgba(4,18,28,.76);border-color:rgba(255,255,255,.2);box-shadow:0 24px 80px rgba(0,0,0,.38)}
   .user-access-centered .personal-access-back{margin-top:20px;color:#e0e7ea;text-shadow:0 2px 10px rgba(0,0,0,.5)}
   @media(max-width:700px){
    .user-access-centered .personal-access-home-visual img{object-position:center;opacity:.38;transform:scale(1.08)}
    .user-access-centered .personal-access-shell{display:flex;justify-content:center;padding:22px 18px max(24px,env(safe-area-inset-bottom))}
    .user-access-centered .personal-access-content{margin:auto;padding:0}
    .user-access-centered .personal-access-content::before{margin-bottom:22px;font-size:18px}
    .user-access-centered .personal-access-content h1{font-size:clamp(40px,11vw,52px);line-height:1}
    .user-access-centered .personal-access-intro{max-width:96%;font-size:14px}
    .user-access-centered .personal-access-panel{text-align:left}
   }
  `}</style>
 </main>;
}
