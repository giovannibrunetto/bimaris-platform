"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

declare global {
  interface Window {
    google?: any;
  }
}

const MESSINA_CENTER = { lat: 38.1938, lng: 15.5540 };

type MapPointKind = "culture" | "legend" | "operator" | "experience";
export type MapFilterKey = "cultura" | "attrazioni" | "sapori" | "natura" | "mare" | "artigianato" | "operatori";
type ActiveMapFilter = "all" | MapFilterKey;

const FILTERS: Array<{ key: ActiveMapFilter; label: string }> = [
  { key: "all", label: "Tutto" },
  { key: "cultura", label: "Cultura" },
  { key: "attrazioni", label: "Attrazioni" },
  { key: "sapori", label: "Sapori" },
  { key: "natura", label: "Natura" },
  { key: "mare", label: "Mare" },
  { key: "artigianato", label: "Artigianato" },
  { key: "operatori", label: "Operatori" },
];

export type BimarisMapPoint = {
  id: string;
  kind: MapPointKind;
  title: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  filterCategories: MapFilterKey[];
  categoryLabel?: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function markerColor(kind: MapPointKind) {
  if (kind === "culture") return "#caa86a";
  if (kind === "operator") return "#244b3b";
  if (kind === "experience") return "#8a5a35";
  return "#376070";
}

function markerLabel(kind: MapPointKind) {
  if (kind === "culture") return "C";
  if (kind === "operator") return "O";
  if (kind === "experience") return "E";
  return "M";
}

function pointTypeLabel(kind: MapPointKind) {
  if (kind === "culture") return "Cultura";
  if (kind === "operator") return "Operatore BIMARIS";
  if (kind === "experience") return "Esperienza BIMARIS";
  return "Miti e leggende";
}

function createInfoWindowContent(point: BimarisMapPoint) {
  const root = document.createElement("div");
  root.style.maxWidth = "270px";
  root.style.padding = "4px 2px 2px";
  root.style.color = "#101820";
  root.style.fontFamily = "Arial, Helvetica, sans-serif";

  const category = document.createElement("div");
  category.textContent = point.categoryLabel ? `${pointTypeLabel(point.kind)} · ${point.categoryLabel}` : pointTypeLabel(point.kind);
  category.style.color = markerColor(point.kind);
  category.style.fontSize = "11px";
  category.style.fontWeight = "700";
  category.style.letterSpacing = ".10em";
  category.style.textTransform = "uppercase";
  root.appendChild(category);

  const title = document.createElement("div");
  title.textContent = point.title;
  title.style.fontFamily = "Georgia, serif";
  title.style.fontSize = "20px";
  title.style.fontWeight = "700";
  title.style.margin = "7px 0 6px";
  root.appendChild(title);

  if (point.address) {
    const address = document.createElement("div");
    address.textContent = point.address;
    address.style.fontSize = "13px";
    address.style.lineHeight = "1.4";
    address.style.color = "#59656d";
    address.style.marginBottom = "12px";
    root.appendChild(address);
  }

  const links = document.createElement("div");
  links.style.display = "grid";
  links.style.gap = "7px";

  point.links.forEach(link => {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = `${link.label} →`;
    anchor.style.color = "#8d6b34";
    anchor.style.fontSize = "13px";
    anchor.style.fontWeight = "700";
    anchor.style.textDecoration = "none";
    links.appendChild(anchor);
  });

  const directions = document.createElement("a");
  directions.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.googleMapsQuery)}`;
  directions.target = "_blank";
  directions.rel = "noreferrer";
  directions.textContent = "Indicazioni con Google Maps →";
  directions.style.color = "#376070";
  directions.style.fontSize = "13px";
  directions.style.fontWeight = "700";
  directions.style.textDecoration = "none";
  links.appendChild(directions);

  root.appendChild(links);
  return root;
}

export function BimarisGoogleMap({ points }: { points: BimarisMapPoint[] }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const coordinateCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationMessage, setLocationMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveMapFilter>("all");

  const availableFilters = FILTERS.filter(filter =>
    filter.key === "all" || points.some(point => point.filterCategories.includes(filter.key as MapFilterKey)),
  );

  const filterCount = (filter: ActiveMapFilter) => {
    if (filter === "all") return points.length;
    return points.filter(point => point.filterCategories.includes(filter)).length;
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
      track("map_open", { points: points.length });
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
  }, [points.length]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;

    const maps = window.google.maps;
    const map = mapRef.current;
    const geocoder = new maps.Geocoder();
    let cancelled = false;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const visiblePoints = activeFilter === "all"
      ? points
      : points.filter(point => point.filterCategories.includes(activeFilter));

    const resolvePosition = async (point: BimarisMapPoint) => {
      if (Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
        return { lat: point.latitude as number, lng: point.longitude as number };
      }

      const cached = coordinateCacheRef.current.get(point.googleMapsQuery);
      if (cached) return cached;

      try {
        const response = await geocoder.geocode({ address: point.googleMapsQuery });
        const location = response.results?.[0]?.geometry?.location;
        if (!location) return null;

        const position = { lat: location.lat(), lng: location.lng() };
        coordinateCacheRef.current.set(point.googleMapsQuery, position);
        return position;
      } catch {
        return null;
      }
    };

    const renderMarkers = async () => {
      const bounds = new maps.LatLngBounds();
      let rendered = 0;

      for (const point of visiblePoints) {
        const position = await resolvePosition(point);
        if (cancelled || !position) continue;

        const marker = new maps.Marker({
          map,
          position,
          title: point.title,
          icon: markerIcon(maps, point.kind),
          label: {
            text: markerLabel(point.kind),
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          },
          zIndex: point.kind === "experience" ? 40 : point.kind === "operator" ? 30 : point.kind === "culture" ? 20 : 10,
        });

        marker.addListener("click", () => {
          infoWindowRef.current?.setContent(createInfoWindowContent(point));
          infoWindowRef.current?.open({ map, anchor: marker });
          track("map_marker_click", { point_id: point.id, kind: point.kind, title: point.title, filter: activeFilter });
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
  }, [activeFilter, points, status]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationMessage("La geolocalizzazione non è disponibile su questo dispositivo.");
      return;
    }

    setLocationMessage("Ricerca della tua posizione…");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        const map = mapRef.current;

        if (!map || !window.google?.maps) return;

        map.panTo(position);
        map.setZoom(15);

        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(position);
        } else {
          userMarkerRef.current = new window.google.maps.Marker({ map, position, title: "La tua posizione" });
        }

        setLocationMessage("Posizione trovata.");
      },
      () => setLocationMessage("Non è stato possibile accedere alla tua posizione."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const chooseFilter = (filter: ActiveMapFilter) => {
    setActiveFilter(filter);
    track("filter_used", { section: "map", filter: "category", value: filter });
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapElement}
        aria-label="Mappa interattiva BIMARIS di Messina"
        style={{ width: "100%", minHeight: "620px", borderRadius: "26px", overflow: "hidden", background: "#e8ecef" }}
      />

      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div className="detail-panel">Caricamento della mappa…</div>
        </div>
      )}

      {status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}>
          <div className="detail-panel">
            <h3>Mappa temporaneamente non disponibile</h3>
            <p>Controlla la configurazione della chiave Google Maps e riprova.</p>
          </div>
        </div>
      )}

      {status === "ready" && (
        <>
          <div
            aria-label="Filtra i punti BIMARIS per categoria"
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
            {availableFilters.map(filter => {
              const selected = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseFilter(filter.key)}
                  style={{
                    flex: "0 0 auto",
                    border: selected ? "1px solid #caa86a" : "1px solid rgba(3,17,26,.14)",
                    borderRadius: 999,
                    padding: "10px 14px",
                    background: selected ? "#101820" : "rgba(255,255,255,.96)",
                    color: selected ? "#ffffff" : "#101820",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(7,24,35,.12)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {filter.label} <span style={{ opacity: .72 }}>({filterCount(filter.key)})</span>
                </button>
              );
            })}
          </div>

          <div style={{ position: "absolute", left: 18, bottom: 18, zIndex: 2, display: "grid", gap: 8 }}>
            <button className="button" type="button" onClick={locateUser}>La mia posizione</button>
            {locationMessage && (
              <div style={{ background: "rgba(255,255,255,.96)", color: "#101820", borderRadius: 12, padding: "8px 12px", fontSize: 13, maxWidth: 260 }}>
                {locationMessage}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
