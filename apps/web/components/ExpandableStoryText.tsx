"use client";

import { useState } from "react";

const paragraphStyle = { fontSize: 15, lineHeight: 1.5, color: "#344448" };

export function ExpandableStoryText({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="text-link"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
        style={{
          appearance: "none",
          border: 0,
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          font: "inherit",
          fontWeight: 700,
        }}
      >
        {expanded ? "Riduci ↑" : "Continua a leggere ↓"}
      </button>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {paragraphs.map((paragraph, index) => (
            <p key={index} style={{ ...paragraphStyle, margin: index === 0 ? 0 : "8px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
