"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const primaryLinks = [
  { href: "/cultura", label: "Cultura" },
  { href: "/storie-miti-leggende", label: "Miti e leggende" },
  { href: "/itinerari", label: "Percorsi" },
  { href: "/mappa", label: "Mappa" },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
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
          <Link
            href={link.href}
            key={link.href}
            aria-current={isCurrentPath(pathname, link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/accedi" aria-current={isCurrentPath(pathname, "/accedi") ? "page" : undefined}>Accedi</Link>
      </nav>

      <details className="mobile-menu" ref={mobileMenuRef}>
        <summary aria-label="Apri menu di navigazione">Menu</summary>
        <nav className="mobile-nav" aria-label="Navigazione mobile">
          {primaryLinks.map(link => (
            <Link
              href={link.href}
              key={link.href}
              onClick={closeMobileMenu}
              aria-current={isCurrentPath(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/accedi" onClick={closeMobileMenu} aria-current={isCurrentPath(pathname, "/accedi") ? "page" : undefined}>Accedi / Il tuo BIMARIS</Link>
          <Link href="/operatori/candidatura" onClick={closeMobileMenu} aria-current={isCurrentPath(pathname, "/operatori/candidatura") ? "page" : undefined}>Sei un operatore?</Link>
          <Link href="/contatti" onClick={closeMobileMenu} aria-current={isCurrentPath(pathname, "/contatti") ? "page" : undefined}>Contatti</Link>
        </nav>
      </details>
    </header>
  );
}
