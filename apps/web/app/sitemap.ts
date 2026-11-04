import type { MetadataRoute } from "next";
import { getPublishedCultureEntries } from "@/data/live";
import { getPublishedStories } from "@/data/stories";
import { getPublishedVillages } from "@/data/villages";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cultureEntries, stories, villages] = await Promise.all([
    getPublishedCultureEntries(),
    getPublishedStories(),
    getPublishedVillages(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cultura`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/storie-miti-leggende`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/borghi`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/rete-bimaris`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/mappa`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/operatori`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/esperienze`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contatti`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const culturePages: MetadataRoute.Sitemap = cultureEntries.map(entry => ({
    url: `${SITE_URL}/cultura/${entry.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const storyPages: MetadataRoute.Sitemap = stories.map(story => ({
    url: `${SITE_URL}/storie-miti-leggende/${story.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const villagePages: MetadataRoute.Sitemap = villages.map(village => ({
    url: `${SITE_URL}/borghi/${village.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...culturePages, ...storyPages, ...villagePages];
}
