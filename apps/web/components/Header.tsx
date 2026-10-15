"use client";

import Link from "next/link";
import { useRef } from "react";

const primaryLinks = [
  { href: "/cultura", label: "Cultura" },
  { href: "/storie-miti-leggende", label: "Miti e leggende" },
  { href: "/itinerari", label: "Percorsi" },
  { href: "/mappa", label: "Mappa" },
];

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
        {primaryLinks.map(link => (
          <Link href={link.href} key={link.href}>{link.label}</Link>
        ))}
      </nav>

      <details className="mobile-menu" ref={mobileMenuRef}>
        <summary aria-label="Apri menu di navigazione">Menu</summary>
        <nav className="mobile-nav" aria-label="Navigazione mobile">
          {primaryLinks.map(link => (
            <Link href={link.href} key={link.href} onClick={closeMobileMenu}>{link.label}</Link>
          ))}
          <Link href="/operatori/candidatura" onClick={closeMobileMenu}>Sei un operatore?</Link>
          <Link href="/contatti" onClick={closeMobileMenu}>Contatti</Link>
        </nav>
      </details>
    </header>
  );
}
