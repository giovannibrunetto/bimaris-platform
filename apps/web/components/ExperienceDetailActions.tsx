"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { Experience } from "@/lib/types";

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

  return (
    <button
      className="button"
      onClick={() => track("whatsapp_click", { experience_id: experience.id, operator: experience.operatorName })}
    >
      Contatta su WhatsApp
    </button>
  );
}
