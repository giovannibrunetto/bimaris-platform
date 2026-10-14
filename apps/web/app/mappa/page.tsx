"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function MapPage() {
  useEffect(() => { track("map_open"); }, []);
  return <>
    <section className="page-hero"><div className="kicker">Esplora</div><h1>Mappa BIMARIS</h1><p>Base UI pronta per integrare Mapbox/MapLibre o Google Maps con marker, filtri e geolocalizzazione.</p></section>
    <section className="section dark"><div className="map-shell"><div className="map-label"><h3>La mappa interattiva</h3><p>Collega latitudine e longitudine delle esperienze dal database Supabase e mostra i contenuti vicini all'utente.</p><button className="button" onClick={() => track("map_marker_click", { marker_demo: true })}>Simula click marker</button></div></div></section>
  </>;
}
