"use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

export default function ImpostaPasswordPage(){
 const params=useSearchParams();
 const context=params.get("context")==="operator"?"operator":"utente";
 const [ready,setReady]=useState(false);
 const [account,setAccount]=useState<string|null>(null);
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [success,setSuccess]=useState(false);
 useEffect(()=>{
  let active=true;
  const client=createBrowserSupabaseClient();
  if(!client){setNotice("Servizio non disponibile.");setReady(true);return;}
  void client.auth.getUser().then(({data,error})=>{
   if(!active)return;
   setAccount(error?null:data.user?.email??null);
   setReady(true);
  });
  return()=>{active=false;};
 },[]);
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(password.length<12){setNotice("Usa una password di almeno 12 caratteri.");return;}
  if(password!==confirm){setNotice("Le password non coincidono.");return;}
  const client=createBrowserSupabaseClient();
  if(!client){setNotice("Servizio non disponibile.");return;}
  setBusy(true);setNotice("");
  const {error}=await client.auth.updateUser({password});
  setPassword("");setConfirm("");setBusy(false);
  if(error){setNotice("Non è stato possibile impostare la password. Il collegamento potrebbe essere scaduto oppure è necessaria una nuova verifica.");return;}
  setSuccess(true);setNotice("Password impostata correttamente. Potrai usarla nei prossimi accessi.");
 }
 return <main className="password-setup-page">
  <section className="password-setup-card">
   <div className="password-setup-kicker">Il tuo BIMARIS</div>
   <h1>Imposta la tua password</h1>
   <p>La password sarà associata al tuo account esistente. Attività, ruoli e contenuti resteranno invariati.</p>
   {!ready?<p>Verifica sessione…</p>:!account?<><p role="alert">Per impostare una password devi prima aprire il collegamento ricevuto via email o accedere al tuo account.</p><Link href={context==="operator"?"/accedi":"/accedi/utente"}>Torna all'accesso →</Link></>:success?<><p role="status">{notice}</p><Link className="password-setup-action" href={context==="operator"?"/area-operatore":"/profilo"}>Continua su BIMARIS →</Link></>:<>
    <p className="password-setup-identity">Account verificato: <strong>{account}</strong></p>
    <form onSubmit={save} aria-busy={busy}>
     <label htmlFor="new-password">Nuova password (almeno 12 caratteri)</label>
     <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={12} disabled={busy}/>
     <label htmlFor="confirm-password">Conferma la nuova password</label>
     <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={12} disabled={busy}/>
     <button type="submit" disabled={busy}>{busy?"Salvataggio…":"Salva password"}</button>
    </form>
    {notice&&<p role="alert" className="password-setup-notice">{notice}</p>}
   </>}
  </section>
  <style jsx>{`
   .password-setup-page{min-height:85vh;background:linear-gradient(135deg,#071b1f,#0a292d 60%,#081d20);padding:clamp(26px,6vw,75px) 16px;color:#f7f2e9}
   .password-setup-card{max-width:590px;margin:auto;padding:clamp(24px,5vw,48px);border:1px solid rgba(202,168,106,.4);border-radius:24px;background:rgba(255,255,255,.06)}
   .password-setup-kicker{font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#caa86a}
   .password-setup-card h1{font:normal clamp(34px,5vw,48px) Georgia,serif;margin:12px 0 15px}
   .password-setup-card p{font-size:15px;line-height:1.6;color:#e1e8e3}
   .password-setup-identity{overflow-wrap:anywhere}
   .password-setup-card form{display:grid;gap:12px;margin-top:23px}
   .password-setup-card label{font-weight:700;font-size:14px}
   .password-setup-card input{box-sizing:border-box;width:100%;padding:13px;min-height:48px;border:1px solid #baa477;background:#fff;color:#0b292d;border-radius:12px;font:inherit}
   .password-setup-card button{border:1px solid #caa86a;background:#caa86a;color:#08252b;border-radius:999px;padding:13px 18px;font:inherit;font-weight:800;cursor:pointer}
   .password-setup-card button:disabled{opacity:.55}
   .password-setup-card button:focus-visible,.password-setup-card input:focus-visible{outline:2px solid #efd39f;outline-offset:3px}
   .password-setup-notice{color:#ffd6c9!important}
  `}</style>
 </main>;
}
