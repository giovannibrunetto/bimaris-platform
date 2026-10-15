import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <Link className="footer-brand" href="/" aria-label="BIMARIS — Messina da Vivere">
        <span className="footer-brand-image" />
      </Link>
      <div className="footer-links">
        <Link href="/cultura">Cultura</Link>
        <Link href="/storie-miti-leggende">Miti e leggende</Link>
        <Link href="/itinerari">Percorsi</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/operatori/candidatura">Operatori</Link>
        <Link href="/contatti">Contatti</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookie">Cookie</Link>
        <Link href="/note-legali">Note legali</Link>
      </div>
      <p className="muted">© 2026 BIMARIS — Messina da Vivere.</p>
    </footer>
  );
}
