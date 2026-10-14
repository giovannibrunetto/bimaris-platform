import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div><strong>BIMARIS</strong><p>Messina da Vivere</p></div>
      <div className="footer-links">
        <Link href="/esperienze">Esperienze</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/operatori/candidatura">Candidati</Link>
        <Link href="/admin/analytics">Analytics demo</Link>
      </div>
      <p className="muted">© 2026 BIMARIS. MVP tecnico.</p>
    </footer>
  );
}
