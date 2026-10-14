"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CultureEntry, HistoricalPeriodKey } from "@/lib/types";
import { HISTORICAL_PERIODS, historicalPeriodLabel } from "@/lib/historical-periods";
import { track } from "@/lib/analytics";

declare global {
  interface Window {
    google?: any;
  }
}

const MESSINA_CENTER = { lat: 38.1938, lng: 15.5540 };
type EraKey = "all" | Exclude<HistoricalPeriodKey, "trasversale">;
type TravelMode = "walking" | "driving";

function routeUrl(entries: CultureEntry[], mode: TravelMode) {
  if (!entries.length) return "";
  const destination = entries[entries.length - 1];
  const params = new URLSearchParams({
    api: "1",
    destination: destination.googleMapsQuery,
    travelmode: mode,
  });

  if (entries.length > 1) params.set("origin", entries[0].googleMapsQuery);
  if (entries.length > 2) {
    params.set("waypoints", entries.slice(1, -1).map(entry => entry.googleMapsQuery).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function markerIcon(maps: any, selected: boolean) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 1C9.5 1 1 9.5 1 20c0 14 19 31 19 31s19-17 19-31C39 9.5 30.5 1 20 1Z" fill="#caa86a" stroke="${selected ? "#101820" : "#ffffff"}" stroke-width="${selected ? 4 : 2}"/><circle cx="20" cy="20" r="9" fill="rgba(3,17,26,.30)"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(40, 52),
    anchor: new maps.Point(20, 51),
    labelOrigin: new maps.Point(20, 20),
  };
}

export function HistoricalCultureMap({
  entries,
  initialPeriod = "all",
}: {
  entries: CultureEntry[];
  initialPeriod?: EraKey;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const coordinateCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activePeriod, setActivePeriod] = useState<EraKey>(initialPeriod);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");

  const historicalEntries = useMemo(
    () => entries.filter(entry => entry.historicalPeriods.length > 0),
    [entries],
  );

  const selectedEntries = useMemo(
    () => selectedIds
      .map(id => historicalEntries.find(entry => entry.id === id))
      .filter((entry): entry is CultureEntry => Boolean(entry)),
    [historicalEntries, selectedIds],
  );

  const googleRouteUrl = routeUrl(selectedEntries, travelMode);

  const visibleEntries = useMemo(
    () => activePeriod === "all"
      ? historicalEntries
      : historicalEntries.filter(entry => entry.historicalPeriods.includes(activePeriod)),
    [activePeriod, historicalEntries],
  );

  const periodCount = (period: EraKey) => period === "all"
    ? historicalEntries.length
    : historicalEntries.filter(entry => entry.historicalPeriods.includes(period)).length;

  const toggleEntry = (entry: CultureEntry) => {
    setSelectedIds(current => {
      if (current.includes(entry.id)) return current.filter(id => id !== entry.id);
      if (current.length >= 8) return current;
      return [...current, entry.id];
    });
    infoWindowRef.current?.close();
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("error");
      return;
    }

    const initialiseMap = () => {
      if (!mapElement.current || !window.google?.maps || mapRef.current) return;
      mapRef.current = new window.google.maps.Map(mapElement.current, {
        center: MESSINA_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
      });
      infoWindowRef.current = new window.google.maps.InfoWindow();
      setStatus("ready");
      track("map_open", { section: "historical_map", points: historicalEntries.length });
    };

    if (window.google?.maps) {
      initialiseMap();
      return;
    }

    const existingScript = document.getElementById("bimaris-google-maps") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", initialiseMap, { once: true });
      existingScript.addEventListener("error", () => setStatus("error"), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "bimaris-google-maps";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", initialiseMap, { once: true });
    script.addEventListener("error", () => setStatus("error"), { once: true });
    document.head.appendChild(script);
  }, [historicalEntries.length]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;

    const maps = window.google.maps;
    const map = mapRef.current;
    const geocoder = new maps.Geocoder();
    let cancelled = false;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const resolvePosition = async (entry: CultureEntry) => {
      if (Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude)) {
        return { lat: entry.latitude as number, lng: entry.longitude as number };
      }

      const cached = coordinateCacheRef.current.get(entry.googleMapsQuery);
      if (cached) return cached;

      try {
        const response = await geocoder.geocode({ address: entry.googleMapsQuery });
        const location = response.results?.[0]?.geometry?.location;
        if (!location) return null;
        const position = { lat: location.lat(), lng: location.lng() };
        coordinateCacheRef.current.set(entry.googleMapsQuery, position);
        return position;
      } catch {
        return null;
      }
    };

    const renderMarkers = async () => {
      const bounds = new maps.LatLngBounds();
      let rendered = 0;

      for (const entry of visibleEntries) {
        const position = await resolvePosition(entry);
        if (cancelled || !position) continue;

        const selectedIndex = selectedIds.indexOf(entry.id);
        const isSelected = selectedIndex >= 0;
        const marker = new maps.Marker({
          map,
          position,
          title: entry.title,
          icon: markerIcon(maps, isSelected),
          label: {
            text: isSelected ? String(selectedIndex + 1) : "C",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          },
          zIndex: isSelected ? 100 + selectedIndex : 20,
        });

        marker.addListener("click", () => {
          const root = document.createElement("div");
          root.style.maxWidth = "290px";
          root.style.color = "#101820";
          root.style.fontFamily = "Arial, Helvetica, sans-serif";

          const era = document.createElement("div");
          era.textContent = historicalPeriodLabel(entry.primaryHistoricalPeriod) ?? "Luogo storico";
          era.style.color = "#9a7336";
          era.style.fontSize = "11px";
          era.style.fontWeight = "700";
          era.style.letterSpacing = ".08em";
          era.style.textTransform = "uppercase";
          root.appendChild(era);

          const title = document.createElement("div");
          title.textContent = entry.title;
          title.style.fontFamily = "Georgia, serif";
          title.style.fontSize = "20px";
          title.style.fontWeight = "700";
          title.style.margin = "7px 0";
          root.appendChild(title);

          if (entry.historicalPeriodNote) {
            const note = document.createElement("div");
            note.textContent = entry.historicalPeriodNote;
            note.style.fontSize = "13px";
            note.style.lineHeight = "1.45";
            note.style.color = "#59656d";
            note.style.marginBottom = "10px";
            root.appendChild(note);
          }

          if (entry.address) {
            const address = document.createElement("div");
            address.textContent = entry.address;
            address.style.fontSize = "12px";
            address.style.color = "#68737a";
            address.style.marginBottom = "10px";
            root.appendChild(address);
          }

          const routeButton = document.createElement("button");
          routeButton.type = "button";
          routeButton.textContent = isSelected
            ? `Rimuovi dal percorso · tappa ${selectedIndex + 1}`
            : "Aggiungi al percorso storico";
          routeButton.style.width = "100%";
          routeButton.style.padding = "9px";
          routeButton.style.borderRadius = "10px";
          routeButton.style.border = "1px solid #caa86a";
          routeButton.style.background = isSelected ? "#101820" : "#f7f0e4";
          routeButton.style.color = isSelected ? "#ffffff" : "#101820";
          routeButton.style.fontWeight = "700";
          routeButton.style.cursor = "pointer";
          routeButton.onclick = () => toggleEntry(entry);
          root.appendChild(routeButton);

          const detailLink = document.createElement("a");
          detailLink.href = `/cultura/${entry.slug}`;
          detailLink.textContent = "Apri la scheda culturale →";
          detailLink.style.display = "block";
          detailLink.style.marginTop = "9px";
          detailLink.style.color = "#8d6b34";
          detailLink.style.fontSize = "13px";
          detailLink.style.fontWeight = "700";
          detailLink.style.textDecoration = "none";
          root.appendChild(detailLink);

          infoWindowRef.current?.setContent(root);
          infoWindowRef.current?.open({ map, anchor: marker });
          track("map_marker_click", {
            point_id: entry.id,
            kind: "culture",
            title: entry.title,
            filter: activePeriod,
            section: "historical_map",
          });
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        rendered += 1;
      }

      if (cancelled || rendered === 0) return;
      if (rendered === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 58);
        maps.event.addListenerOnce(map, "idle", () => {
          if (map.getZoom() > 14) map.setZoom(14);
        });
      }
    };

    renderMarkers();
    return () => {
      cancelled = true;
    };
  }, [activePeriod, selectedIds, status, visibleEntries]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapElement}
        aria-label="Mappa storica BIMARIS dei monumenti di Messina"
        style={{ width: "100%", minHeight: "650px", borderRadius: 26, overflow: "hidden", background: "#e8ecef" }}
      />

      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div className="detail-panel">Caricamento della mappa storica…</div>
        </div>
      )}

      {status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}>
          <div className="detail-panel">
            <h3>Mappa temporaneamente non disponibile</h3>
            <p>Controlla la configurazione di Google Maps e riprova.</p>
          </div>
        </div>
      )}

      {status === "ready" && (
        <>
          <div
            aria-label="Filtra i monumenti per epoca storica"
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 18,
              zIndex: 3,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            <button
              type="button"
              aria-pressed={activePeriod === "all"}
              onClick={() => setActivePeriod("all")}
              style={{
                flex: "0 0 auto",
                border: activePeriod === "all" ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.14)",
                borderRadius: 999,
                padding: "10px 14px",
                background: activePeriod === "all" ? "#101820" : "rgba(255,255,255,.96)",
                color: activePeriod === "all" ? "#ffffff" : "#101820",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Tutte ({periodCount("all")})
            </button>
            {HISTORICAL_PERIODS.map(period => (
              <button
                key={period.key}
                type="button"
                aria-pressed={activePeriod === period.key}
                onClick={() => {
                  setActivePeriod(period.key);
                  track("filter_used", { section: "historical_map", filter: "historical_period", value: period.key });
                }}
                style={{
                  flex: "0 0 auto",
                  border: activePeriod === period.key ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.14)",
                  borderRadius: 999,
                  padding: "10px 14px",
                  background: activePeriod === period.key ? "#101820" : "rgba(255,255,255,.96)",
                  color: activePeriod === period.key ? "#ffffff" : "#101820",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {period.label} ({periodCount(period.key)})
              </button>
            ))}
          </div>

          {selectedEntries.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
                zIndex: 4,
                background: "rgba(255,255,255,.97)",
                color: "#101820",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 12px 34px rgba(7,24,35,.22)",
                maxHeight: "45%",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <strong style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>Il mio percorso storico</strong>
                  <div style={{ fontSize: 12, color: "#68737a" }}>
                    {selectedEntries.length} {selectedEntries.length === 1 ? "tappa selezionata" : "tappe selezionate"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{ border: 0, background: "transparent", color: "#7a4b43", fontWeight: 700, cursor: "pointer" }}
                >
                  Svuota
                </button>
              </div>

              <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "10px 0" }}>
                {selectedEntries.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggleEntry(entry)}
                    style={{
                      flex: "0 0 auto",
                      border: "1px solid rgba(3,17,26,.12)",
                      borderRadius: 999,
                      padding: "7px 10px",
                      background: "#f7f0e4",
                      color: "#101820",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {index + 1}. {entry.title} ×
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  aria-pressed={travelMode === "walking"}
                  onClick={() => setTravelMode("walking")}
                  style={{
                    border: travelMode === "walking" ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.15)",
                    borderRadius: 999,
                    padding: "8px 11px",
                    background: travelMode === "walking" ? "#101820" : "#ffffff",
                    color: travelMode === "walking" ? "#ffffff" : "#101820",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  A piedi
                </button>
                <button
                  type="button"
                  aria-pressed={travelMode === "driving"}
                  onClick={() => setTravelMode("driving")}
                  style={{
                    border: travelMode === "driving" ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.15)",
                    borderRadius: 999,
                    padding: "8px 11px",
                    background: travelMode === "driving" ? "#101820" : "#ffffff",
                    color: travelMode === "driving" ? "#ffffff" : "#101820",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  In auto
                </button>
                <a
                  className="button"
                  href={googleRouteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("directions_click", { section: "historical_map", stops: selectedEntries.length, travel_mode: travelMode })}
                >
                  Indicazioni per le tappe selezionate
                </a>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#59656d" }}>
                Puoi selezionare fino a 8 monumenti. L’ordine del percorso segue l’ordine di selezione.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
