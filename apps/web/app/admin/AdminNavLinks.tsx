"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLinks({ applicationsPending, operatorExperiencePending }: { applicationsPending: number; operatorExperiencePending: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Dashboard", count: 0 },
    { href: "/admin/candidature", label: "Candidature", count: applicationsPending },
    { href: "/admin/operatori", label: "Operatori", count: operatorExperiencePending },
    { href: "/admin/itinerari", label: "Itinerari", count: 0 },
  ];
  return <nav aria-label="Sezioni del Centro operativo" className="admin-shell-nav">
    <div className="admin-shell-nav__inner">
      {items.map(item => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
        return <Link key={item.href} href={item.href} className={active ? "admin-shell-nav__tab admin-shell-nav__tab--active" : "admin-shell-nav__tab"} aria-current={active ? "page" : undefined}>
          {item.label}
          {item.count > 0 && <span className="admin-shell-nav__badge" aria-label={item.count + " novità pendenti"}>{item.count}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
