import type { Metadata } from "next";
import "./privacy-questionario.css";
import { liveCollectionOpen } from "@/lib/survey/live";
import LivePrivacyQuestionario from "./LivePrivacyQuestionario";

export const metadata: Metadata = {
  title: "Privacy questionario cittadini | BIMARIS",
  description: "Informativa sul trattamento dei dati del questionario cittadini «A MESSINA NON C’È NENTI!» e dell’eventuale comunicazione sul lancio BIMARIS.",
  robots: { index: false, follow: false, noarchive: true },
};

export const dynamic = "force-dynamic";

export default async function PrivacyQuestionarioPage() {
  // Both the isolated deployment config AND DB release gate must be open.
  // Otherwise retain the existing Staging/collaudo notice.
  if (await liveCollectionOpen()) return <LivePrivacyQuestionario />;
  return <article className="survey-privacy">
    <header className="survey-privacy__hero">
      <div className="survey-privacy__container">
        <p className="survey-privacy__eyebrow">BIMARIS · Messina da vivere</p>
        <h1>Informativa privacy del questionario cittadini</h1>
        <p className="survey-privacy__subtitle">«A MESSINA NON C’È NENTI!» — sondaggio sulle attività e sulle esigenze dei cittadini di Messina.</p>
        <p className="survey-privacy__version">Versione 2026-11-17-v2 · 17 novembre 2026 · Approvata dalla titolare · Raccolta reale disattivata</p>
      </div>
    </header>

    <div className="survey-privacy__container survey-privacy__content">
      <p className="survey-privacy__notice"><strong>Versione approvata dalla titolare.</strong> La raccolta reale è disattivata. Questo testo descrive il collaudo attivo e la politica approvata per il lancio; l’approvazione riguarda la valutazione della base giuridica, i termini di conservazione e l’informativa. Restano da completare le verifiche contrattuali sugli account e sui backup. Non inserire dati personali reali nell’anteprima.</p>

      <section aria-labelledby="survey-owner">
        <h2 id="survey-owner">1. Titolare del trattamento e contatto</h2>
        <p><strong>Jessica Lucchesi</strong>, persona fisica, per il progetto <strong>BIMARIS — Messina da vivere</strong>.</p>
        <p>Per informazioni, esercizio dei diritti e revoca del consenso: <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>.</p>
      </section>

      <section aria-labelledby="survey-purpose">
        <h2 id="survey-purpose">2. Risposte al questionario</h2>
        <p>Le risposte alle cinque domande sulle attività a Messina, insieme alla data di invio, saranno utilizzate per analizzare le esigenze dei cittadini e migliorare il progetto BIMARIS.</p>
        <p><strong>Base giuridica prevista per il sondaggio:</strong> legittimo interesse della titolare a svolgere questa ricerca (art. 6, par. 1, lett. f, GDPR), <strong>valutato nel dossier privacy BIMARIS del 17 novembre 2026 e approvato dalla titolare</strong>. La finalità è comprendere le esigenze territoriali per orientare il lancio, utilizzando solo le informazioni necessarie e privilegiando risultati aggregati. L’approvazione non attiva la raccolta reale, che resta sospesa fino al completamento delle verifiche sui fornitori e all’autorizzazione alla pubblicazione.</p>
        <p>La risposta aperta è facoltativa. Non inserire nomi, recapiti, dati particolari o informazioni riferite ad altre persone. Il questionario non richiede nome, cognome o telefono.</p>
      </section>

      <section aria-labelledby="survey-email">
        <h2 id="survey-email">3. Email facoltativa per annunciare il lancio</h2>
        <p>Solo se scegli espressamente <strong>«Sì»</strong> e inserisci il tuo indirizzo email, BIMARIS lo utilizzerà <strong>esclusivamente per comunicarti il lancio della piattaforma</strong>.</p>
        <p><strong>Base giuridica:</strong> consenso libero e facoltativo (art. 6, par. 1, lett. a, GDPR). Non prestare il consenso non impedisce di rispondere al sondaggio. Puoi revocarlo in qualsiasi momento scrivendo a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>, senza pregiudicare la liceità dei trattamenti precedenti.</p>
        <p>L'indirizzo non sarà utilizzato per newsletter, ulteriori promozioni, comunicazioni di operatori terzi o inserimento in pubblici pubblicitari Meta.</p>
      </section>

      <section aria-labelledby="survey-data">
        <h2 id="survey-data">4. Dati raccolti e collegamento tra risposte ed email</h2>
        <p>Il questionario è una pagina personalizzata del sito BIMARIS e non richiede un account Google. Non vengono raccolti automaticamente indirizzi email. Le risposte e gli indirizzi forniti volontariamente sono destinati ad archivi distinti nel database Supabase, con accesso riservato al server e alle persone autorizzate dalla titolare.</p>
        <p>Nell’archivio email non sono salvate le risposte né un identificativo condiviso con il questionario. Questa separazione riduce le possibilità di collegamento, ma non garantisce anonimato assoluto: il testo libero o i dati tecnici del servizio potrebbero consentire identificazioni indirette. Chi non esprime consenso non riceverà comunicazioni sul lancio.</p>
        <p>Non sono previste profilazione né decisioni automatizzate.</p>
      </section>

      <section aria-labelledby="survey-retention">
        <h2 id="survey-retention">5. Conservazione dei dati</h2>
        <p><strong>Termini approvati per la futura raccolta:</strong> le risposte individuali saranno conservate per un massimo di 12 mesi dalla raccolta, riesaminandone la necessità dopo 90 giorni e cancellandole prima se non più necessarie. Oltre tale periodo potranno essere mantenute soltanto statistiche effettivamente anonime, senza testo o dettagli identificanti.</p>
        <p>L’email e la prova del consenso saranno cancellate entro 30 giorni dall’invio dell’annuncio di lancio e comunque entro 12 mesi dalla raccolta: si applica la scadenza anteriore. In caso di revoca il contatto sarà escluso dall’invio appena la richiesta sarà ricevuta e verificata, con cancellazione senza ingiustificato ritardo.</p>
        <p>La prova del consenso comprende testo accettato, data e ora, versione del consenso e versione dell’informativa. La prova viene eliminata insieme al contatto; non è prevista una conservazione personale permanente successiva.</p>
      </section>

      <section aria-labelledby="survey-providers">
        <h2 id="survey-providers">6. Strumenti, destinatari e trasferimenti internazionali</h2>
        <p>Il questionario è ospitato sul sito BIMARIS mediante <strong>Vercel</strong>; la persistenza è predisposta su <strong>Supabase</strong>, nel progetto di staging situato nella regione <strong>eu-west-1 (Irlanda)</strong>. Google Forms e Google Sheets non sono utilizzati per questa raccolta.</p>
        <p>Le risposte individuali e gli indirizzi non saranno pubblicati. L’accesso sarà limitato alla titolare e alle persone autorizzate; i fornitori potranno trattare dati tecnici necessari al funzionamento e alla sicurezza dei servizi, secondo i rispettivi accordi.</p>
        <p>Per prevenire abusi il server utilizza un’impronta HMAC dell’indirizzo IP, senza registrare l’IP in chiaro negli archivi del questionario. I contatori vengono eliminati da una procedura periodica nel database, con una finestra massima prevista di 24 ore durante il regolare funzionamento del servizio. L’impronta è un dato pseudonimizzato, non anonimo. I fornitori di hosting possono trattare ulteriori log tecnici secondo la loro configurazione.</p>
        <p>Prima della raccolta reale devono essere confermati gli accordi sul trattamento, i subfornitori, la conservazione dei log e le garanzie per gli eventuali trasferimenti fuori dallo Spazio Economico Europeo. La collocazione europea del database non esclude da sola tali trasferimenti.</p>
        <p>Documentazione dei fornitori: <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Privacy Vercel</a>, <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">DPA Vercel</a>, <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Supabase</a> e <a href="https://supabase.com/legal/customer-resources/data-processing-addendum" target="_blank" rel="noopener noreferrer">DPA Supabase</a>.</p>
      </section>

      <section aria-labelledby="survey-test">
        <h2 id="survey-test">7. Stato attuale: solo collaudo riservato</h2>
        <p>La raccolta reale è disattivata. L’anteprima ordinaria non invia né salva risposte o email. Un accesso riservato di collaudo, valido per 30 minuti, consente esclusivamente prove con dati inventati: email nel dominio example.invalid e testo libero con prefisso COLLAUDO:.</p>
        <p>La sessione di prova usa un cookie tecnico HttpOnly, SameSite Strict e Secure su HTTPS. I dati del questionario sono isolati dalle altre funzionalità BIMARIS nello schema privato del database. I collaudi storici sono conservati in tabelle di test dedicate; gli invii fittizi più recenti sono registrati nelle tabelle del questionario con indicatore tecnico <code>rehearsal=true</code>, esclusi dalle statistiche e dalle eventuali liste di comunicazione della raccolta reale. L'archivio dei contatti rimane distinto da quello delle risposte. La cancellazione dei dati fittizi è programmata ogni ora nel database, indipendentemente da nuove risposte, anticipando fino a un’ora la scadenza di sette giorni. I registri di esecuzione contengono solo conteggi, esito e orari e sono conservati per 30 giorni. In caso di errore il ciclo seguente ritenta; se il database è sospeso o indisponibile, occorre ripristinarlo e completare la pulizia prima di riabilitare gli accessi. Prima del lancio è prevista la cancellazione completa delle prove. Nessuna comunicazione email è inviata dal questionario.</p>
      </section>

      <section aria-labelledby="survey-rights">
        <h2 id="survey-rights">8. I tuoi diritti</h2>
        <p>Nei casi previsti dal GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione del trattamento e portabilità dei dati; puoi opporti ai trattamenti basati sul legittimo interesse e revocare il consenso per l'avviso di lancio.</p>
        <p>Per esercitare i tuoi diritti scrivi a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>. Puoi presentare reclamo al <a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>.</p>
      </section>

      <footer className="survey-privacy__footnote">
        <p><strong>Stato del documento:</strong> informativa approvata dalla titolare, versione 2026-11-17-v2. I termini approvati non sono ancora attivati su dati reali. L’attivazione richiede il completamento delle verifiche sui fornitori e una nuova autorizzazione della Direzione Strategica; gli archivi attuali restano esclusivamente di prova.</p>
      </footer>
    </div>
  </article>;
}
