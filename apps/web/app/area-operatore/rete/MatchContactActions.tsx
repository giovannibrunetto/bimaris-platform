"use client";

type Props = {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
};

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default function MatchContactActions({ phone, whatsapp, email, website }: Props) {
  const wa = whatsapp ? cleanPhone(whatsapp) : null;
  const tel = phone ? cleanPhone(phone) : null;
  const site = website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null;
  const hasContacts = Boolean(wa || tel || email || site);

  if (!hasContacts) {
    return <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)" }}>Contatti diretti non ancora disponibili.</p>;
  }

  const linkStyle = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 38,
    padding: "8px 12px",
    border: "1px solid rgba(202,168,106,.38)",
    borderRadius: 999,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    background: "#fff",
  } as const;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
      {wa && <a style={linkStyle} href={`https://wa.me/${wa.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
      {tel && <a style={linkStyle} href={`tel:${tel}`}>Chiama</a>}
      {email && <a style={linkStyle} href={`mailto:${email}`}>Email</a>}
      {site && <a style={linkStyle} href={site} target="_blank" rel="noreferrer">Sito web</a>}
    </div>
  );
}
