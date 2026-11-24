import Link from "next/link";

export type CultureCardData = {
  title: string;
  excerpt: string;
  category: string;
  period?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageAuthor?: string | null;
  imageLicense?: string | null;
};

export default function CultureMonumentCard({ card, href }: { card: CultureCardData; href?: string }) {
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
      <span className="text-link">Scopri il luogo →</span>
    </div>
  </>;
  return <article className="card culture-card">
    {href ? <Link className="culture-card-link" href={href}>{body}</Link> : <div className="culture-card-link">{body}</div>}
    {card.imageAuthor && card.imageLicense && <div className="photo-credit">Foto: {card.imageAuthor} · {card.imageLicense}</div>}
  </article>;
}
