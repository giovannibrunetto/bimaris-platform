import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntryBySlug } from "@/data/live";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);
  if (!entry) return {};
  return {
    alternates: { canonical: `/cultura/${entry.slug}` },
  };
}

export default async function CultureSeoLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);
  if (!entry) return children;

  const canonical = absoluteUrl(`/cultura/${entry.slug}`);
  const image = entry.imageUrl ? absoluteUrl(entry.imageUrl) : undefined;
  const placeSchema = {
    "@context": "https://schema.org",
    "@type": entry.slug === "fontana-di-orione" ? "TouristAttraction" : "Place",
    "@id": `${canonical}#place`,
    name: entry.title,
    description: entry.excerpt,
    url: canonical,
    image,
    address: entry.address ? { "@type": "PostalAddress", streetAddress: entry.address, addressLocality: "Messina", addressCountry: "IT" } : undefined,
    geo: Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude) ? { "@type": "GeoCoordinates", latitude: entry.latitude, longitude: entry.longitude } : undefined,
    isPartOf: { "@id": "https://bimarisnet.it/#website" },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "BIMARIS", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Cultura", item: absoluteUrl("/cultura") },
      { "@type": "ListItem", position: 3, name: entry.title, item: canonical },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(placeSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
    {children}
    {entry.slug === "fontana-di-orione" && <nav aria-label="Collegamento semantico BIMARIS" style={{padding:"0 6vw 24px"}}><Link className="text-link" href="/storie-miti-leggende/orione-origini-mitiche-messina">Orione e le origini mitiche di Messina →</Link></nav>}
  </>;
}
