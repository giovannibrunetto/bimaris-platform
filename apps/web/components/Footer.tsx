import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <Link className="footer-brand" href="/" aria-label="BIMARIS — Messina da Vivere">
        <span className="footer-brand-image" />
      </Link>
      <div className="footer-links">
        <Link href="/esperienze">Esperienze</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/itinerari">Itinerari</Link>
        <Link href="/eventi">Eventi</Link>
        <Link href="/operatori/candidatura">Operatori</Link>
      </div>
      <p className="muted">© 2026 BIMARIS — Messina da Vivere.</p>
    </footer>
  );
}
