import { createPublicClient } from "@/lib/supabase/public";
import { CULTURE_STORIES, type CultureStory } from "@/data/ti-racconto-messina";

export async function getPublishedHistoricalStories(): Promise<CultureStory[]> {
  const db = createPublicClient();
  if (!db) return CULTURE_STORIES;
  const { data, error } = await db.from("historical_editorial_stories")
    .select("content").eq("published", true).order("position").order("slug");
  if (error) {
    console.error("Historical editorial stories unavailable", error.code);
    return CULTURE_STORIES;
  }
  return (data ?? []).map(row => row.content as CultureStory);
}
