// Browser-only preparation. The server independently validates the actual bytes.
const MAX_UPLOAD = 3 * 1024 * 1024;
const MAX_INPUT = 30 * 1024 * 1024;
const TARGET = 2.5 * 1024 * 1024;

export async function prepareEditorialPhoto(file: File): Promise<File> {
  if (!file.size) throw new Error("Il file selezionato è vuoto.");
  if (file.size > MAX_INPUT) throw new Error("La fotografia supera 30 MiB prima della compressione.");
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png = [137,80,78,71,13,10,26,10].every((n,i) => b[i] === n);
  const webp = String.fromCharCode(...b.slice(0,4)) === "RIFF" && String.fromCharCode(...b.slice(8,12)) === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Formato non supportato. Seleziona JPEG, PNG o WebP.");
  const type = jpeg ? "image/jpeg" : png ? "image/png" : "image/webp";
  const normalized = new File([file], file.name, { type });
  const image = await createImageBitmap(normalized).catch(() => { throw new Error("Non è possibile leggere la fotografia selezionata."); });
  try {
    if (file.size <= MAX_UPLOAD) return normalized;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Compressione non disponibile su questo browser.");
    for (const maxSide of [2400, 2000, 1600, 1200]) {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.82, 0.72]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size > 0 && blob.size <= TARGET) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      }
    }
    throw new Error("Non è stato possibile comprimere la fotografia sotto il limite consentito.");
  } finally {
    image.close();
  }
}
