"use client";

import { useMemo, useState } from "react";
import type { Experience } from "@/lib/types";
import { ExperienceCard } from "@/components/ExperienceCard";
import { track } from "@/lib/analytics";

export function ExperienceExplorer({ experiences, initialCategory = "all" }: { experiences: Experience[]; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [territory, setTerritory] = useState("all");

  const categories = useMemo(() => {
    const values = new Map<string, string>();
    experiences.forEach(item => values.set(item.category, item.categoryName));
    return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1], "it"));
  }, [experiences]);

  const territories = useMemo(() => {
    const values = new Map<string, string>();
    experiences.forEach(item => values.set(item.territory, item.location));
    return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1], "it"));
  }, [experiences]);

  const filtered = experiences.filter(item =>
    (category === "all" || item.category === category) &&
    (territory === "all" || item.territory === territory),
  );

  function chooseCategory(value: string) {
    setCategory(value);
    track("filter_used", { section: "experiences", filter: "category", value });
  }

  function chooseTerritory(value: string) {
    setTerritory(value);
    track("filter_used", { section: "experiences", filter: "territory", value });
  }

  return (
    <>
      <div className="detail-panel experience-filters" aria-label="Filtra le esperienze">
        <div className="experience-filter-grid">
          <label className="experience-filter-field">
            <span>Categoria</span>
            <select value={category} onChange={event => chooseCategory(event.target.value)}>
              <option value="all">Tutte le categorie</option>
              {categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
          <label className="experience-filter-field">
            <span>Territorio</span>
            <select value={territory} onChange={event => chooseTerritory(event.target.value)}>
              <option value="all">Tutti i territori</option>
              {territories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
        </div>
        <p className="muted experience-filter-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "esperienza disponibile" : "esperienze disponibili"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="cards experience-results">{filtered.map(experience => <ExperienceCard key={experience.id} experience={experience} />)}</div>
      ) : (
        <div className="detail-panel experience-empty" role="status">
          <div className="kicker">Nessun risultato</div>
          <h3>Nessuna esperienza corrisponde ai filtri selezionati.</h3>
          <p className="muted">Modifica la categoria o il territorio per vedere le altre proposte disponibili.</p>
        </div>
      )}

      <style jsx>{`
        .experience-filters { margin-bottom: 28px; }
        .experience-filter-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .experience-filter-field { display: grid; gap: 8px; font-weight: 700; }
        .experience-filter-field span { font-size: 14px; }
        .experience-filter-field select { width: 100%; min-height: 48px; padding: 10px 12px; border-radius: 10px; }
        .experience-filter-field select:focus-visible { outline: 3px solid var(--color-accent, #CAA86A); outline-offset: 2px; }
        .experience-filter-count { margin: 14px 0 0; }
        .experience-empty h3 { margin-bottom: 8px; }
        .experience-empty p { margin-bottom: 0; }
        @media (max-width: 700px) {
          .experience-filter-grid { grid-template-columns: 1fr; gap: 14px; }
          .experience-filters { margin-bottom: 20px; }
        }
      `}</style>
    </>
  );
}
