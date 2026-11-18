// Candidate live notice. Render only once the isolated live collection gate is open.
// Publication still requires controller confirmation, verified contracts and backup/restore.
export default function LivePrivacyQuestionario() {
  return <article className="survey-privacy">
    <header className="survey-privacy__hero"><div className="survey-privacy__container">
      <p className="survey-privacy__eyebrow">BIMARIS · Messina da vivere</p>
      <h1>Informativa privacy del questionario cittadini</h1>
      <p className="survey-privacy__subtitle">«A MESSINA NON C’È NENTI!» — ricerca sulle esigenze dei cittadini di Messina.</p>
      <p className="survey-privacy__version">Versione 2026-11-17-v2 · 18 novembre 2026</p>
    </div></header>
    <div className="survey-privacy__container survey-privacy__content">
      <section aria-labelledby="live-owner">
        <h2 id="live-owner">1. Titolare e contatti</h2>
        <p><strong>Jessica Lucchesi</strong>, persona fisica, è indicata come titolare del trattamento per BIMARIS — Messina da vivere. <strong>Giovanni Brunetto</strong> è il referente tecnico autorizzato per la gestione delle infrastrutture, secondo le istruzioni della titolare.</p>
        <p>Per informazioni, esercizio dei diritti e revoca del consenso: <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>.</p>
      </section>
      <section aria-labelledby="live-survey">
        <h2 id="live-survey">2. Risposte al sondaggio</h2>
        <p>Le risposte alle cinque domande e la data di invio sono utilizzate per conoscere le modalità di ricerca di attività, gli interessi e le difficoltà dei cittadini e orientare lo sviluppo di BIMARIS.</p>
        <p>La base giuridica delle risposte è il legittimo interesse della titolare alla ricerca sulle esigenze territoriali (art. 6, par. 1, lett. f, GDPR), subordinato alla valutazione documentata di bilanciamento. Puoi opporti al trattamento nei casi previsti dalla legge.</p>
        <p>La quinta risposta, libera, è facoltativa. Non inserire nomi, recapiti, dati particolari o informazioni relative ad altre persone. Non sono richiesti nome, cognome o telefono.</p>
      </section>
      <section aria-labelledby="live-consent">
        <h2 id="live-consent">3. Email facoltativa per il lancio</h2>
        <p>Solo se selezioni espressamente «Sì» e inserisci il tuo indirizzo email, l'indirizzo sarà utilizzato esclusivamente per inviarti una comunicazione sul lancio di BIMARIS. Il consenso è facoltativo e non condiziona la partecipazione al sondaggio (art. 6, par. 1, lett. a, GDPR).</p>
        <p>Puoi revocare il consenso in qualunque momento scrivendo a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>, senza pregiudicare la liceità dei trattamenti già effettuati.</p>
        <p>Nessuna newsletter, promozione successiva, comunicazione per conto di operatori terzi o caricamento su pubblici pubblicitari Meta è previsto sulla base di questo consenso.</p>
      </section>
      <section aria-labelledby="live-data">
        <h2 id="live-data">4. Dati, archivi e sicurezza</h2>
        <p>Non è necessario un account Google. Le risposte sono archiviate separatamente dagli eventuali indirizzi email e dalle prove del consenso, senza un identificativo comune tra i due archivi. La separazione riduce il collegamento diretto, ma non rende necessariamente anonimi i contenuti della risposta libera o i dati tecnici.</p>
        <p>Per limitare gli abusi viene utilizzata un'impronta crittografica HMAC dell'indirizzo IP negli archivi applicativi, senza salvare l'IP in chiaro in tali archivi. L'impronta è un dato pseudonimizzato; il fornitore di hosting può trattare log tecnici di rete e sicurezza secondo le proprie condizioni. Non sono previste profilazione o decisioni automatizzate.</p>
      </section>
      <section aria-labelledby="live-retention">
        <h2 id="live-retention">5. Conservazione</h2>
        <p>Le risposte individuali vengono conservate per un massimo di 12 mesi dalla raccolta, con riesame della necessità dopo 90 giorni e cancellazione anticipata se non più necessarie. Possono restare solo statistiche effettivamente anonime.</p>
        <p>L'email e la prova del consenso vengono cancellate entro 30 giorni dall'annuncio del lancio e comunque entro 12 mesi dalla raccolta, secondo il termine precedente. In caso di revoca, il contatto viene escluso dagli invii e cancellato senza ingiustificato ritardo dopo la verifica della richiesta.</p>
        <p>La prova del consenso comprende testo accettato, data, ora e versione dell'informativa e del consenso. Non è prevista una conservazione personale permanente dopo la cancellazione del contatto.</p>
      </section>
      <section aria-labelledby="live-providers">
        <h2 id="live-providers">6. Fornitori, infrastruttura e trasferimenti</h2>
        <p>La pagina del questionario è ospitata su <strong>Vercel</strong>, in un progetto distinto dal sito principale BIMARIS. Le risposte e gli indirizzi email vengono conservati in <strong>Supabase Production</strong>, nel database della regione <strong>eu-west-1 (Irlanda)</strong>.</p>
        <p>La collocazione europea del database non esclude trattamenti tecnici o accessi da paesi terzi da parte dei fornitori e dei loro subfornitori, soggetti alle garanzie previste dagli accordi applicabili. Le risposte individuali e gli indirizzi email non sono pubblicati.</p>
        <p>Riferimenti: <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">DPA Vercel</a>, <a href="https://supabase.com/legal/customer-resources/data-processing-addendum" target="_blank" rel="noopener noreferrer">DPA Supabase</a> e <a href="https://supabase.com/legal/customer-resources/subprocessor-list" target="_blank" rel="noopener noreferrer">subfornitori Supabase</a>.</p>
      </section>
      <section aria-labelledby="live-rights">
        <h2 id="live-rights">7. Diritti</h2>
        <p>Nei casi previsti dal GDPR puoi richiedere accesso, rettifica, cancellazione, limitazione del trattamento e portabilità; puoi opporti ai trattamenti basati sul legittimo interesse e revocare il consenso alle comunicazioni sul lancio.</p>
        <p>Scrivi a <a href="mailto:info@bimarisnet.it">info@bimarisnet.it</a>. Puoi presentare reclamo al <a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>. Quando una singola risposta non è ragionevolmente identificabile, la possibilità di individuarla su richiesta potrebbe essere limitata.</p>
      </section>
    </div>
  </article>;
}
