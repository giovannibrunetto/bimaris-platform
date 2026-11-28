"use client";
import { useState } from "react";
import { proposeExperienceText, type TextProposal } from "@/lib/experience-text-prototype";

// Standalone prototype: not mounted in the live wizard until specific GO.
export default function ExperienceTextPrototype({ value, onAccept }: {
  value: string; onAccept: (text: string) => void;
}) {
  const [proposal, setProposal] = useState<TextProposal | null>(null);
  const [edited, setEdited] = useState("");
  const [error, setError] = useState("");
  function generate() {
    setError(""); setProposal(null);
    try {
      const result = proposeExperienceText(value);
      setProposal(result); setEdited(result.proposed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Elaborazione non disponibile. Il testo originale è conservato.");
    }
  }
  const stale = proposal !== null && proposal.original !== value;
  return <section aria-label="Prototipo miglioramento testo">
    <button type="button" onClick={generate}>Migliora il testo</button>
    <p>Prototipo locale: migliora soltanto la spaziatura, senza riscrivere i contenuti.</p>
    {error && <p role="alert">{error}</p>}
    {proposal && <div>
      <label>Testo originale<textarea readOnly rows={7} value={proposal.original}/></label>
      <label>Testo proposto<textarea rows={7} value={edited} onChange={event => setEdited(event.target.value)}/></label>
      {!proposal.changed && <p>Non sono necessarie correzioni di spaziatura.</p>}
      {stale && <p role="alert">Il testo originale è cambiato. Genera una nuova proposta.</p>}
      <p>Le modifiche manuali sono sotto la tua responsabilità. Accettare aggiorna solo il campo; non salva né pubblica.</p>
      <button type="button" disabled={stale || !edited.trim()} onClick={() => { onAccept(edited); setProposal(null); }}>Usa proposta</button>
      <button type="button" onClick={() => setProposal(null)}>Mantieni originale</button>
    </div>}
  </section>;
}
