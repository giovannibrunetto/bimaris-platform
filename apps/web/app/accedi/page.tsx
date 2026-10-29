"use client";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AccediPage(){
 const [operatorEmail,setOperatorEmail]=useState("");
 const [operatorMessage,setOperatorMessage]=useState("");
 const [operatorLoading,setOperatorLoading]=useState(false);
 const [showOperatorLogin,setShowOperatorLogin]=useState(false);

 async function openOperatorAccess(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setShowOperatorLogin(true);setOperatorMessage("Accesso non disponibile in questo momento.");return;}
  setOperatorLoading(true);setOperatorMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {data:membership,error}=await supabase.from("operator_memberships").select("operator_id").eq("user_id",user.id).limit(1).maybeSingle();
   setOperatorLoading(false);
   if(!error&&membership){window.location.assign("/area-operatore");return;}
   setShowOperatorLogin(true);
   setOperatorMessage("Questo account non è ancora associato a un'attività BIMARIS. Puoi usare un'altra email abilitata oppure proporre una nuova attività.");
   return;
  }
  setOperatorLoading(false);setShowOperatorLogin(true);
 }

 async function sendOperatorMagicLink(event:FormEvent){
  event.preventDefault();const supabase=createBrowserSupabaseClient();
  if(!supabase){setOperatorMessage("Accesso non disponibile in questo momento.");return;}
  setOperatorLoading(true);setOperatorMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(user){
   const {data:membership,error:membershipError}=await supabase.from("operator_memberships").select("operator_id").eq("user_id",user.id).limit(1).maybeSingle();
   setOperatorLoading(false);
   if(!membershipError&&membership){window.location.assign("/area-operatore");return;}
   setOperatorMessage("Questo account non è ancora associato a un'attività BIMARIS. Esci dall'account se vuoi accedere con un'altra email operatore.");
   return;
  }
  const callbackUrl=`${window.location.origin}/auth/callback?operator=1&next=${encodeURIComponent("/area-operatore")}`;
  const {error}=await supabase.auth.signInWithOtp({email:operatorEmail.trim(),options:{emailRedirectTo:callbackUrl,shouldCreateUser:false}});
  setOperatorLoading(false);
  if(error){
   console.error("Operator magic-link error",{message:error.message,status:error.status,code:error.code});
   if(error.status===429){setOperatorMessage("Hai richiesto troppi link in poco tempo. Attendi qualche minuto e riprova.");return;}
   setOperatorMessage("Non è stato possibile inviare il link di accesso. Verifica l'indirizzo email o riprova tra poco.");
   return;
  }
  setOperatorMessage("Controlla la tua email: ti abbiamo inviato il link per entrare nell'Area Operatore.");
 }

 return <div className="container access-gateway">
  <div className="kicker">Entra in BIMARIS</div><h1>Come vuoi usare BIMARIS?</h1><p className="access-gateway-intro">Scegli il percorso dedicato a te. L'accesso personale e quello degli operatori restano separati.</p>
  <div className="access-gateway-grid">
   <section className="card access-gateway-card">
    <div><div className="kicker">Per te</div><h2>Utente</h2><p>Salva luoghi ed esperienze, costruisci il tuo BIMARIS e ricevi suggerimenti più vicini ai tuoi interessi.</p></div>
    <div className="access-gateway-actions"><Link className="button" href="/accedi/utente">Accedi o registrati come utente</Link></div>
    <p className="access-gateway-note">Se è il tuo primo accesso, potrai creare automaticamente il tuo account personale.</p>
   </section>
   <section className="card access-gateway-card">
    <div><div className="kicker">Per gli operatori</div><h2>Operatore</h2><p>Gestisci la tua attività e le esperienze collegate, oppure proponi a BIMARIS una nuova realtà o esperienza del territorio.</p></div>
    <div className="access-gateway-actions"><button className="button" type="button" disabled={operatorLoading} aria-expanded={showOperatorLogin} aria-controls="operator-access-form" onClick={()=>showOperatorLogin?setShowOperatorLogin(false):void openOperatorAccess()}>{operatorLoading?"Verifica accesso…":showOperatorLogin?"Chiudi accesso operatore":"Accedi come operatore"}</button><Link className="button ghost" href="/operatori/candidatura">Registrati e proponi un'esperienza</Link></div>
    {showOperatorLogin&&<form id="operator-access-form" onSubmit={sendOperatorMagicLink} className="operator-access-form" aria-busy={operatorLoading}><label htmlFor="operator-email"><strong>Email associata all'attività</strong></label><input id="operator-email" name="email" type="email" autoComplete="email" inputMode="email" required value={operatorEmail} onChange={e=>setOperatorEmail(e.target.value)} placeholder="email@attivita.it"/><button className="button" type="submit" disabled={operatorLoading}>{operatorLoading?"Verifica…":"Ricevi il link per l'Area Operatore"}</button>{operatorMessage&&<p role="status" aria-live="polite" className="access-status">{operatorMessage}</p>}<p className="access-gateway-note">Se sei già autenticato e il tuo account è abilitato come operatore, BIMARIS apre direttamente l'Area Operatore senza inviare un nuovo link.</p></form>}
    <p className="access-gateway-note">Le nuove proposte vengono valutate da BIMARIS prima dell'attivazione dell'Area Operatore.</p>
   </section>
  </div><p className="access-gateway-back"><Link href="/">← Torna a BIMARIS</Link></p>
 </div>;
}
