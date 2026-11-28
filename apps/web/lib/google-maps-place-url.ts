export function googleMapsPlaceUrl(input: string): string | null {
  if (input.length > 1800) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const isMapsHost = ["google.com", "www.google.com", "maps.google.com", "google.it", "www.google.it"].includes(url.hostname);
    if (isMapsHost && (url.pathname === "/maps" || url.pathname.startsWith("/maps/"))) return url.href;
    if (url.hostname === "maps.app.goo.gl" && /^\/[a-z0-9]+\/?$/i.test(url.pathname)) return url.href;
    return null;
  } catch {
    return null;
  }
}
