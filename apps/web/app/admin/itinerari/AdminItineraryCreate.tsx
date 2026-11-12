"use client";
import { useState } from "react";
export default function AdminItineraryCreate(){
 const [open,setOpen]=useState(false);
 return <section className="admin-itineraries-create" id="nuovo-itinerario">
 <div className="admin-itineraries-create__intro"><div><div className="kicker">NUOVO ITINERARIO</div><h2>Crea un itinerario</h2><p>Inserisci le informazioni principali. Dopo il salvataggio potrai scegliere i luoghi e organizzare le tappe.</p></div><button className="admin-itineraries-new-button" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="admin-itinerary-create-form">{open?"Chiudi modulo":"+ Nuovo itinerario"}</button></div>
 {open&&<div id="admin-itinerary-create-form"><div className="admin-itineraries-steps" aria-label="Fasi di creazione"><span><b>1</b> Informazioni</span><span><b>2</b> Luoghi e tappe</span><span><b>3</b> Pubblicazione</span></div>
         <form className="form admin-itineraries-form" method="post" action="/api/admin/itineraries">
          <input type="hidden" name="action" value="create" />
          <label>Titolo<input required name="title" placeholder="Es. Messina tra miti e monumenti" /></label>
          <details className="wide admin-itineraries-advanced"><summary>Personalizza l’indirizzo dell’itinerario (facoltativo)</summary><p className="admin-itineraries-advanced__help">L’indirizzo viene creato automaticamente dal titolo. Modificalo solo se desideri un indirizzo personalizzato.</p><label>Indirizzo personalizzato<input name="slug" placeholder="Generato automaticamente dal titolo" /></label></details>
          <label>Durata indicativa (minuti)<input name="duration_minutes" inputMode="numeric" placeholder="Es. 240" /></label>
          <label>Ideale per<input name="target" placeholder="Es. Crocieristi, famiglie, food lovers" /></label>
          <label className="wide">Area geografica generale<input name="territory" placeholder="Es. Messina e Stretto" /><small>Non indica le singole tappe: le aggiungerai alla bozza nella fase successiva.</small></label>
          <label className="wide">Testo breve<input required name="excerpt" maxLength={320} placeholder="Una frase chiara per la card" /></label>
          <label className="wide">Descrizione<textarea required name="description" /></label>
          <details className="wide admin-itineraries-advanced"><summary>Copertina da URL (facoltativa)</summary><label>URL immagine<input name="image_url" placeholder="https://..." /></label><label>Descrizione dell’immagine (accessibilità)<input name="image_alt" placeholder="Descrivi brevemente ciò che mostra la copertina" /></label></details>
          
          <div className="wide"><button className="button" type="submit">Salva bozza e passa alle tappe</button></div>
        </form>
 </div>}
 </section>;
}
