"use client";

import Link from "next/link";
import type { Experience } from "@bimaris/core";
import { track } from "@/lib/analytics";

export function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <article className="card">
      <div className={`card-media media-${experience.category}`}>
        <span>{experience.category}</span>
      </div>
      <div className="card-body">
        <div className="eyebrow">{experience.location}</div>
        <h3>{experience.name}</h3>
        <p>{experience.excerpt}</p>
        <div className="meta-row">
          {experience.duration && <span>{experience.duration}</span>}
          {experience.priceFrom && <span>Da € {experience.priceFrom}</span>}
        </div>
        <Link
          className="text-link"
          href={`/esperienze/${experience.slug}`}
          onClick={() => track("experience_view", { experience_id: experience.id, source: "card" })}
        >
          Scopri l'esperienza →
        </Link>
      </div>
    </article>
  );
}
