"use client";
import {FormEvent,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

export default function PasswordAccess({context}:{context:"operator"|"utente"}){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 const [mode,setMode]=useState<"login"|"recover"|"signup">("login");
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
   if(mode==="signup"){
    const callback=`${window.location.origin}/auth/callback?next=${encodeURIComponent("/profilo")}`;
    const {data,error:signupError}=await client.auth.signUp({
     email:email.trim(),password,options:{emailRedirectTo:callback},
    });
    if(signupError){
     setMessage(signupError.status===429?"Limite temporaneo di invio email raggiunto. Riprova più tardi.":"Non è stato possibile creare l’account. Verifica i dati o prova ad accedere.");
     setError(true);
    }else if(data.session) window.location.assign("/auth/callback?next="+encodeURIComponent("/profilo"));
    else setMessage("Controlla la tua email per completare la registrazione. Se hai già un account, accedi o recupera la password.");
    return;
   }
   const {data,error:loginError}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(loginError||!data.user){setMessage("Credenziali non valide oppure password non ancora impostata. Puoi utilizzare il recupero password.");setError(true);return;}
   if(isOperator){
    const {data:membership,error:membershipError}=await client.from("operator_memberships").select("operator_id").eq("user_id",data.user.id).limit(1).maybeSingle();
    if(membershipError||!membership){setMessage("Accesso personale riuscito, ma questo account non è collegato a un operatore BIMARIS.");setError(true);return;}
    const next=new URLSearchParams(window.location.search).get("next");
    const operatorDestination=next&&(next==="/area-operatore"||next.startsWith("/area-operatore?")||next.startsWith("/area-operatore/")||next.startsWith("/area-operatore#"))?next:"/area-operatore";
    window.location.assign(operatorDestination);
    return;
   }
   window.location.assign("/auth/callback?next="+encodeURIComponent("/profilo"));
  }finally{setBusy(false);setPassword("");}
 }
 function changeMode(next:"login"|"recover"|"signup"){
  setMode(next);
  setPassword("");
  setShowPassword(false);
  setMessage("");
  setError(false);
 }
 return <section className="password-access" aria-label="Accesso con password">
  {(mode!=="login")&&<h3>{mode==="signup"?"Crea un account":mode==="recover"?"Imposta o recupera la password":"Accedi con email e password"}</h3>}
  {(mode==="recover")&&<p className="password-access__intro">Riceverai un collegamento di verifica per scegliere una password.</p>}
  <form onSubmit={handleSubmit} aria-busy={busy}>
   <label htmlFor={`password-email-${context}`}>Email</label>
   <input id={`password-email-${context}`} type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.it" disabled={busy}/>
   {mode!=="recover"&&<>
    <label htmlFor={`password-secret-${context}`}>{mode==="signup"?"Password (almeno 12 caratteri)":"Password"}</label>
    <div className="password-access__secret"><input id={`password-secret-${context}`} type={showPassword?"text":"password"} required autoComplete={mode==="signup"?"new-password":"current-password"} minLength={mode==="signup"?12:undefined} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button className="password-access__visibility" type="button" aria-label={showPassword?"Nascondi password":"Mostra password"} aria-pressed={showPassword} aria-controls={`password-secret-${context}`} onClick={()=>setShowPassword(v=>!v)} disabled={busy}>{showPassword?"Nascondi":"Mostra"}</button></div>
   </>}
   <button className="button password-access__submit" type="submit" disabled={busy}>{busy?"Verifica…":mode==="login"?"Entra con password":mode==="signup"?"Crea account":"Invia collegamento di recupero"}</button>
  </form>
  <div className="password-access__links">
   <button className="password-access__switch" type="button" disabled={busy} onClick={()=>changeMode(mode==="login"?"recover":"login")}>{mode==="login"?(isOperator?"Non hai una password? Impostala o recuperala":"Password dimenticata?"):"← Torna all’accesso"}</button>
   {!isOperator&&mode==="login"&&<button className="password-access__switch" type="button" disabled={busy} onClick={()=>changeMode("signup")}>Crea un account</button>}
  </div>
  {message&&<p className="password-access__feedback" role={error?"alert":"status"} aria-live="polite">{message}</p>}
  <style jsx>{`
   .password-access{min-width:0;color:inherit}
   .password-access h3{font:normal 25px Georgia,serif;margin:0 0 8px}
   .password-access__intro{font-size:14px;line-height:1.5;margin:0 0 15px}
   .password-access form{display:grid;gap:9px}
   .password-access label{font-size:14px;font-weight:750}
   .password-access input{width:100%;min-height:47px;border-radius:11px;border:1px solid #bca67d;background:#fff;color:#09262b;padding:12px;box-sizing:border-box;font:inherit}
   .password-access__secret{position:relative;min-width:0}
   .password-access__secret input{padding-right:94px}
   .password-access__visibility{position:absolute;right:6px;top:50%;transform:translateY(-50%);min-width:76px;min-height:36px;padding:5px 9px;border:0;border-radius:8px;background:#f3efe6;color:#0b3035;font:inherit;font-size:13px;font-weight:750;cursor:pointer}
   .password-access__visibility:focus-visible{outline:2px solid #caa86a;outline-offset:2px}
   .password-access__submit{margin-top:8px;min-height:45px}
   .password-access__links{display:flex;flex-wrap:wrap;column-gap:18px}
   .password-access__switch{margin-top:14px;border:0;background:transparent;color:#cca358;cursor:pointer;text-decoration:underline;text-underline-offset:3px;font:inherit;font-size:14px;font-weight:750;padding:5px 0;text-align:left}
   .password-access__switch:focus-visible,.password-access input:focus-visible{outline:2px solid #caa86a;outline-offset:3px}
   .password-access__feedback{font-size:14px;line-height:1.5;margin:12px 0 0}
  `}</style>
 </section>;
}
