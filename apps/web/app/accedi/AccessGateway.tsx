"use client";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import PasswordAccess from "./PasswordAccess";
import SignInShell from "./SignInShell";

export default function AccessGateway({operatorDestination}:{operatorDestination?:string}){
 const [operatorEmail,setOperatorEmail]=useState("");
 const [operatorMessage,setOperatorMessage]=useState("");
 const [operatorMessageError,setOperatorMessageError]=useState(false);
 const [operatorLoading,setOperatorLoading]=useState(false);
 const operatorDeepLink=Boolean(operatorDestination);
 const [showOperatorMagicLink,setShowOperatorMagicLink]=useState(false);
 function feedback(message:string,isError=false){setOperatorMessage(message);setOperatorMessageError(isError)}
 function operatorReturnPath(){return operatorDestination ?? "/area-operatore";}

 async function signInOperatorWithGoogle(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){feedback("Accesso Google non disponibile.",true);return;}
  setOperatorLoading(true);feedback("");
  const callbackUrl=`${window.location.origin}/auth/callback?operator=1&next=${encodeURIComponent(operatorReturnPath())}`;
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:callbackUrl}});
  if(error){setOperatorLoading(false);feedback("Impossibile avviare l'accesso con Google. Riprova.",true);}
 }
 async function sendOperatorMagicLink(event:FormEvent){
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

 if(operatorDeepLink) return <SignInShell kicker="Area Operatore" title="Accedi come operatore" description="Entra con l’account abilitato per gestire la tua attività e le esperienze su BIMARIS." busy={operatorLoading}>
      {operatorMessage&&!showOperatorMagicLink&&<p className="personal-access-message" role={operatorMessageError?"alert":"status"} aria-live="polite">{operatorMessage}</p>}
      <button type="button" className="personal-google" disabled={operatorLoading} onClick={()=>void signInOperatorWithGoogle()}><span className="google-mark" aria-hidden="true">G</span><span>Continua con Google</span></button>
      <div className="personal-divider"><span>oppure con email e password</span></div>
      <PasswordAccess context="operator"/>
      <div className="operator-alternative-login">
       <button type="button" className="operator-link-toggle" aria-expanded={showOperatorMagicLink} aria-controls={showOperatorMagicLink?"operator-magic-link-form":undefined} onClick={()=>setShowOperatorMagicLink(v=>!v)}>{showOperatorMagicLink?"Nascondi accesso tramite email":"Preferisci ricevere un link di accesso?"}</button>
       {showOperatorMagicLink&&<form id="operator-magic-link-form" onSubmit={sendOperatorMagicLink} className="personal-email-form" aria-busy={operatorLoading}>
        <label htmlFor="operator-email"><strong>Email associata all'attività</strong></label>
        <input id="operator-email" name="email" type="email" autoComplete="email" inputMode="email" required value={operatorEmail} onChange={e=>setOperatorEmail(e.target.value)} placeholder="email@attivita.it"/>
        <button className="personal-email-button" type="submit" disabled={operatorLoading}>{operatorLoading?"Verifica…":"Ricevi il link per l'Area Operatore"}</button>
        {operatorMessage&&<p role={operatorMessageError?"alert":"status"} aria-live="polite" className="personal-access-message">{operatorMessage}</p>}
       </form>}
      </div>
  <p className="operator-registration"><Link href="/operatori/candidatura">Proponi la tua attività</Link></p>
  <style jsx>{`
   .operator-alternative-login{margin-top:14px}
   .operator-link-toggle,.operator-registration :global(a){color:#e6c785;text-decoration:underline;text-underline-offset:3px;font:inherit;font-size:14px;font-weight:750}
   .operator-link-toggle{padding:5px 0;border:0;background:none;cursor:pointer;text-align:left}
   .operator-alternative-login .personal-email-form{margin-top:12px}
   .operator-registration{margin:16px 0 0}
  `}</style>
 </SignInShell>;

 return <><section className="ux-brand-05-hero ux-brand-05-hero--compact"><h1>Come vuoi usare BIMARIS?</h1><p>Scegli se accedere come utente o come operatore.</p></section><div className="container access-gateway">
  <div className="access-gateway-grid">
   <section className="card access-gateway-card">
    <div><div className="kicker">Per te</div><h2>Utente</h2><p>Salva luoghi ed esperienze, costruisci il tuo BIMARIS e ricevi suggerimenti più vicini ai tuoi interessi.</p></div>
    <div className="access-gateway-actions"><Link className="button" href="/accedi/utente">Accedi o registrati come utente</Link></div>
    <p className="access-gateway-note">Se è il tuo primo accesso, potrai creare automaticamente il tuo account personale.</p>
   </section>
   <section className="card access-gateway-card">
    <div><div className="kicker">Per gli operatori</div><h2>Operatore</h2><p>Gestisci la tua attività e le esperienze collegate, oppure proponi a BIMARIS una nuova realtà o esperienza del territorio.</p></div>
    <div className="access-gateway-actions operator-entry-actions">
     <Link className="button operator-entry-toggle" href="/accedi/operatore">Accedi come operatore</Link>
    </div>
    <p className="operator-registration"><Link href="/operatori/candidatura">Non fai ancora parte della rete? Proponi la tua attività →</Link></p>
    <p className="access-gateway-note">Le nuove proposte vengono valutate da BIMARIS prima dell'attivazione dell'Area Operatore.</p>
   </section>
  </div><p className="access-gateway-back"><Link href="/">← Torna a BIMARIS</Link></p>
 </div>
  <style jsx global>{`
   .access-gateway-card .operator-entry-actions{margin:18px 0 0}
   .access-gateway-card .operator-entry-toggle{width:100%;min-height:48px;border-radius:14px}
  `}</style>
</>;
}
