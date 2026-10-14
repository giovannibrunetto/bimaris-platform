"use client";

import Link from "next/link";
import { useRef } from "react";

export function Header() {
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  return (
    <header className="site-header">
      <Link className="brand brand-image" href="/" aria-label="BIMARIS — Messina da Vivere" onClick={closeMobileMenu} />

      <nav className="nav" aria-label="Principale">
        <Link href="/esperienze">Esperienze</Link>
        <Link href="/cultura">Cultura</Link>
        <Link href="/storie-miti-leggende">Miti e leggende</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/itinerari">Itinerari</Link>
        <Link href="/eventi">Eventi</Link>
        <Link href="/operatori">Operatori</Link>
      </nav>

      <details className="mobile-menu" ref={mobileMenuRef}>
        <summary aria-label="Apri menu di navigazione">Menu</summary>
        <nav className="mobile-nav" aria-label="Navigazione mobile">
          <Link href="/esperienze" onClick={closeMobileMenu}>Esperienze</Link>
          <Link href="/cultura" onClick={closeMobileMenu}>Cultura</Link>
          <Link href="/storie-miti-leggende" onClick={closeMobileMenu}>Miti e leggende</Link>
          <Link href="/mappa" onClick={closeMobileMenu}>Mappa</Link>
          <Link href="/itinerari" onClick={closeMobileMenu}>Itinerari</Link>
          <Link href="/eventi" onClick={closeMobileMenu}>Eventi</Link>
          <Link href="/operatori" onClick={closeMobileMenu}>Operatori</Link>
          <Link href="/contatti" onClick={closeMobileMenu}>Contatti</Link>
        </nav>
      </details>
    </header>
  );
}
