import Link from "next/link";

export type CultureCardData = {
  title: string;
  variant?: "culture" | "legend" | "village";
  excerpt: string;
  category: string;
  period?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageAuthor?: string | null;
  imageLicense?: string | null;
};

export default function CultureMonumentCard({ card, href, hideAction = false }: { card: CultureCardData; href?: string; hideAction?: boolean }) {
  if (card.variant === "legend" || card.variant === "village") {
    const legend = card.variant === "legend";
    return <article className={`card ${legend ? "story-card" : "village-card"} public-discovery-card`}>
      {card.imageUrl && <div className={legend ? "card-media story-card-media" : "village-card-media"}>
        <img src={card.imageUrl} alt={card.imageAlt ?? card.title} />
      </div>}
      <div className={legend ? "card-body story-card-body" : "card-body"}>
        <div className="kicker">{card.category}</div>
        <h3>{card.title}</h3>
        <p>{card.excerpt}</p>
        {!hideAction && <span className="text-link">{legend ? "Leggi il racconto" : "Scopri il borgo"} →</span>}
      </div>
      {card.imageAuthor && <div className="photo-credit">Foto: {card.imageAuthor}{card.imageLicense && ` · ${card.imageLicense}`}</div>}
    </article>;
  }
  const body = <>
    <div className="culture-card-media">
      {card.imageUrl ? <img src={card.imageUrl} alt={card.imageAlt ?? card.title} loading="lazy" decoding="async" />
        : <div className="culture-card-placeholder" />}
      <span>{card.category}</span>
    </div>
    <div className="card-body">
      <div className="eyebrow">{card.period}</div>
      <h3>{card.title}</h3>
      <p>{card.excerpt}</p>
      {!hideAction && <span className="text-link">Scopri il luogo →</span>}
    </div>
  </>;
  return <article className="card culture-card">
    {href ? <Link className="culture-card-link" href={href}>{body}</Link> : <div className="culture-card-link">{body}</div>}
    {card.imageAuthor && card.imageLicense && <div className="photo-credit">Foto: {card.imageAuthor} · {card.imageLicense}</div>}
  </article>;
}
