"use client";
import { FormEvent, useState } from "react";
import { track } from "@/lib/analytics";

export default function ApplicationPage(){
 const [sent,setSent]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault(); await track("operator_application_submitted"); setSent(true);}
 return <><section className="page-hero"><div className="kicker">Per gli operatori</div><h1>Presenta la tua realtà</h1><p>BIMARIS sta costruendo una selezione di operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e forte legame con il territorio.</p></section><section className="section">
 {sent ? <div className="detail-panel"><h3>Candidatura ricevuta</h3><p>Grazie per averci presentato la tua realtà. La candidatura sarà valutata in base alla coerenza con il progetto BIMARIS e con i criteri di qualità, autenticità e valore territoriale. L'invio non comporta l'inserimento automatico nella selezione.</p></div> :
 <form className="form" onSubmit={submit} onFocus={()=>track("operator_application_started")}>
  <label>Nome attività<input required name="business_name" /></label><label>Referente<input required name="contact_name" /></label>
  <label>Email<input required type="email" name="email" /></label><label>Telefono<input name="phone" /></label>
  <label>Categoria<select name="category"><option>Esperienze</option><option>Mare</option><option>Natura</option><option>Gastronomia</option><option>Cultura</option><option>Artigianato</option></select></label><label>Località<input required name="location" /></label>
  <label className="wide">Sito o social<input name="website" /></label><label className="wide">Raccontaci cosa proponi<textarea required name="description" /></label>
  <div className="wide"><button className="button" type="submit">Invia candidatura</button></div>
 </form>}
 </section></>;
}
