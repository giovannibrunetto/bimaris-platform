"use client";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const inputStyle={minHeight:48,borderRadius:12,border:"1px solid rgba(0,0,0,.18)",padding:"0 14px",font:"inherit"};

export default function AccessoUtentePage(){
 const [email,setEmail]=useState("");
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 const [googleLoading,setGoogleLoading]=useState(false);

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

 return <div className="container" style={{padding:"56px 20px 80px",maxWidth:720}}>
  <div className="kicker">Accesso personale</div>
  <h1 style={{marginBottom:12}}>Entra nel tuo BIMARIS</h1>
  <p style={{maxWidth:620,marginBottom:28}}>Accedi oppure crea gratuitamente il tuo account personale. Potrai salvare luoghi ed esperienze e personalizzare BIMARIS in base ai tuoi interessi.</p>
  <section className="card" style={{padding:28,display:"grid",gap:16}}>
   <button className="button" type="button" onClick={signInWithGoogle} disabled={googleLoading} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span aria-hidden="true" style={{width:20,height:20,borderRadius:"50%",background:"#fff",color:"#4285f4",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:"Arial,sans-serif"}}>G</span>{googleLoading?"Connessione a Google…":"Continua con Google"}</button>
   <div style={{textAlign:"center",opacity:.6,fontSize:13}}>oppure</div>
   <form onSubmit={sendMagicLink} style={{display:"grid",gap:10}}>
    <label htmlFor="user-email"><strong>Email</strong></label>
    <input id="user-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.it" style={inputStyle}/>
    <button className="button" type="submit" disabled={loading}>{loading?"Invio…":"Ricevi il link di accesso"}</button>
    {message&&<p role="status" style={{margin:0}}>{message}</p>}
   </form>
   <p style={{margin:0,fontSize:13,opacity:.68}}>Se è il tuo primo accesso, BIMARIS creerà automaticamente il tuo account.</p>
  </section>
  <p style={{marginTop:24}}><Link href="/accedi">← Scegli un altro tipo di accesso</Link></p>
 </div>;
}
