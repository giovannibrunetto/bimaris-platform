import Link from "next/link";
import type { CultureStory } from "@/data/ti-racconto-messina";

const periods: Record<string, string> = {
  medioevo: "Messina medievale · XII–XIII secolo",
  cinquecento: "Messina rinascimentale · XVI secolo",
  "1908-rinascita": "Terremoto e ricostruzione · 1908–1943",
};

export default function HistoricalStoryCard({ story, href, index }: {
  story: Pick<CultureStory, "key" | "title" | "subtitle" | "theme">;
  href?: string;
  index?: number;
}) {
  const className = "storytelling-card public-discovery-card";
  const content = <>
    {index !== undefined && <div className="storytelling-number">{String(index + 1).padStart(2, "0")}</div>}
    <div className="kicker">{periods[story.key] ?? story.theme}</div>
    <h3>{story.title}</h3>
    <p className="storytelling-card-summary">{story.subtitle}</p>
    <span className="text-link" aria-hidden="true">Entra nel racconto →</span>
  </>;

  return href
    ? <Link className={className} href={href} aria-label={`Entra nel racconto: ${story.title}`}>{content}</Link>
    : <article className={className}>{content}</article>;
}
