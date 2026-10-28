const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.9;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Immagine non leggibile")); };
    image.src = url;
  });
}

export async function optimizeExperienceImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Formato immagine non valido");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("La fotografia supera 20 MB");

  const image = await loadImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longestEdge > MAX_EDGE ? MAX_EDGE / longestEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  // Storage intentionally accepts only WebP. Keep an already-compliant WebP unchanged
  // when no resize is needed, but normalize JPEG/PNG/other browser-readable images
  // to WebP even when their dimensions are already within the delivery envelope.
  if (scale === 1 && file.type === "image/webp") return file;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Ottimizzazione immagine non disponibile");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (!blob) throw new Error("Compressione immagine non riuscita");
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto-esperienza";
  return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}

export async function optimizeExperienceImages(files: File[], limit = 6) {
  const selected = files.slice(0, limit);
  const optimized: File[] = [];
  const rejected: string[] = [];
  for (const file of selected) {
    try { optimized.push(await optimizeExperienceImage(file)); }
    catch (error) { rejected.push(`${file.name}: ${error instanceof Error ? error.message : "errore sconosciuto"}`); }
  }
  return { optimized, rejected };
}
