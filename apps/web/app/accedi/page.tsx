"use client";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const inputStyle={minHeight:48,borderRadius:12,border:"1px solid rgba(0,0,0,.18)",padding:"0 14px",font:"inherit"};

export default function AccediPage(){
 const [email,setEmail]=useState("");
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 const [googleLoading,setGoogleLoading]=useState(false);
 const [showLogin,setShowLogin]=useState(false);
 const [operatorEmail,setOperatorEmail]=useState("");
 const [operatorMessage,setOperatorMessage]=useState("");
 const [operatorLoading,setOperatorLoading]=useState(false);
 const [showOperatorLogin,setShowOperatorLogin]=useState(false);

 async function signInWithGoogle(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setGoogleLoading(true);setMessage("");
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback`}});
  if(error){setGoogleLoading(false);setMessage("Accesso con Google non ancora disponibile. Riprova più tardi.");}
 }

 async function sendMagicLink(event:FormEvent){
  event.preventDefault();const supabase=createBrowserSupabaseClient();
  if(!supabase){setMessage("Accesso non disponibile in questo momento.");return;}
  setLoading(true);setMessage("");
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}});
  setLoading(false);setMessage(error?"Non è stato possibile inviare il link. Riprova.":"Controlla la tua email: ti abbiamo inviato il link per accedere a BIMARIS.");
 }

 async function sendOperatorMagicLink(event:FormEvent){
  event.preventDefault();const supabase=createBrowserSupabaseClient();
  if(!supabase){setOperatorMessage("Accesso non disponibile in questo momento.");return;}
  setOperatorLoading(true);setOperatorMessage("");
  const callback=`${window.location.origin}/auth/callback?operator=1&next=${encodeURIComponent("/area-operatore")}`;
  const {error}=await supabase.auth.signInWithOtp({email:operatorEmail,options:{emailRedirectTo:callback,shouldCreateUser:false}});
  setOperatorLoading(false);
  setOperatorMessage(error?"Non risulta un accesso operatore attivo per questa email. Verifica l'indirizzo oppure contatta BIMARIS.":"Controlla la tua email: ti abbiamo inviato il link per entrare nell'Area Operatore.");
 }

 const card={padding:28,display:"flex",flexDirection:"column" as const,gap:16,minHeight:310};
 return <div className="container" style={{padding:"56px 20px 80px",maxWidth:1120}}>
  <div className="kicker">Entra in BIMARIS</div><h1 style={{marginBottom:12}}>Come vuoi usare BIMARIS?</h1><p style={{maxWidth:720,marginBottom:32}}>Scegli il percorso dedicato a te. L'accesso personale e quello degli operatori restano separati.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:22,alignItems:"stretch"}}>
   <section className="card" style={card}>
    <div><div className="kicker">Per te</div><h2 style={{fontSize:30,margin:"7px 0 10px"}}>Utente</h2><p style={{margin:0,opacity:.78}}>Salva luoghi ed esperienze, costruisci il tuo BIMARIS e ricevi suggerimenti più vicini ai tuoi interessi.</p></div>
    <div style={{marginTop:"auto",display:"grid",gap:10}}><button className="button" type="button" onClick={signInWithGoogle} disabled={googleLoading} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span aria-hidden="true" style={{width:20,height:20,borderRadius:"50%",background:"#fff",color:"#4285f4",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:"Arial,sans-serif"}}>G</span>{googleLoading?"Connessione a Google…":"Continua con Google"}</button><button className="button ghost" type="button" onClick={()=>setShowLogin(v=>!v)}>Continua con email</button></div>
    {showLogin&&<form onSubmit={sendMagicLink} style={{display:"grid",gap:10,paddingTop:8,borderTop:"1px solid rgba(0,0,0,.10)"}}><label htmlFor="email"><strong>Email</strong></label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.it" style={inputStyle}/><button className="button" type="submit" disabled={loading}>{loading?"Invio…":"Ricevi il link di accesso"}</button>{message&&<p role="status" style={{margin:0}}>{message}</p>}<p style={{margin:0,fontSize:13,opacity:.68}}>Se è il tuo primo accesso, BIMARIS creerà automaticamente il tuo account.</p></form>}
   </section>
   <section className="card" style={card}>
    <div><div className="kicker">Per le attività del territorio</div><h2 style={{fontSize:30,margin:"7px 0 10px"}}>Operatore</h2><p style={{margin:0,opacity:.78}}>Gestisci la tua attività e le esperienze collegate, oppure proponi a BIMARIS una nuova realtà o esperienza del territorio.</p></div>
    <div style={{marginTop:"auto",display:"grid",gap:10}}><button className="button" type="button" onClick={()=>setShowOperatorLogin(v=>!v)}>{showOperatorLogin?"Chiudi accesso operatore":"Accedi come operatore"}</button><Link className="button ghost" href="/operatori/candidatura" style={{textAlign:"center"}}>Registrati e proponi la tua esperienza</Link></div>
    {showOperatorLogin&&<form onSubmit={sendOperatorMagicLink} style={{display:"grid",gap:10,paddingTop:8,borderTop:"1px solid rgba(0,0,0,.10)"}}><label htmlFor="operator-email"><strong>Email associata all'attività</strong></label><input id="operator-email" type="email" required value={operatorEmail} onChange={e=>setOperatorEmail(e.target.value)} placeholder="email@attivita.it" style={inputStyle}/><button className="button" type="submit" disabled={operatorLoading}>{operatorLoading?"Invio…":"Ricevi il link per l'Area Operatore"}</button>{operatorMessage&&<p role="status" style={{margin:0}}>{operatorMessage}</p>}<p style={{margin:0,fontSize:13,opacity:.68}}>Usa l'indirizzo email abilitato da BIMARIS per la tua attività.</p></form>}
    <p style={{margin:0,fontSize:13,opacity:.68}}>Le nuove proposte vengono valutate da BIMARIS prima dell'attivazione dell'Area Operatore.</p>
   </section>
  </div><p style={{marginTop:24}}><Link href="/">← Torna a BIMARIS</Link></p>
 </div>;
}
