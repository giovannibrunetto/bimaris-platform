import type { Metadata } from "next";
import "./privacy-questionario.css";

export const metadata: Metadata = {
  title: "Privacy questionario cittadini | BIMARIS",
  description: "Informativa privacy in verifica per il questionario cittadini «A MESSINA NON C'È NENTI!» e l'eventuale avviso sul lancio BIMARIS.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function PrivacyQuestionarioPage() {
  return <article className="survey-privacy">
    <header className="survey-privacy__hero">
      <div className="survey-privacy__container">
        <p className="survey-privacy__eyebrow">BIMARIS · Messina da vivere</p>
        <h1>Informativa privacy del questionario cittadini</h1>
        <p className="survey-privacy__subtitle">«A MESSINA NON C’È NENTI!» — sondaggio sulle attività e sulle esigenze dei cittadini di Messina.</p>
        <p className="survey-privacy__version">Versione 2026-11-16-v1 · 16 novembre 2026 · In verifica · Raccolta non ancora autorizzata</p>
      </div>
    </header>

    <div className="survey-privacy__container survey-privacy__content">
      <p className="survey-privacy__notice"><strong>Informativa in verifica.</strong> Questa pagina è predisposta per il collaudo prima dell'attivazione del questionario. La base giuridica del sondaggio, alcuni tempi di conservazione e le condizioni contrattuali dei fornitori devono ancora essere confermati. Non inviare risposte o dati personali attraverso questa pagina.</p>

      <section aria-labelledby="survey-owner">
        <h2 id="survey-owner">1. Titolare del trattamento e contatto</h2>
        <p><strong>Jessica Lucchesi</strong>, persona fisica, per il progetto <strong>BIMARIS — Messina da vivere</strong>.</p>
        <p>Per informazioni, esercizio dei diritti e revoca del consenso: <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>.</p>
      </section>

      <section aria-labelledby="survey-purpose">
        <h2 id="survey-purpose">2. Risposte al questionario</h2>
        <p>Le risposte alle cinque domande sulle attività a Messina, insieme alla data di invio, saranno utilizzate per analizzare le esigenze dei cittadini e migliorare il progetto BIMARIS.</p>
        <p><strong>Base giuridica proposta:</strong> legittimo interesse della titolare a svolgere questa ricerca (art. 6, par. 1, lett. f, GDPR), <strong>soggetto a valutazione e documentazione prima dell'avvio della raccolta</strong>. Non si dichiara conclusa tale verifica.</p>
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
        <p><strong>Durate proposte, da confermare prima della raccolta:</strong> le risposte riconducibili a persone saranno conservate per un massimo di 12 mesi dalla raccolta e poi cancellate o rese anonime.</p>
        <p>L'email per l'avviso sarà cancellata dopo la comunicazione del lancio, e comunque entro 12 mesi dalla raccolta, salvo cancellazione anticipata in caso di revoca.</p>
        <p>La prova del consenso comprende testo accettato, data e ora, versione del consenso e versione dell’informativa. Il termine di conservazione della prova dopo la cancellazione del contatto deve essere definito e approvato prima della raccolta reale.</p>
      </section>

      <section aria-labelledby="survey-providers">
        <h2 id="survey-providers">6. Strumenti, destinatari e trasferimenti internazionali</h2>
        <p>Il questionario è ospitato sul sito BIMARIS mediante <strong>Vercel</strong>; la persistenza è predisposta su <strong>Supabase</strong>, nel progetto di staging situato nella regione <strong>eu-west-1 (Irlanda)</strong>. Google Forms e Google Sheets non sono utilizzati per questa raccolta.</p>
        <p>Le risposte individuali e gli indirizzi non saranno pubblicati. L’accesso sarà limitato alla titolare e alle persone autorizzate; i fornitori potranno trattare dati tecnici necessari al funzionamento e alla sicurezza dei servizi, secondo i rispettivi accordi.</p>
        <p>Per prevenire abusi il server utilizza un’impronta HMAC dell’indirizzo IP, senza registrare l’IP in chiaro negli archivi del questionario. I contatori vengono eliminati al successivo utilizzo quando più vecchi di 24 ore. I fornitori di hosting possono trattare ulteriori log tecnici secondo la loro configurazione.</p>
        <p>Prima della raccolta reale devono essere confermati gli accordi sul trattamento, i subfornitori, la conservazione dei log e le garanzie per gli eventuali trasferimenti fuori dallo Spazio Economico Europeo. La collocazione europea del database non esclude da sola tali trasferimenti.</p>
        <p>Documentazione dei fornitori: <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Privacy Vercel</a>, <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">DPA Vercel</a>, <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Supabase</a> e <a href="https://supabase.com/legal/customer-resources/data-processing-addendum" target="_blank" rel="noopener noreferrer">DPA Supabase</a>.</p>
      </section>

      <section aria-labelledby="survey-test">
        <h2 id="survey-test">7. Stato attuale: solo collaudo riservato</h2>
        <p>La raccolta reale è disattivata. L’anteprima ordinaria non invia né salva risposte o email. Un accesso riservato di collaudo, valido per 30 minuti, consente esclusivamente prove con dati inventati: email nel dominio example.invalid e testo libero con prefisso COLLAUDO:.</p>
        <p>La sessione di prova usa un cookie tecnico HttpOnly, SameSite Strict e Secure su HTTPS. Gli archivi di prova sono separati dai dati delle altre funzionalità. Le prove più vecchie di sette giorni vengono eliminate al successivo invio; prima del lancio è prevista la cancellazione completa dei dati di collaudo. Nessuna comunicazione email è inviata dal questionario.</p>
      </section>

      <section aria-labelledby="survey-rights">
        <h2 id="survey-rights">8. I tuoi diritti</h2>
        <p>Nei casi previsti dal GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione del trattamento e portabilità dei dati; puoi opporti ai trattamenti basati sul legittimo interesse e revocare il consenso per l'avviso di lancio.</p>
        <p>Per esercitare i tuoi diritti scrivi a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>. Puoi presentare reclamo al <a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>.</p>
      </section>

      <footer className="survey-privacy__footnote">
        <p><strong>Stato del documento:</strong> versione di collaudo per il questionario cittadini. L'attivazione del sondaggio e l'impiego di questa informativa come testo definitivo richiedono una successiva approvazione.</p>
      </footer>
    </div>
  </article>;
}
