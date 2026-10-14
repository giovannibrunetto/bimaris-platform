const endpoint = process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT;

export async function trackMobile(
  event: string,
  properties: Record<string, string | number | boolean | null> = {},
) {
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event,
        path: "mobile",
        sessionId: null,
        anonymousId: null,
        properties: { platform: "mobile", ...properties },
      }),
    });
  } catch {
    // Analytics must never block navigation or crash the app.
  }
}
