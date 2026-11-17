"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLinks({ applicationsPending, operatorExperiencePending }: { applicationsPending: number; operatorExperiencePending: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Dashboard", count: 0 },
    { href: "/admin/candidature", label: "Candidature", count: applicationsPending },
    { href: "/admin/contenuti", label: "Da esaminare", count: operatorExperiencePending },
    { href: "/admin/operatori", label: "Operatori", count: 0 },
    { href: "/admin/attivita", label: "Esperienze e appuntamenti", count: 0 },
    { href: "/admin/itinerari", label: "Itinerari", count: 0 },
    { href: "/admin/questionari", label: "Questionari e sondaggi", count: 0 },
    { href: "/questionario-cittadini", label: "Apri il questionario ↗", count: 0, external: true },
  ];
  return <nav aria-label="Sezioni del Centro operativo" className="admin-shell-nav">
    <div className="admin-shell-nav__inner">
      {items.map(item => {
        const active = !("external" in item && item.external) && (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/")));
        return <Link key={item.href} href={item.href} className={active ? "admin-shell-nav__tab admin-shell-nav__tab--active" : "external" in item && item.external ? "admin-shell-nav__tab admin-shell-nav__tab--questionnaire" : "admin-shell-nav__tab"} aria-current={active ? "page" : undefined}>
          {item.label}
          {item.count > 0 && <span className="admin-shell-nav__badge" aria-label={item.count + " novità pendenti"}>{item.count}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
