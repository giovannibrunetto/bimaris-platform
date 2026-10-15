"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";

declare global { interface Window { google?: any } }

const CENTER = { lat: 38.1938, lng: 15.5540 };
type Kind = "culture" | "legend" | "operator" | "experience";
export type MapFilterKey = "cultura" | "miti-leggende" | "sapori-territori" | "borghi" | "esperienze" | "operatori";
type Filter = "all" | MapFilterKey;
type Mode = "walking" | "driving";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Tutto" },
  { key: "cultura", label: "Monumenti e cultura" },
  { key: "miti-leggende", label: "Miti e leggende" },
  { key: "sapori-territori", label: "Sapori e territori" },
  { key: "borghi", label: "Borghi" },
  { key: "esperienze", label: "Esperienze" },
  { key: "operatori", label: "Operatori" },
];

export type BimarisMapPoint = {
  id: string; kind: Kind; title: string; address?: string; googleMapsQuery: string;
  latitude?: number; longitude?: number; filterCategories: MapFilterKey[]; categoryLabel?: string;
  links: Array<{ label: string; href: string }>;
};

const keyOf = (point: BimarisMapPoint) => `${point.kind}:${point.id}`;
const colorOf = (kind: Kind) => kind === "culture" ? "#caa86a" : kind === "operator" ? "#244b3b" : kind === "experience" ? "#8a5a35" : "#376070";
const letterOf = (kind: Kind) => kind === "culture" ? "C" : kind === "operator" ? "O" : kind === "experience" ? "E" : "M";
const kindLabel = (kind: Kind) => kind === "culture" ? "Monumento" : kind === "operator" ? "Operatore BIMARIS" : kind === "experience" ? "Esperienza BIMARIS" : "Miti e leggende";

function markerIcon(maps: any, kind: Kind, selected: boolean) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 1C9.5 1 1 9.5 1 20c0 14 19 31 19 31s19-17 19-31C39 9.5 30.5 1 20 1Z" fill="${colorOf(kind)}" stroke="${selected ? "#101820" : "#fff"}" stroke-width="${selected ? 4 : 2}"/><circle cx="20" cy="20" r="9" fill="rgba(3,17,26,.3)"/></svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new maps.Size(40, 52), anchor: new maps.Point(20, 51), labelOrigin: new maps.Point(20, 20) };
}

function mapsRouteUrl(points: BimarisMapPoint[], mode: Mode) {
  if (!points.length) return "";
  const params = new URLSearchParams({ api: "1", destination: points[points.length - 1].googleMapsQuery, travelmode: mode });
  if (points.length > 1) params.set("origin", points[0].googleMapsQuery);
  if (points.length > 2) params.set("waypoints", points.slice(1, -1).map(p => p.googleMapsQuery).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function BimarisGoogleMap({ points }: { points: BimarisMapPoint[] }) {
  const el = useRef<HTMLDivElement | null>(null); const map = useRef<any>(null); const info = useRef<any>(null); const markers = useRef<any[]>([]); const cache = useRef(new Map<string, { lat: number; lng: number }>());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading"); const [filter, setFilter] = useState<Filter>("all"); const [selected, setSelected] = useState<string[]>([]); const [mode, setMode] = useState<Mode>("walking");
  const selectedPoints = useMemo(() => selected.map(k => points.find(p => keyOf(p) === k)).filter(Boolean) as BimarisMapPoint[], [points, selected]); const routeUrl = mapsRouteUrl(selectedPoints, mode);
  const available = FILTERS.filter(f => f.key === "all" || f.key === "borghi" || points.some(p => p.filterCategories.includes(f.key as MapFilterKey)));
  const count = (f: Filter) => f === "all" ? points.length : points.filter(p => p.filterCategories.includes(f)).length;
  const toggle = (point: BimarisMapPoint) => { const key = keyOf(point); setSelected(current => current.includes(key) ? current.filter(v => v !== key) : current.length < 10 ? [...current, key] : current); info.current?.close(); };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; if (!apiKey) { setStatus("error"); return; }
    const init = () => { if (!el.current || !window.google?.maps || map.current) return; map.current = new window.google.maps.Map(el.current, { center: CENTER, zoom: 12, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: "greedy" }); info.current = new window.google.maps.InfoWindow(); setStatus("ready"); track("map_open", { points: points.length }); };
    if (window.google?.maps) { init(); return; } const existing = document.getElementById("bimaris-google-maps") as HTMLScriptElement | null; if (existing) { existing.addEventListener("load", init, { once: true }); return; }
    const script = document.createElement("script"); script.id = "bimaris-google-maps"; script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`; script.async = true; script.defer = true; script.addEventListener("load", init, { once: true }); script.addEventListener("error", () => setStatus("error"), { once: true }); document.head.appendChild(script);
  }, [points.length]);

  useEffect(() => {
    if (status !== "ready" || !map.current || !window.google?.maps) return; const maps = window.google.maps; const geocoder = new maps.Geocoder(); let cancelled = false; markers.current.forEach(m => m.setMap(null)); markers.current = []; info.current?.close();
    const visible = filter === "all" ? points : points.filter(p => p.filterCategories.includes(filter));
    const resolve = async (point: BimarisMapPoint) => { if (Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) return { lat: point.latitude!, lng: point.longitude! }; const cached = cache.current.get(point.googleMapsQuery); if (cached) return cached; try { const r = await geocoder.geocode({ address: point.googleMapsQuery }); const l = r.results?.[0]?.geometry?.location; if (!l) return null; const pos = { lat: l.lat(), lng: l.lng() }; cache.current.set(point.googleMapsQuery, pos); return pos; } catch { return null; } };
    (async () => { const bounds = new maps.LatLngBounds(); let rendered = 0; for (const point of visible) { const pos = await resolve(point); if (cancelled || !pos) continue; const index = selected.indexOf(keyOf(point)); const isSelected = index >= 0; const marker = new maps.Marker({ map: map.current, position: pos, title: point.title, icon: markerIcon(maps, point.kind, isSelected), label: { text: isSelected ? String(index + 1) : letterOf(point.kind), color: "#fff", fontSize: "11px", fontWeight: "700" }, zIndex: isSelected ? 100 + index : 10 }); marker.addListener("click", () => { const root = document.createElement("div"); root.style.maxWidth = "280px"; root.style.color = "#101820"; root.style.fontFamily = "Arial, sans-serif"; const meta = document.createElement("div"); meta.textContent = point.categoryLabel ? `${kindLabel(point.kind)} · ${point.categoryLabel}` : kindLabel(point.kind); meta.style.color = colorOf(point.kind); meta.style.fontSize = "11px"; meta.style.fontWeight = "700"; root.appendChild(meta); const title = document.createElement("div"); title.textContent = point.title; title.style.fontFamily = "Georgia, serif"; title.style.fontSize = "20px"; title.style.fontWeight = "700"; title.style.margin = "7px 0"; root.appendChild(title); if (point.address) { const a = document.createElement("div"); a.textContent = point.address; a.style.fontSize = "13px"; a.style.color = "#59656d"; a.style.marginBottom = "10px"; root.appendChild(a); } const add = document.createElement("button"); add.type = "button"; add.textContent = isSelected ? `Rimuovi dal percorso · tappa ${index + 1}` : "Aggiungi al mio percorso"; add.style.width = "100%"; add.style.padding = "9px"; add.style.borderRadius = "10px"; add.style.border = "1px solid #caa86a"; add.style.background = isSelected ? "#101820" : "#f7f0e4"; add.style.color = isSelected ? "#fff" : "#101820"; add.style.fontWeight = "700"; add.style.cursor = "pointer"; add.onclick = () => toggle(point); root.appendChild(add); point.links.forEach(link => { const a = document.createElement("a"); a.href = link.href; a.textContent = `${link.label} →`; a.style.display = "block"; a.style.marginTop = "8px"; a.style.color = "#8d6b34"; a.style.fontSize = "13px"; a.style.fontWeight = "700"; a.style.textDecoration = "none"; root.appendChild(a); }); info.current?.setContent(root); info.current?.open({ map: map.current, anchor: marker }); track("map_marker_click", { point_id: point.id, kind: point.kind, title: point.title, filter }); }); markers.current.push(marker); bounds.extend(pos); rendered++; } if (cancelled || !rendered) return; if (rendered === 1) { map.current.setCenter(bounds.getCenter()); map.current.setZoom(15); } else { map.current.fitBounds(bounds, 58); maps.event.addListenerOnce(map.current, "idle", () => { if (map.current.getZoom() > 14) map.current.setZoom(14); }); } })(); return () => { cancelled = true; };
  }, [filter, points, selected, status]);

  return <div style={{ position: "relative" }}>
    <div ref={el} aria-label="Mappa interattiva BIMARIS di Messina" style={{ width: "100%", minHeight: "620px", borderRadius: 26, overflow: "hidden", background: "#e8ecef" }} />
    {status === "loading" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}><div className="detail-panel">Caricamento della mappa…</div></div>}
    {status === "error" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}><div className="detail-panel"><h3>Mappa temporaneamente non disponibile</h3></div></div>}
    {status === "ready" && <>
      <div aria-label="Filtra i punti BIMARIS per categoria" style={{ position: "absolute", left: 18, right: 18, top: 18, zIndex: 3, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {available.map(f => <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); track("filter_used", { section: "map", filter: "category", value: f.key }); }} style={{ flex: "0 0 auto", border: filter === f.key ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.14)", borderRadius: 999, padding: "10px 14px", background: filter === f.key ? "#101820" : "rgba(255,255,255,.96)", color: filter === f.key ? "#fff" : "#101820", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{f.label} <span style={{ opacity: .72 }}>({count(f.key)})</span></button>)}
      </div>
      {selectedPoints.length > 0 && <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, zIndex: 4, background: "rgba(255,255,255,.97)", color: "#101820", borderRadius: 18, padding: 14, boxShadow: "0 12px 34px rgba(7,24,35,.22)", maxHeight: "44%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><div><strong style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>Il mio percorso</strong><div style={{ fontSize: 12, color: "#68737a" }}>{selectedPoints.length} {selectedPoints.length === 1 ? "tappa" : "tappe"}</div></div><button type="button" onClick={() => setSelected([])} style={{ border: 0, background: "transparent", color: "#7a4b43", fontWeight: 700, cursor: "pointer" }}>Svuota</button></div>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "10px 0" }}>{selectedPoints.map((p, i) => <button key={keyOf(p)} type="button" onClick={() => toggle(p)} style={{ flex: "0 0 auto", border: "1px solid rgba(3,17,26,.12)", borderRadius: 999, padding: "7px 10px", background: "#f7f0e4", color: "#101820", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{i + 1}. {p.title} ×</button>)}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}><button type="button" onClick={() => setMode("walking")} aria-pressed={mode === "walking"} style={{ border: mode === "walking" ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.15)", borderRadius: 999, padding: "8px 11px", background: mode === "walking" ? "#101820" : "#fff", color: mode === "walking" ? "#fff" : "#101820", fontWeight: 700, cursor: "pointer" }}>A piedi</button><button type="button" onClick={() => setMode("driving")} aria-pressed={mode === "driving"} style={{ border: mode === "driving" ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.15)", borderRadius: 999, padding: "8px 11px", background: mode === "driving" ? "#101820" : "#fff", color: mode === "driving" ? "#fff" : "#101820", fontWeight: 700, cursor: "pointer" }}>In auto</button><a className="button" href={routeUrl} target="_blank" rel="noreferrer" onClick={() => track("map_custom_route_open_google", { stops: selectedPoints.length, travel_mode: mode })}>Indicazioni per le tappe selezionate</a></div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#778188" }}>Puoi selezionare fino a 10 tappe. L'ordine del percorso segue l'ordine di selezione.</div>
      </div>}
    </>}
  </div>;
}
