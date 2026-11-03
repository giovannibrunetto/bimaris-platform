import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedStoryBySlug } from "@/data/stories";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) return {};
  return {
    alternates: { canonical: `/storie-miti-leggende/${story.slug}` },
  };
}

export default async function StorySeoLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) return children;

  const canonical = absoluteUrl(`/storie-miti-leggende/${story.slug}`);
  const image = story.imageUrl ? absoluteUrl(story.imageUrl) : undefined;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#article`,
    headline: story.title,
    description: story.excerpt,
    url: canonical,
    image,
    articleSection: "Miti e leggende",
    genre: story.storyType,
    inLanguage: "it-IT",
    publisher: { "@id": "https://bimarisnet.it/#organization" },
    isPartOf: { "@id": "https://bimarisnet.it/#website" },
    about: story.places.map(place => ({ "@type": "Place", name: place.label ?? place.name })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "BIMARIS", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Miti e leggende", item: absoluteUrl("/storie-miti-leggende") },
      { "@type": "ListItem", position: 3, name: story.title, item: canonical },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
    {children}
    {story.slug === "orione-origini-mitiche-messina" && <nav aria-label="Collegamento semantico BIMARIS" style={{padding:"0 6vw 24px"}}><Link className="text-link" href="/cultura/fontana-di-orione">Fontana di Orione →</Link></nav>}
  </>;
}
