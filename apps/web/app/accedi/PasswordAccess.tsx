"use client";
import {FormEvent,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

export default function PasswordAccess({context}:{context:"operator"|"utente"}){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 const [mode,setMode]=useState<"login"|"recover">("login");
 const isOperator=context==="operator";
 async function handleSubmit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const client=createBrowserSupabaseClient();
  if(!client){setMessage("Accesso non disponibile.");setError(true);return;}
  setBusy(true);setMessage("");setError(false);
  try{
   if(mode==="recover"){
    const next="/accedi/password?context="+context;
    const callback=`${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const {error:resetError}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:callback});
    if(resetError){
     setMessage(resetError.status===429?"Limite temporaneo di invio email raggiunto. Evita nuove richieste e riprova più tardi.":"Non è stato possibile inviare il collegamento di recupero. Riprova più tardi.");
     setError(true);
    }else setMessage("Se l'indirizzo è registrato, riceverai un collegamento per impostare la password.");
    return;
   }
   const {data,error:loginError}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(loginError||!data.user){setMessage("Credenziali non valide oppure password non ancora impostata. Puoi utilizzare il recupero password.");setError(true);return;}
   if(isOperator){
    const {data:membership,error:membershipError}=await client.from("operator_memberships").select("operator_id").eq("user_id",data.user.id).limit(1).maybeSingle();
    if(membershipError||!membership){setMessage("Accesso personale riuscito, ma questo account non è collegato a un operatore BIMARIS.");setError(true);return;}
    window.location.assign("/area-operatore");
    return;
   }
   window.location.assign("/auth/callback?next="+encodeURIComponent("/profilo"));
  }finally{setBusy(false);setPassword("");}
 }
 return <section className={`password-access ${isOperator?"password-access--operator":""}`} aria-label="Accesso con password">
  <h3>{mode==="login"?"Accedi con email e password":"Imposta o recupera la password"}</h3>
  <p className="password-access__intro">{mode==="login"?"Hai già una password BIMARIS? Entra senza richiedere un nuovo link.":"Riceverai un collegamento di verifica per scegliere una password. Non viene creato un nuovo account."}</p>
  <form onSubmit={handleSubmit} aria-busy={busy}>
   <label htmlFor={`password-email-${context}`}>Email</label>
   <input id={`password-email-${context}`} type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.it" disabled={busy}/>
   {mode==="login"&&<>
    <label htmlFor={`password-secret-${context}`}>Password</label>
    <input id={`password-secret-${context}`} type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
   </>}
   <button className="button password-access__submit" type="submit" disabled={busy}>{busy?"Verifica…":mode==="login"?"Entra con password":"Invia collegamento di recupero"}</button>
  </form>
  <button className="password-access__switch" type="button" disabled={busy} onClick={()=>{setMode(v=>v==="login"?"recover":"login");setPassword("");setMessage("");setError(false)}}>{mode==="login"?"Non hai una password? Impostala o recuperala":"← Torna all'accesso con password"}</button>
  {message&&<p className="password-access__feedback" role={error?"alert":"status"} aria-live="polite">{message}</p>}
  <style jsx>{`
   .password-access{margin-top:20px;padding:20px;border:1px solid rgba(202,168,106,.37);background:rgba(8,39,43,.06);border-radius:17px;color:inherit}
   .password-access h3{font:normal 25px Georgia,serif;margin:0 0 8px}
   .password-access--operator{background:transparent;border:0;border-radius:0;padding:0;margin:0}
   .password-access--operator h3{font:normal 22px Georgia,serif;margin-bottom:6px;color:#0b3035}
   .password-access--operator .password-access__intro{font-size:13px;margin-bottom:15px;color:#4e6667}
   .password-access--operator .password-access__switch{color:#80551f}
   .password-access--operator .password-access__submit{width:100%;border-radius:13px;background:#caa86a;color:#08262b;box-shadow:none}
   .password-access--operator input{border-color:#c9c4b8}
   .password-access__intro{font-size:14px;line-height:1.5;margin:0 0 15px}
   .password-access form{display:grid;gap:9px}
   .password-access label{font-size:14px;font-weight:750}
   .password-access input{width:100%;min-height:47px;border-radius:11px;border:1px solid #bca67d;background:#fff;color:#09262b;padding:12px;box-sizing:border-box;font:inherit}
   .password-access__submit{margin-top:8px;min-height:45px}
   .password-access__switch{margin-top:14px;border:0;background:transparent;color:#cca358;cursor:pointer;text-decoration:underline;text-underline-offset:3px;font:inherit;font-size:14px;font-weight:750;padding:5px 0;text-align:left}
   .password-access__switch:focus-visible,.password-access input:focus-visible{outline:2px solid #caa86a;outline-offset:3px}
   .password-access__feedback{font-size:14px;line-height:1.5;margin:12px 0 0}
  `}</style>
 </section>;
}
