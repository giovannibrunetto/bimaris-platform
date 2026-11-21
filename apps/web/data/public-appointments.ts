import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

type AppointmentRow = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  source_url: string | null;
  metadata: { price_eur?: unknown } | null;
};

function externalSource(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function getPublishedAppointments() {
  const client = createPublicClient();
  if (!client) return [];
  const now = new Date().toISOString();
  const { data, error } = await client.from("events")
    .select("id,title,starts_at,location,source_url,metadata")
    .eq("verification_status", "verified")
    .eq("published", true)
    .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("BIMARIS public appointment read failed", error.code);
    return [];
  }

  return ((data ?? []) as AppointmentRow[])
    .filter(row => Number.isFinite(Date.parse(row.starts_at)))
    .map(row => {
      const price = row.metadata?.price_eur;
      return {
        id: row.id,
        title: row.title,
        startsAt: row.starts_at,
        location: row.location?.trim() || null,
        sourceUrl: externalSource(row.source_url),
        price: typeof price === "number" && Number.isFinite(price) && price >= 0 ? price : null,
      };
    });
}
