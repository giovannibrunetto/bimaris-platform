import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="BIMARIS home">
        <span className="brand-mark">B</span>
        <span><strong>BIMARIS</strong><small>Messina da Vivere</small></span>
      </Link>
      <nav className="nav" aria-label="Principale">
        <Link href="/esperienze">Esperienze</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/itinerari">Itinerari</Link>
        <Link href="/eventi">Eventi</Link>
        <Link href="/operatori/candidatura">Operatori</Link>
      </nav>
    </header>
  );
}
