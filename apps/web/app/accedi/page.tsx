"use client";
import Link from "next/link";
import { FormEvent,useEffect,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import PasswordAccess from "./PasswordAccess";
import { operatorOAuthEntryOrigin } from "@/lib/auth-redirect";

export default function AccediPage(){
 const [operatorEmail,setOperatorEmail]=useState("");
 const [operatorMessage,setOperatorMessage]=useState("");
 const [operatorMessageError,setOperatorMessageError]=useState(false);
 const [operatorLoading,setOperatorLoading]=useState(false);
 const [showOperatorLogin,setShowOperatorLogin]=useState(false);
 const [showOperatorMagicLink,setShowOperatorMagicLink]=useState(false);
 const [operatorDeepLink,setOperatorDeepLink]=useState(false);
 useEffect(()=>{
  const next=new URLSearchParams(window.location.search).get("next");
  if(next&&(next==="/area-operatore"||next.startsWith("/area-operatore?")||next.startsWith("/area-operatore/")||next.startsWith("/area-operatore#"))){
   setOperatorDeepLink(true);
   setShowOperatorLogin(true);
  }
 },[]);
 function feedback(message:string,isError=false){setOperatorMessage(message);setOperatorMessageError(isError)}
 function operatorReturnPath(){
  const requested=new URLSearchParams(window.location.search).get("next");
  return requested&&(requested==="/area-operatore"||requested.startsWith("/area-operatore?")||requested.startsWith("/area-operatore/")||requested.startsWith("/area-operatore#"))?requested:"/area-operatore";
 }

 async function openOperatorAccess(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setShowOperatorLogin(true);feedback("Accesso non disponibile in questo momento.",true);return;}
  setOperatorLoading(true);feedback("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {data:membership,error}=await supabase.from("operator_memberships").select("operator_id").eq("user_id",user.id).limit(1).maybeSingle();
   setOperatorLoading(false);
   if(!error&&membership){window.location.assign(operatorReturnPath());return;}
   setShowOperatorLogin(true);
   feedback("Questo account non è ancora associato a un'attività BIMARIS. Puoi usare un'altra email abilitata oppure proporre una nuova attività.",true);
   return;
  }
  setOperatorLoading(false);setShowOperatorLogin(true);
 }

 async function signInOperatorWithGoogle(){
  const canonicalOrigin=operatorOAuthEntryOrigin(window.location.origin);
  if(canonicalOrigin!==window.location.origin){
   window.location.assign(`${canonicalOrigin}/accedi?next=${encodeURIComponent(operatorReturnPath())}`);
   return;
  }

  const supabase=createBrowserSupabaseClient();
  if(!supabase){feedback("Accesso Google non disponibile.",true);return;}
  setOperatorLoading(true);feedback("");
  const callbackUrl=`${window.location.origin}/auth/callback?operator=1&next=${encodeURIComponent(operatorReturnPath())}`;
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:callbackUrl}});
  if(error){setOperatorLoading(false);feedback("Impossibile avviare l'accesso con Google. Riprova.",true);}
 }
 async function sendOperatorMagicLink(event:FormEvent){
  const canonicalOrigin=operatorOAuthEntryOrigin(window.location.origin);
  if(canonicalOrigin!==window.location.origin){
   window.location.assign(`${canonicalOrigin}/accedi?next=${encodeURIComponent(operatorReturnPath())}`);
   return;
  }

  event.preventDefault();const supabase=createBrowserSupabaseClient();
  if(!supabase){feedback("Accesso non disponibile in questo momento.",true);return;}
  setOperatorLoading(true);feedback("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {data:membership,error:membershipError}=await supabase.from("operator_memberships").select("operator_id").eq("user_id",user.id).limit(1).maybeSingle();
   setOperatorLoading(false);
   if(!membershipError&&membership){window.location.assign(operatorReturnPath());return;}
   feedback("Questo account non è ancora associato a un'attività BIMARIS. Esci dall'account se vuoi accedere con un'altra email operatore.",true);
   return;
  }
  const callbackUrl=`${window.location.origin}/auth/callback?operator=1&next=${encodeURIComponent(operatorReturnPath())}`;
  const {error}=await supabase.auth.signInWithOtp({email:operatorEmail.trim(),options:{emailRedirectTo:callbackUrl,shouldCreateUser:false}});
  setOperatorLoading(false);
  if(error){
   console.error("Operator magic-link error",{message:error.message,status:error.status,code:error.code});
   if(error.status===429){feedback("Hai richiesto troppi link in poco tempo. Attendi qualche minuto e riprova.",true);return;}
   feedback("Non è stato possibile inviare il link di accesso. Verifica l'indirizzo email o riprova tra poco.",true);
   return;
  }
  feedback("Controlla la tua email: ti abbiamo inviato il link per entrare nell'Area Operatore.");
 }

 return <><section className="ux-brand-05-hero ux-brand-05-hero--compact"><h1>Come vuoi usare BIMARIS?</h1><p>{operatorDeepLink?"Accedi per continuare dall'operazione BIMARIS che hai aperto.":"Scegli il percorso dedicato a te. L'accesso personale e quello degli operatori restano separati."}</p></section><div className="container access-gateway">
  <div className="access-gateway-grid">
   <section className="card access-gateway-card">
    <div><div className="kicker">Per te</div><h2>Utente</h2><p>Salva luoghi ed esperienze, costruisci il tuo BIMARIS e ricevi suggerimenti più vicini ai tuoi interessi.</p></div>
    <div className="access-gateway-actions"><Link className="button" href="/accedi/utente">Accedi o registrati come utente</Link></div>
    <p className="access-gateway-note">Se è il tuo primo accesso, potrai creare automaticamente il tuo account personale.</p>
   </section>
   <section className="card access-gateway-card">
    <div><div className="kicker">Per gli operatori</div><h2>Operatore</h2><p>Gestisci la tua attività e le esperienze collegate, oppure proponi a BIMARIS una nuova realtà o esperienza del territorio.</p></div>
    <div className="access-gateway-actions operator-entry-actions">
     <button className="button operator-entry-toggle" type="button" disabled={operatorLoading} aria-expanded={showOperatorLogin} aria-controls="operator-access-form" onClick={()=>showOperatorLogin?setShowOperatorLogin(false):void openOperatorAccess()}>{operatorLoading?"Verifica accesso…":showOperatorLogin?"Nascondi accesso":"Accedi come operatore"}</button>
    </div>
    {showOperatorLogin&&<div id="operator-access-form" className="operator-login-panel" style={{scrollMarginTop:105}}>
      <div className="operator-login-head"><div className="kicker">ACCESSO RISERVATO</div><h3>Entra nel tuo spazio</h3><p>Accedi con un account già abilitato alla gestione di un'attività BIMARIS.</p></div>
      {operatorMessage&&!showOperatorMagicLink&&<p className="access-status" role={operatorMessageError?"alert":"status"} aria-live="polite">{operatorMessage}</p>}
      <button type="button" className="operator-google-button" disabled={operatorLoading} onClick={()=>void signInOperatorWithGoogle()}><span className="operator-google-mark" aria-hidden="true">G</span><span>Continua con Google</span></button>
      <div className="operator-login-divider"><span>oppure con email e password</span></div>
      <PasswordAccess context="operator"/>
      <div className="operator-alternative-login">
       <button type="button" className="operator-link-toggle" aria-expanded={showOperatorMagicLink} aria-controls="operator-magic-link-form" onClick={()=>setShowOperatorMagicLink(v=>!v)}>{showOperatorMagicLink?"Nascondi accesso tramite email":"Preferisci ricevere un link di accesso?"}</button>
       {showOperatorMagicLink&&<form id="operator-magic-link-form" onSubmit={sendOperatorMagicLink} className="operator-access-form" aria-busy={operatorLoading}>
        <label htmlFor="operator-email"><strong>Email associata all'attività</strong></label>
        <input id="operator-email" name="email" type="email" autoComplete="email" inputMode="email" required value={operatorEmail} onChange={e=>setOperatorEmail(e.target.value)} placeholder="email@attivita.it"/>
        <button className="button" type="submit" disabled={operatorLoading}>{operatorLoading?"Verifica…":"Ricevi il link per l'Area Operatore"}</button>
        {operatorMessage&&<p role={operatorMessageError?"alert":"status"} aria-live="polite" className="access-status">{operatorMessage}</p>}
       </form>}
      </div>
    </div>}
    <p className="operator-registration"><Link href="/operatori/candidatura">Non fai ancora parte della rete? Proponi la tua attività →</Link></p>
    <p className="access-gateway-note">Le nuove proposte vengono valutate da BIMARIS prima dell'attivazione dell'Area Operatore.</p>
   </section>
  </div><p className="access-gateway-back"><Link href="/">← Torna a BIMARIS</Link></p>
 </div>
  <style jsx global>{`
   .access-gateway-card .operator-entry-actions{margin:18px 0 0}
   .access-gateway-card .operator-entry-toggle{width:100%;min-height:48px;border-radius:14px}
   .operator-login-panel{margin-top:17px;padding:clamp(18px,3vw,28px);border:1px solid #d7cdb8;border-radius:21px;background:#f4f1ea;box-shadow:0 9px 25px rgba(7,35,38,.045)}
   .operator-login-head{margin-bottom:19px}
   .operator-login-head .kicker{font-size:11px;letter-spacing:.16em;color:#95662e}
   .operator-login-head h3{font:normal clamp(24px,3vw,30px) Georgia,serif;color:#0b3035;margin:7px 0}
   .operator-login-head p{color:#526768;font-size:14px;line-height:1.45;margin:0}
   .operator-google-button{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:49px;border:1px solid #c8bda5;background:#fff;color:#0b3035;font:inherit;font-weight:750;border-radius:13px;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .2s}
   .operator-google-mark{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#f4f5f3;font-weight:850;color:#4285f4;font-family:Arial,sans-serif;font-size:19px}
   .operator-google-button:hover{border-color:#caa86a;box-shadow:0 6px 18px rgba(9,42,46,.11);transform:translateY(-1px)}
   .operator-google-button:disabled{opacity:.6;cursor:wait}
   .operator-google-button:focus-visible,.operator-link-toggle:focus-visible,.operator-registration a:focus-visible{outline:2px solid #9b713a;outline-offset:3px}
   .operator-login-divider{display:flex;align-items:center;gap:13px;margin:20px 0;color:#68777a;font-size:12px;white-space:nowrap}
   .operator-login-divider:before,.operator-login-divider:after{content:"";height:1px;flex:1;background:#d8d2c7}
   .operator-alternative-login{border-top:1px solid #ddd7ca;margin-top:19px;padding-top:15px}
   .operator-link-toggle{background:transparent;border:0;color:#80551f;text-decoration:underline;text-underline-offset:3px;padding:5px 0;text-align:left;cursor:pointer;font:inherit;font-size:13px;font-weight:700}
   .operator-alternative-login .operator-access-form{margin-top:13px}
   .operator-alternative-login .operator-access-form input{border-radius:11px}
   .operator-registration{margin:18px 0 8px!important;font-size:13px}
   .operator-registration a{color:#80551f;text-decoration:underline;text-underline-offset:3px;font-weight:700}
   @media(max-width:650px){.operator-login-panel{padding:18px 15px}.operator-login-divider{gap:8px;font-size:11px}}
   @media(prefers-reduced-motion:reduce){.operator-google-button{transition:none;transform:none!important}}
  `}</style>
</>;
}
