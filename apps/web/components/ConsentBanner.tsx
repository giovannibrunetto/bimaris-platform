"use client";

import { useState, useSyncExternalStore } from "react";
import { readConsent, saveConsent, type ConsentState } from "@/lib/analytics";

const allOn: ConsentState = { analytics: true, personalization: true, marketing: true };
const allOff: ConsentState = { analytics: false, personalization: false, marketing: false };

function subscribeConsent(callback: () => void) {
  window.addEventListener("bimaris-consent-changed", callback);
  return () => window.removeEventListener("bimaris-consent-changed", callback);
}

function getConsentSnapshot() {
  return readConsent() ? "set" : "unset";
}

function getServerConsentSnapshot() {
  return "loading";
}

export function ConsentBanner() {
  const consentStatus = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [details, setDetails] = useState(false);
  const [state, setState] = useState<ConsentState>({ analytics: true, personalization: false, marketing: false });

  if (consentStatus !== "unset") return null;

  const commit = (value: ConsentState) => {
    saveConsent(value);
  };

  return (
    <div className="consent" role="dialog" aria-label="Preferenze privacy">
      <div>
        <strong>Privacy e misurazione</strong>
        <p>Usiamo strumenti necessari per il sito. Analytics, personalizzazione e marketing vengono attivati solo secondo le tue scelte.</p>
      </div>
      {details && (
        <div className="consent-options">
          <label><input type="checkbox" checked readOnly /> Necessari</label>
          <label><input type="checkbox" checked={state.analytics} onChange={e => setState({ ...state, analytics: e.target.checked })} /> Analytics</label>
          <label><input type="checkbox" checked={state.personalization} onChange={e => setState({ ...state, personalization: e.target.checked })} /> Personalizzazione</label>
          <label><input type="checkbox" checked={state.marketing} onChange={e => setState({ ...state, marketing: e.target.checked })} /> Marketing</label>
        </div>
      )}
      <div className="consent-actions">
        <button className="button ghost" onClick={() => setDetails(v => !v)}>Personalizza</button>
        <button className="button ghost" onClick={() => commit(allOff)}>Solo necessari</button>
        {details ? (
          <button className="button" onClick={() => commit(state)}>Salva scelte</button>
        ) : (
          <button className="button" onClick={() => commit(allOn)}>Accetta tutti</button>
        )}
      </div>
    </div>
  );
}
