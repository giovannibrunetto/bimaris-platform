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
        <p className="survey-privacy__version">Bozza del 15 novembre 2026 · In verifica · Raccolta non ancora autorizzata</p>
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
        <p>Le risposte alle cinque domande sulle attività a Messina, insieme alla data e all'ora di invio, saranno utilizzate per analizzare le esigenze dei cittadini e migliorare il progetto BIMARIS.</p>
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
        <p>Secondo la configurazione prevista, Google Forms non richiede l'accesso con un account Google e non raccoglie automaticamente l'indirizzo email dell'account. La scelta di ricevere l'avviso di lancio è distinta dalle risposte alle cinque domande.</p>
        <p><strong>Attenzione:</strong> se lasci la tua email nello stesso modulo, le tue risposte potranno essere collegate al contatto e <strong>non saranno anonime</strong>. Chi non esprime consenso non riceverà comunicazioni sul lancio.</p>
        <p>Non sono previste profilazione né decisioni automatizzate.</p>
      </section>

      <section aria-labelledby="survey-retention">
        <h2 id="survey-retention">5. Conservazione dei dati</h2>
        <p><strong>Durate proposte, da confermare prima della raccolta:</strong> le risposte riconducibili a persone saranno conservate per un massimo di 12 mesi dalla raccolta e poi cancellate o rese anonime.</p>
        <p>L'email per l'avviso sarà cancellata dopo la comunicazione del lancio, e comunque entro 12 mesi dalla raccolta, salvo cancellazione anticipata in caso di revoca.</p>
        <p>Una prova minima del consenso potrebbe essere conservata per il tempo necessario a dimostrare la liceità del trattamento; il relativo termine deve essere definito prima dell'attivazione.</p>
      </section>

      <section aria-labelledby="survey-providers">
        <h2 id="survey-providers">6. Strumenti, destinatari e trasferimenti internazionali</h2>
        <p>Il questionario è previsto su <strong>Google Forms</strong>, con gestione delle risposte attraverso <strong>Google Sheets</strong> nell'account BIMARIS. Le risposte individuali non saranno pubblicate; l'accesso sarà limitato alla titolare e alle persone autorizzate.</p>
        <p>Prima della raccolta devono essere verificati l'inquadramento contrattuale di Google per l'account utilizzato, gli eventuali responsabili del trattamento e le garanzie applicabili agli eventuali trasferimenti di dati fuori dallo Spazio Economico Europeo. <strong>Queste verifiche non sono ancora dichiarate concluse.</strong></p>
        <p>Informazioni del fornitore: <a href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noopener noreferrer">Privacy di Google</a> e <a href="https://policies.google.com/privacy/frameworks?hl=it" target="_blank" rel="noopener noreferrer">Quadri giuridici per i trasferimenti</a>.</p>
      </section>

      <section aria-labelledby="survey-rights">
        <h2 id="survey-rights">7. I tuoi diritti</h2>
        <p>Nei casi previsti dal GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione del trattamento e portabilità dei dati; puoi opporti ai trattamenti basati sul legittimo interesse e revocare il consenso per l'avviso di lancio.</p>
        <p>Per esercitare i tuoi diritti scrivi a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>. Puoi presentare reclamo al <a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>.</p>
      </section>

      <footer className="survey-privacy__footnote">
        <p><strong>Stato del documento:</strong> versione di collaudo per il questionario cittadini. L'attivazione del sondaggio e l'impiego di questa informativa come testo definitivo richiedono una successiva approvazione.</p>
      </footer>
    </div>
  </article>;
}
