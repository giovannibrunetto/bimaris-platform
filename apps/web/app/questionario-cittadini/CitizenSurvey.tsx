"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { launchConsent, questions } from "./questions";
import styles from "./survey.module.css";

export default function CitizenSurvey({ testMode = false, liveMode = false }: { testMode?: boolean; liveMode?: boolean }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<string[][]>([[], [], [], [], []]);
  const [idea, setIdea] = useState("");
  const [consent, setConsent] = useState<"yes" | "no" | "">("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const requestId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);

  function go(next: number) { setError(""); setStep(next); }
  function choose(value: string) {
    const current = answers[step];
    if (step === 2 && !current.includes(value) && current.length === 2) {
      setError("Scegli al massimo due risposte."); return;
    }
    setAnswers(previous => previous.map((values, index) => index !== step ? values : step === 2
      ? values.includes(value) ? values.filter(item => item !== value) : [...values, value]
      : [value]));
    setError("");
  }
  async function finish() {
    if (!testMode && !liveMode) { go(7); return; }
    if (sending) return;
    setSending(true); setError("");
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/questionario-cittadini/invio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestId.current, answers, idea, consent, email, website: "" }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Invio non riuscito.");
      go(7);
    } catch (e) { setError(e instanceof Error ? e.message : "Invio non riuscito. Riprova."); }
    finally { setSending(false); }
  }
  function next() {
    // Match the existing form: questions 1–3 required, 4–5 optional.
    if (step >= 0 && step < 3 && answers[step].length === 0) { setError("Scegli una risposta per continuare."); return; }
    if (step === 5) { if (consent === "yes") go(6); else void finish(); return; }
    if (step === 6) { void finish(); return; }
    go(step + 1);
  }
  const question = step >= 0 && step < 5 ? questions[step] : null;
  const progress = step < 0 ? 0 : Math.min(step + 1, 7);

  return <div className={styles.survey}>
    <header className={styles.topbar}>
      <Link href="/" aria-label="BIMARIS — Messina da vivere" className={styles.wordmark}>BIMARIS <span>Messina da vivere</span></Link>
      <span className={styles.preview}>{liveMode ? "Questionario cittadini" : testMode ? "Collaudo · solo dati fittizi" : "Anteprima · raccolta disattivata"}</span>
    </header>
    <div className={styles.layout}>
      <aside className={styles.brand} aria-label="BIMARIS sta arrivando">
        <div className={styles.visual}>
          {/* Official website asset, used without AI reconstruction. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bimaris-main.jpeg" alt="BIMARIS — Messina da vivere, il marchio sull’acqua" />
        </div>
        <div className={styles.brandCopy}>
          <p className={styles.eyebrow}>Sta arrivando BIMARIS</p>
          <p className={styles.brandTitle}>Messina <em>da vivere.</em></p>
          <span className={styles.rule} />
          <p>Un nuovo modo per scoprire eventi, esperienze, luoghi e attività del territorio.</p>
          <p className={styles.duration}>5 domande <span>·</span> 60–90 secondi</p>
        </div>
      </aside>
      <section className={styles.panel} aria-label="Questionario cittadini">
        {step >= 0 && step < 7 && <div className={styles.progressGroup}>
          <div className={styles.progressLabel}><span>{step < 5 ? `Domanda ${step + 1} di 5` : step === 5 ? "Avviso di lancio · facoltativo" : "Email · facoltativa"}</span><span aria-hidden="true">{String(progress).padStart(2, "0")} / 07</span></div>
          <div className={styles.progress} role="progressbar" aria-label="Avanzamento del questionario" aria-valuemin={0} aria-valuemax={7} aria-valuenow={progress}><span style={{ width: `${progress / 7 * 100}%` }} /></div>
        </div>}
        <div key={step} className={styles.screen}>
          {step === -1 ? <>
            <p className={styles.eyebrow}>La voce di chi vive Messina</p>
            <h1 ref={heading} tabIndex={-1}>A MESSINA<br />NON C’È <span className={styles.strike}>NENTI!</span></h1>
            <p className={styles.subtitle}>O forse non sappiamo dove cercare?</p>
            <p className={styles.intro}>Sta arrivando BIMARIS — Messina da vivere.</p>
            <p>Aiutaci a capire cosa cercano davvero i messinesi. Bastano circa 60–90 secondi.</p>
            <button type="button" className={styles.primary} onClick={() => go(0)}>Inizia il questionario <span aria-hidden="true">→</span></button>
          </> : question ? <>
            <h2 ref={heading} tabIndex={-1}>{question.title}</h2>
            {step === 2 && <p id="choice-help" className={styles.hint}>Puoi scegliere una o due risposte.</p>}
            {step === 4 ? <><p className={styles.hint}>Risposta facoltativa</p><label htmlFor="citizen-idea" className={styles.srOnly}>{question.title}</label><textarea id="citizen-idea" rows={5} maxLength={1000} value={idea} onChange={event => setIdea(event.target.value)} placeholder={testMode ? "COLLAUDO: testo fittizio, nessun dato personale" : "La tua risposta…"} /></>
              : <fieldset className={styles.choices} aria-describedby={step === 2 ? "choice-help" : undefined}>
                <legend className={styles.srOnly}>{question.title}</legend>
                {question.options.map((option, index) => <label key={option} className={`${styles.choice} ${answers[step].includes(option) ? styles.selected : ""}`}>
                  <input type={step === 2 ? "checkbox" : "radio"} name={`question-${step}`} checked={answers[step].includes(option)} onChange={() => choose(option)} />
                  <span className={styles.choiceIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{option}</span>
                </label>)}
              </fieldset>}
          </> : step === 5 ? <>
            <h2 ref={heading} tabIndex={-1}>Vuoi scoprire BIMARIS appena sarà disponibile?</h2>
            <p>Lascia la tua email per ricevere esclusivamente la comunicazione del lancio. Nessuna newsletter o altra promozione. La scelta è facoltativa.</p>
            <a className={styles.privacyLink} href="/privacy-questionario" target="_blank" rel="noopener noreferrer">Leggi l’informativa privacy <span aria-hidden="true">↗</span></a>
            <fieldset className={styles.choices}>
              <legend className={styles.srOnly}>Scelta facoltativa per l’avviso di lancio</legend>
              <label className={`${styles.choice} ${consent === "yes" ? styles.selected : ""}`}><input type="radio" name="launch-consent" checked={consent === "yes"} onChange={() => setConsent("yes")} /><span>{launchConsent}</span></label>
              <label className={`${styles.choice} ${consent === "no" ? styles.selected : ""}`}><input type="radio" name="launch-consent" checked={consent === "no"} onChange={() => { setConsent("no"); setEmail(""); }} /><span>No, grazie</span></label>
            </fieldset>
            {consent && <button className={styles.clear} type="button" onClick={() => { setConsent(""); setEmail(""); }}>Cancella selezione</button>}
          </> : step === 6 ? <>
            <h2 ref={heading} tabIndex={-1}>La tua email per il lancio</h2>
            <label htmlFor="launch-email" className={styles.emailLabel}>Indirizzo email <span>Facoltativo</span></label>
            <input ref={emailInput} id="launch-email" type="email" maxLength={254} autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} placeholder={testMode ? "prova@example.invalid" : "La tua email"} />
          </> : <>
            <p className={styles.eyebrow}>{liveMode ? "Questionario completato" : "Collaudo completato"}</p>
            <h2 ref={heading} tabIndex={-1}>{liveMode ? "Grazie per aver risposto" : "Grazie per aver provato"}<br />{liveMode ? "al questionario." : "il questionario."}</h2>
            <p>{liveMode ? "Le risposte sono state salvate. L’eventuale email è registrata separatamente e sarà utilizzata esclusivamente per l’annuncio del lancio." : testMode ? "Le risposte di prova sono state salvate. L’eventuale email fittizia è registrata in un archivio separato, con la prova del consenso." : "Questa è un’anteprima. Le risposte e l’eventuale email non sono state inviate né salvate."}</p>
            {!liveMode && <p className={styles.hint}>La raccolta rimane disattivata in attesa dell’autorizzazione alla pubblicazione.</p>}
            <button type="button" className={styles.primary} onClick={() => { requestId.current = ""; setAnswers([[], [], [], [], []]); setIdea(""); setEmail(""); setConsent(""); go(-1); }}>Torna all’inizio <span aria-hidden="true">↺</span></button>
          </>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {step >= 0 && step < 7 && <div className={styles.actions}>
            <button type="button" className={styles.back} disabled={sending} onClick={() => go(step - 1)}>← Indietro</button>
            <button type="button" className={styles.primary} disabled={sending} onClick={() => {
              if (step === 6) {
                if (!emailInput.current?.reportValidity()) return;
              }
              next();
            }}>{sending ? "Invio…" : step === 6 || step === 5 && consent !== "yes" ? (liveMode ? "Invia risposte" : "Concludi la prova") : step === 4 ? "Continua" : "Avanti"}<span aria-hidden="true">→</span></button>
          </div>}
        </div>
        <footer className={styles.footer}><span>BIMARIS — Messina da vivere</span><a href="/privacy-questionario" target="_blank" rel="noopener noreferrer">Privacy</a></footer>
      </section>
    </div>
  </div>;
}
