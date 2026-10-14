"use client";

import { useMemo, useState } from "react";
import type { Experience } from "@/lib/types";
import { ExperienceCard } from "@/components/ExperienceCard";
import { track } from "@/lib/analytics";

export function ExperienceExplorer({ experiences }: { experiences: Experience[] }) {
  const [category, setCategory] = useState("all");
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
      <div className="detail-panel" style={{ marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          <label>
            Categoria
            <select value={category} onChange={event => chooseCategory(event.target.value)}>
              <option value="all">Tutte le categorie</option>
              {categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
          <label>
            Territorio
            <select value={territory} onChange={event => chooseTerritory(event.target.value)}>
              <option value="all">Tutti i territori</option>
              {territories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 14 }}>
          {filtered.length} {filtered.length === 1 ? "esperienza disponibile" : "esperienze disponibili"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="cards">{filtered.map(experience => <ExperienceCard key={experience.id} experience={experience} />)}</div>
      ) : (
        <div className="detail-panel"><p>Nessuna esperienza corrisponde ai filtri selezionati.</p></div>
      )}
    </>
  );
}
