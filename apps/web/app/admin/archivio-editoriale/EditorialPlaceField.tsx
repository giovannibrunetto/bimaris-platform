"use client";

import { useState } from "react";

type Place = { id: string; name: string };
type NewPlace = { name: string; address?: string; mapsUrl?: string };

export default function EditorialPlaceField({ places, placeId, newPlace }: {
  places: Place[];
  placeId?: string;
  newPlace?: NewPlace | null;
}) {
  const [selection, setSelection] = useState(newPlace ? "new" : placeId || "");
  return <fieldset className="editorial-location">
    <legend>Dove si trova</legend>
    <label>Posizione
      <select name="place" value={selection} onChange={event => setSelection(event.target.value)} aria-describedby="editorial-location-help">
        <option value="">Da definire</option>
        <option value="new">Indica una nuova posizione</option>
        {places.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
      </select>
    </label>
    <small id="editorial-location-help">Collega un luogo già presente in BIMARIS oppure indica la posizione del nuovo luogo su Google Maps.</small>
    <div className="editorial-new-place" hidden={selection !== "new"}>
      <label>Nome del luogo<input name="newPlaceName" maxLength={180} defaultValue={newPlace?.name} disabled={selection !== "new"} required={selection === "new"} /></label>
      <label>Indirizzo o località <small>(facoltativo)</small><input name="newPlaceAddress" maxLength={300} defaultValue={newPlace?.address} disabled={selection !== "new"} /></label>
      <a className="editorial-button" href="https://www.google.com/maps" target="_blank" rel="noreferrer">Apri Google Maps ↗</a>
      <label>Link alla posizione su Google Maps
        <input name="newPlaceMapsUrl" type="url" maxLength={1800} defaultValue={newPlace?.mapsUrl} disabled={selection !== "new"} aria-describedby="editorial-maps-help" />
        <small id="editorial-maps-help">In Google Maps seleziona il luogo o il punto esatto sulla mappa, poi usa «Condividi → Copia link» e incollalo qui.</small>
      </label>
    </div>
  </fieldset>;
}
