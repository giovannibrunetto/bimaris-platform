"use client";

import Link from "next/link";
import type { Experience } from "@/lib/types";
import { track } from "@/lib/analytics";

export function ExperienceCard({ experience, href, availabilityNote }: { experience: Experience; href?: string; availabilityNote?: string }) {
  return (
    <article className="card culture-card card-hit-area">
      {experience.imageUrl ? (
        <div className="culture-card-media">
          <img src={experience.imageUrl} alt={experience.imageAlt ?? experience.name} loading="lazy" decoding="async" />
          <span>{experience.categoryName}</span>
        </div>
      ) : (
        <div className={`card-media media-${experience.category}`}>
          <span>{experience.categoryName}</span>
        </div>
      )}
      <div className="card-body">
        <div className="eyebrow">{experience.location}</div>
        <h3>{experience.name}</h3>
        <p>{experience.excerpt}</p>
        <div className="meta-row">
          {experience.duration && <span>{experience.duration}</span>}
          {experience.priceFrom != null && <span>Da € {experience.priceFrom}</span>}
          {experience.bookable && <span>Prenotabile</span>}
        </div>
        {availabilityNote && <p>{availabilityNote}</p>}
        <Link
          className="text-link card-primary-link"
          aria-label={`Scopri ${experience.name}`}
          href={href ?? `/esperienze/${experience.slug}`}
          onClick={() => track("experience_view", { experience_id: experience.id, source: "card" })}
        >
          Scopri l'esperienza →
        </Link>
      </div>
    </article>
  );
}
