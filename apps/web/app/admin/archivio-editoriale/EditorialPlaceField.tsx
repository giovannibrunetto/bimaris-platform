export default function EditorialPlaceField({ mapsUrl }: { mapsUrl?: string }) {
  return <fieldset className="editorial-location">
    <legend>Posizione</legend>
    <a className="editorial-button" href="https://www.google.com/maps" target="_blank" rel="noreferrer">Apri Google Maps ↗</a>
    <label>Link Google Maps
      <input name="mapsUrl" type="url" maxLength={1800} defaultValue={mapsUrl} aria-describedby="editorial-maps-help" />
      <small id="editorial-maps-help">Seleziona il punto esatto su Google Maps, poi usa «Condividi → Copia link» e incollalo qui.</small>
    </label>
  </fieldset>;
}
