"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { Experience } from "@/lib/types";

function externalUrl(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function whatsappUrl(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

export function ExperienceDetailActions({ experience }: { experience: Experience }) {
  useEffect(() => {
    track("experience_view", {
      experience_id: experience.id,
      experience_name: experience.name,
      territory: experience.territory,
      category: experience.category,
      source: "detail",
    });
  }, [experience]);

  const booking = externalUrl(experience.bookingUrl);
  const whatsapp = whatsappUrl(experience.operatorWhatsapp);
  const website = externalUrl(experience.operatorWebsite);
  const instagram = externalUrl(experience.operatorInstagram);
  const directions = experience.googleMapsQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(experience.googleMapsQuery)}`
    : undefined;

  return (
    <div className="actions" style={{ marginTop: 22 }}>
      {experience.bookable && booking && (
        <a
          className="button"
          href={booking}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("booking_click", { experience_id: experience.id, operator: experience.operatorName })}
        >
          Prenota
        </a>
      )}
      {whatsapp && (
        <a
          className="button"
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_click", { experience_id: experience.id, operator: experience.operatorName })}
        >
          WhatsApp
        </a>
      )}
      {directions && (
        <a
          className="button ghost"
          href={directions}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("directions_click", { experience_id: experience.id })}
        >
          Indicazioni
        </a>
      )}
      {website && (
        <a
          className="button ghost"
          href={website}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("website_click", { experience_id: experience.id, operator: experience.operatorName })}
        >
          Sito operatore
        </a>
      )}
      {instagram && (
        <a
          className="button ghost"
          href={instagram}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("instagram_click", { experience_id: experience.id, operator: experience.operatorName })}
        >
          Instagram
        </a>
      )}
    </div>
  );
}
