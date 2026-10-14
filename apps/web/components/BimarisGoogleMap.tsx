"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

const MESSINA_CENTER = { lat: 38.1938, lng: 15.5540 };

export function BimarisGoogleMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setStatus("error");
      return;
    }

    const initialiseMap = () => {
      if (!mapElement.current || !window.google?.maps) return;

      mapRef.current = new window.google.maps.Map(mapElement.current, {
        center: MESSINA_CENTER,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
      });

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

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapElement}
        aria-label="Mappa interattiva BIMARIS di Messina"
        style={{ width: "100%", minHeight: "560px", borderRadius: "26px", overflow: "hidden", background: "#e8ecef" }}
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
        <div style={{ position: "absolute", left: 18, bottom: 18, zIndex: 2, display: "grid", gap: 8 }}>
          <button className="button" type="button" onClick={locateUser}>La mia posizione</button>
          {locationMessage && (
            <div style={{ background: "rgba(255,255,255,.96)", color: "#101820", borderRadius: 12, padding: "8px 12px", fontSize: 13, maxWidth: 260 }}>
              {locationMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
