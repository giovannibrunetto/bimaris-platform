"use client";

import { useState } from "react";

type Place = { id: string; name: string };
type NewPlace = { name: string; address?: string };

export default function EditorialPlaceField({ places, placeId, newPlace }: {
  places: Place[];
  placeId?: string;
  newPlace?: NewPlace | null;
}) {
  const [selection, setSelection] = useState(newPlace ? "new" : placeId || "");
  return <fieldset className="editorial-location">
    <legend>Dove si trova</legend>
    <label>Luogo della scheda
      <select name="place" value={selection} onChange={event => setSelection(event.target.value)} aria-describedby="editorial-location-help">
        <option value="">Da definire</option>
        <option value="new">Aggiungi un nuovo luogo</option>
        {places.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
      </select>
    </label>
    <small id="editorial-location-help">Scegli un luogo già censito oppure aggiungine uno. Puoi completare questo passaggio prima di pubblicare.</small>
    <div className="editorial-new-place" hidden={selection !== "new"}>
      <label>Nome del luogo<input name="newPlaceName" maxLength={180} defaultValue={newPlace?.name} disabled={selection !== "new"} required={selection === "new"} /></label>
      <label>Indirizzo o località <small>(facoltativo)</small><input name="newPlaceAddress" maxLength={300} defaultValue={newPlace?.address} disabled={selection !== "new"} /></label>
      <small>Il nuovo luogo viene aggiunto al catalogo quando pubblichi la scheda.</small>
    </div>
  </fieldset>;
}
