"use client";

import { useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import type { VillagePoint } from "@/data/villages";

type Props = { villageName: string; points: VillagePoint[] };
type Mode = "walking" | "driving";

function pointLocation(point: VillagePoint) {
  if (typeof point.latitude === "number" && typeof point.longitude === "number") return `${point.latitude},${point.longitude}`;
  return point.googleMapsQuery;
}

function routeUrl(points: VillagePoint[], mode: Mode) {
  if (!points.length) return "";
  const locations = points.map(pointLocation);
  const params = new URLSearchParams({ api: "1", destination: locations[locations.length - 1], travelmode: mode });
  if (locations.length > 1) params.set("origin", locations[0]);
  if (locations.length > 2) params.set("waypoints", locations.slice(1, -1).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function isMontalbanoNaturePoint(villageName: string, point: VillagePoint) {
  if (villageName !== "Montalbano Elicona") return false;
  return point.name === "Area dell’Argimusco" || point.name === "Bosco di Malabotta";
}

export default function VillageRouteBuilder({ villageName, points }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [mode, setMode] = useState<Mode>("walking");
  const selectedPoints = useMemo(() => selected.map(index => points[index]).filter(Boolean), [points, selected]);
  const hasNatureStops = selectedPoints.some(point => isMontalbanoNaturePoint(villageName, point));
  const effectiveMode: Mode = hasNatureStops ? "driving" : mode;
  const url = routeUrl(selectedPoints, effectiveMode);
  const centrePoints = points.map((point, index) => ({ point, index })).filter(({ point }) => !isMontalbanoNaturePoint(villageName, point));
  const naturePoints = points.map((point, index) => ({ point, index })).filter(({ point }) => isMontalbanoNaturePoint(villageName, point));

  const toggle = (index: number) => {
    setSelected(current => current.includes(index) ? current.filter(value => value !== index) : current.length < 10 ? [...current, index] : current);
  };

  const renderPoint = (point: VillagePoint, index: number) => {
    const order = selected.indexOf(index);
    const active = order >= 0;
    return <button type="button" key={point.id} onClick={() => toggle(index)} aria-pressed={active} style={{ display: "grid", gridTemplateColumns: "42px 1fr auto", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: "14px 16px", border: active ? "1px solid #caa86a" : "1px solid #dfe4e8", borderRadius: 14, background: active ? "#f7f0e4" : "#fff", color: "#101820", cursor: "pointer" }}>
      <span style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", background: active ? "#caa86a" : "#061624", color: active ? "#101820" : "#caa86a", fontWeight: 700 }}>{active ? order + 1 : index + 1}</span>
      <span style={{ display: "grid", gap: 3 }}><strong>{point.name}</strong><small style={{ color: "#6e7680" }}>{active ? `Tappa ${order + 1} del tuo itinerario` : "Seleziona questa tappa"}</small></span>
      <span aria-hidden="true" style={{ color: active ? "#101820" : "#8d6b34", fontSize: 20 }}>{active ? "✓" : "+"}</span>
    </button>;
  };

  return <>
    <h3>Cosa vedere</h3>
    <p style={{ color: "#6e7680", lineHeight: 1.6 }}>Seleziona i luoghi che vuoi visitare. BIMARIS manterrà l'ordine con cui li scegli e creerà il percorso tra le sole tappe selezionate.</p>

    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>{centrePoints.map(({ point, index }) => renderPoint(point, index))}</div>

    {naturePoints.length > 0 && <section style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e6e9" }}>
      <strong style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 20 }}>Nei dintorni di Montalbano</strong>
      <p style={{ color: "#6e7680", lineHeight: 1.55, marginTop: 6 }}>Argimusco e Bosco di Malabotta sono tappe naturalistiche fuori dal centro storico. Se ne selezioni almeno una, BIMARIS imposterà automaticamente il percorso in auto.</p>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>{naturePoints.map(({ point, index }) => renderPoint(point, index))}</div>
    </section>}

    {selectedPoints.length > 0 && <div style={{ marginTop: 18, padding: 18, borderRadius: 16, background: "#061624", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div><strong style={{ fontFamily: "Georgia, serif", fontSize: 20 }}>Il mio itinerario a {villageName}</strong><div style={{ marginTop: 4, color: "#c4cdd3", fontSize: 13 }}>{selectedPoints.length} {selectedPoints.length === 1 ? "tappa selezionata" : "tappe selezionate"}</div></div>
        <button type="button" onClick={() => setSelected([])} style={{ border: 0, background: "transparent", color: "#d6c29b", fontWeight: 700, cursor: "pointer" }}>Svuota</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {!hasNatureStops && <button type="button" onClick={() => setMode("walking")} aria-pressed={mode === "walking"} style={{ border: mode === "walking" ? "1px solid #caa86a" : "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "8px 12px", background: mode === "walking" ? "#caa86a" : "transparent", color: mode === "walking" ? "#101820" : "#fff", fontWeight: 700, cursor: "pointer" }}>A piedi</button>}
        <button type="button" onClick={() => setMode("driving")} aria-pressed={effectiveMode === "driving"} style={{ border: effectiveMode === "driving" ? "1px solid #caa86a" : "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "8px 12px", background: effectiveMode === "driving" ? "#caa86a" : "transparent", color: effectiveMode === "driving" ? "#101820" : "#fff", fontWeight: 700, cursor: "pointer" }}>In auto</button>
        <a className="button" href={url} target="_blank" rel="noreferrer" onClick={() => track("village_custom_route_open_google", { village: villageName, stops: selectedPoints.length, travel_mode: effectiveMode })}>Indicazioni per le tappe selezionate</a>
      </div>
      {hasNatureStops && <div style={{ marginTop: 10, color: "#d6c29b", fontSize: 12 }}>Percorso in auto attivato perché hai incluso una tappa naturalistica fuori dal borgo.</div>}
      <div style={{ marginTop: 8, color: "#9eabb4", fontSize: 11 }}>Puoi scegliere fino a 10 tappe. L'itinerario segue l'ordine di selezione.</div>
    </div>}
  </>;
}
