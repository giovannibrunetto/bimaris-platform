"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
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

function interestForCategory(category: string) {
  if (category === "degustazioni") return "sapori";
  if (category === "mare") return "mare";
  if (category === "avventura") return "avventura";
  if (category === "trekking-natura") return "natura-trekking";
  return "esperienze";
}

async function recordIntent(experience: Experience, eventType: string, weight: number) {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return;

  const auth = await supabase.auth.getUser();
  if (!auth.data.user) return;

  await supabase.rpc("record_user_behavior", {
    p_event_type: eventType,
    p_content_type: "experience",
    p_content_id: experience.slug,
    p_interest_key: interestForCategory(experience.category),
    p_weight: weight,
  });
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

  const signal = (analyticsEvent: string, behaviorEvent: string, weight: number, extra: Record<string, unknown> = {}) => {
    track(analyticsEvent, { experience_id: experience.id, ...extra });
    void recordIntent(experience, behaviorEvent, weight);
  };

  return (
    <div className="actions" style={{ marginTop: 22 }}>
      {experience.bookable && booking && (
        <a className="button" href={booking} target="_blank" rel="noreferrer" onClick={() => signal("booking_click", "booking_intent", 4, { operator: experience.operatorName })}>
          Prenota
        </a>
      )}
      {whatsapp && (
        <a className="button" href={whatsapp} target="_blank" rel="noreferrer" onClick={() => signal("whatsapp_click", "contact_intent", 3, { operator: experience.operatorName })}>
          WhatsApp
        </a>
      )}
      {directions && (
        <a className="button ghost" href={directions} target="_blank" rel="noreferrer" onClick={() => signal("directions_click", "directions_open", 2)}>
          Indicazioni
        </a>
      )}
      {website && (
        <a className="button ghost" href={website} target="_blank" rel="noreferrer" onClick={() => signal("website_click", "operator_site_open", 2, { operator: experience.operatorName })}>
          Sito operatore
        </a>
      )}
      {instagram && (
        <a className="button ghost" href={instagram} target="_blank" rel="noreferrer" onClick={() => signal("instagram_click", "operator_social_open", 1.5, { operator: experience.operatorName })}>
          Instagram
        </a>
      )}
    </div>
  );
}
