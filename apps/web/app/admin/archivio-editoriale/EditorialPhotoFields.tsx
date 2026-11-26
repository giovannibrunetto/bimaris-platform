import { editorialCoverUrl, type EditorialCover } from "@/lib/editorial-media";

export default function EditorialPhotoFields({ form, cover, gallery }: {
  form: string;
  cover?: EditorialCover | null;
  gallery?: boolean;
}) {
  const image = cover && editorialCoverUrl(cover, true);
  return <section className="editorial-panel editorial-photo-panel" id="editorial-photos" aria-labelledby="editorial-photo-heading">
    <h2 id="editorial-photo-heading">Foto di copertina</h2>
    {image && <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={cover.alt ?? ""} />
      <figcaption>{[cover.alt, cover.author, cover.license].filter(Boolean).join(" · ")}</figcaption>
    </figure>}
    <details className="editorial-photo-add">
      <summary>{image ? "Sostituisci foto o modifica i crediti" : "Inserisci foto"}</summary>
      <div className="editorial-photo-form">
        <label>File della foto
          <input name="photo" form={form} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="editorial-photo-format" />
          <small id="editorial-photo-format">JPEG, PNG o WebP. Le immagini grandi vengono compresse prima del salvataggio.</small>
        </label>
        {gallery && <label>Destinazione del nuovo file
          <select name="photoPlacement" form={form}>
            <option value="cover">Copertina</option>
            <option value="gallery">Galleria</option>
          </select>
        </label>}
        <label>Descrizione della foto
          <input name="alt" form={form} maxLength={250} defaultValue={cover?.alt ?? ""} />
        </label>
        <details className="editorial-photo-credits">
          <summary>Autore, fonte e licenza</summary>
          <label>Autore<input name="author" form={form} maxLength={180} defaultValue={cover?.author ?? ""} /></label>
          <label>Link alla fonte<input name="source" form={form} type="url" maxLength={500} defaultValue={cover?.source ?? ""} /></label>
          <label>Licenza<input name="license" form={form} maxLength={180} defaultValue={cover?.license ?? ""} /></label>
          <label>Link alla licenza<input name="licenseUrl" form={form} type="url" maxLength={500} defaultValue={cover?.licenseUrl ?? ""} /></label>
        </details>
      </div>
    </details>
  </section>;
}
