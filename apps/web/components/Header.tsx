import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand brand-image" href="/" aria-label="BIMARIS — Messina da Vivere" />
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
