import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCultureEntries } from "@/data/live";
import { getPublishedHistoricalStories } from "@/data/historical-editorial";
import HistoricalStoryView from "@/components/HistoricalStoryView";
import "../storytelling.css";
import "./story-detail.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ story: string }> }): Promise<Metadata> {
  const { story } = await params;
  const definition = (await getPublishedHistoricalStories()).find(item => item.key === story);
  if (!definition) return {};
  return { title: `${definition.title} | Ti racconto la storia di Messina | BIMARIS`, description: definition.subtitle };
}

export default async function StoryPage({ params }: { params: Promise<{ story: string }> }) {
  const { story } = await params;
  const [stories, entries] = await Promise.all([getPublishedHistoricalStories(), getPublishedCultureEntries()]);
  const definition = stories.find(item => item.key === story);
  if (!definition) notFound();
  const slugs = new Set(entries.map(entry => entry.slug));
  if (definition.chapters.some(chapter => chapter.slug && !slugs.has(chapter.slug))) notFound();
  return <HistoricalStoryView definition={definition} entries={entries} />;
}
