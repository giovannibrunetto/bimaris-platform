"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLinks({ applicationsPending, operatorExperiencePending }: { applicationsPending: number; operatorExperiencePending: number }) {
  const pathname = usePathname();
  // Administrative pages enforce authorization on the server. Hide only on public auth steps.
  const hiddenOnAuthRoute = pathname === "/admin/login" || pathname === "/admin/mfa" || pathname === "/admin/reset-password" || pathname.startsWith("/admin/reset-password/");
  const detailContext = /^\/admin\/(?:esperienze|operatori|candidature|eventi)\/(?!nuova(?:\/|$))[^/]+/.test(pathname);
  const items = [
    { href: "/admin", label: "Dashboard", count: 0 },
    { href: "/admin/contenuti", label: "Da esaminare", count: applicationsPending + operatorExperiencePending },
    { href: "/admin/operatori", label: "Operatori", count: 0 },
    { href: "/admin/questionari", label: "Questionari e sondaggi", count: 0 },
  ];
  if (hiddenOnAuthRoute) return null;
  return <nav aria-label="Sezioni del Centro operativo" className={detailContext ? "admin-shell-nav admin-shell-nav--detail" : "admin-shell-nav"}>
    <div className="admin-shell-nav__inner">
      {items.map(item => {
        const reviewContext = item.href === "/admin/contenuti" && /^\/admin\/(candidature|attivita|eventi|esperienze|revisione-esperienza)(?:\/|$)/.test(pathname);
        const active = reviewContext || pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
        return <Link key={item.href} href={item.href} className={active ? "admin-shell-nav__tab admin-shell-nav__tab--active" : "admin-shell-nav__tab"} aria-current={active ? "page" : undefined}>
          {item.label}
          {item.count > 0 && <span className="admin-shell-nav__badge" aria-label={item.count + " novità pendenti"}>{item.count}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
