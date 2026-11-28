"use client";

import { useState } from "react";
import ExperienceLocationPicker, { type ExperienceLocation } from "../../area-operatore/ExperienceLocationPicker";

export default function EditorialPlaceField({ initialLocation, mapsUrl }: {
  initialLocation: ExperienceLocation;
  mapsUrl?: string;
}) {
  const [location, setLocation] = useState(initialLocation);
  return <fieldset className="editorial-location">
    <legend>Posizione</legend>
    <ExperienceLocationPicker culture value={location} onChange={setLocation} />
    <input type="hidden" name="locationAddress" value={location.meetingPoint} />
    <input type="hidden" name="locationPlaceId" value={location.googleMapsPlaceId} />
    <details>
      <summary>Inserisci le coordinate manualmente</summary>
      <label>Latitudine
        <input name="latitude" inputMode="decimal" maxLength={32} value={location.latitude}
          onChange={event => setLocation({ ...location, latitude: event.target.value, googleMapsPlaceId: "" })} />
      </label>
      <label>Longitudine
        <input name="longitude" inputMode="decimal" maxLength={32} value={location.longitude}
          onChange={event => setLocation({ ...location, longitude: event.target.value, googleMapsPlaceId: "" })} />
      </label>
    </details>
    {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer">Apri il link Google Maps già salvato ↗</a>}
  </fieldset>;
}
