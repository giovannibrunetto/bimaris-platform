"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

const MESSINA_CENTER = { lat: 38.1938, lng: 15.5540 };

type MapPointKind = "culture" | "legend" | "operator";

export type BimarisMapPoint = {
  id: string;
  kind: MapPointKind;
  title: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function markerColor(kind: MapPointKind) {
  if (kind === "culture") return "#caa86a";
  if (kind === "operator") return "#244b3b";
  return "#376070";
}

function markerLabel(kind: MapPointKind) {
  if (kind === "culture") return "C";
  if (kind === "operator") return "O";
  return "M";
}

function categoryLabel(kind: MapPointKind) {
  if (kind === "culture") return "Cultura";
  if (kind === "operator") return "Operatore BIMARIS";
  return "Miti e leggende";
}

function markerIcon(maps: any, kind: MapPointKind) {
  const fill = markerColor(kind);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="50" viewBox="0 0 38 50">
      <path d="M19 1C9.1 1 1 9.1 1 19c0 13.3 18 29.8 18 29.8S37 32.3 37 19C37 9.1 28.9 1 19 1Z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="19" cy="19" r="9" fill="rgba(3,17,26,.30)"/>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(38, 50),
    anchor: new maps.Point(19, 49),
    labelOrigin: new maps.Point(19, 19),
  };
}

function createInfoWindowContent(point: BimarisMapPoint) {
  const root = document.createElement("div");
  root.style.maxWidth = "270px";
  root.style.padding = "4px 2px 2px";
  root.style.color = "#101820";
  root.style.fontFamily = "Arial, Helvetica, sans-serif";

  const category = document.createElement("div");
  category.textContent = categoryLabel(point.kind);
  category.style.color = markerColor(point.kind);
  category.style.fontSize = "11px";
  category.style.fontWeight = "700";
  category.style.letterSpacing = ".12em";
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
  const [activeKinds, setActiveKinds] = useState<Record<MapPointKind, boolean>>({
    culture: true,
    legend: true,
    operator: true,
  });

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
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;

    const maps = window.google.maps;
    const map = mapRef.current;
    const geocoder = new maps.Geocoder();
    let cancelled = false;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const visiblePoints = points.filter(point => activeKinds[point.kind]);

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
          zIndex: point.kind === "operator" ? 30 : point.kind === "culture" ? 20 : 10,
        });

        marker.addListener("click", () => {
          infoWindowRef.current?.setContent(createInfoWindowContent(point));
          infoWindowRef.current?.open({ map, anchor: marker });
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
  }, [activeKinds, points, status]);

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
          userMarkerRef.current = new window.google.maps.Marker({
            map,
            position,
            title: "La tua posizione",
          });
        }

        setLocationMessage("Posizione trovata.");
      },
      () => setLocationMessage("Non è stato possibile accedere alla tua posizione."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const toggleKind = (kind: MapPointKind) => {
    setActiveKinds(current => ({ ...current, [kind]: !current[kind] }));
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
            aria-label="Filtri della mappa"
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              zIndex: 3,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              maxWidth: "calc(100% - 36px)",
            }}
          >
            <button
              type="button"
              aria-pressed={activeKinds.culture}
              onClick={() => toggleKind("culture")}
              style={{
                border: "1px solid rgba(3,17,26,.12)",
                borderRadius: 999,
                padding: "10px 14px",
                background: activeKinds.culture ? "#caa86a" : "rgba(255,255,255,.96)",
                color: "#101820",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(7,24,35,.10)",
              }}
            >
              Cultura
            </button>
            <button
              type="button"
              aria-pressed={activeKinds.legend}
              onClick={() => toggleKind("legend")}
              style={{
                border: "1px solid rgba(3,17,26,.12)",
                borderRadius: 999,
                padding: "10px 14px",
                background: activeKinds.legend ? "#376070" : "rgba(255,255,255,.96)",
                color: activeKinds.legend ? "#ffffff" : "#101820",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(7,24,35,.10)",
              }}
            >
              Miti e leggende
            </button>
            <button
              type="button"
              aria-pressed={activeKinds.operator}
              onClick={() => toggleKind("operator")}
              style={{
                border: "1px solid rgba(3,17,26,.12)",
                borderRadius: 999,
                padding: "10px 14px",
                background: activeKinds.operator ? "#244b3b" : "rgba(255,255,255,.96)",
                color: activeKinds.operator ? "#ffffff" : "#101820",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(7,24,35,.10)",
              }}
            >
              Operatori
            </button>
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
