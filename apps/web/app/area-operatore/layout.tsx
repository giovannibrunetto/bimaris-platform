"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import "./correction-actions.css";
import "./operator-navigation.css";

const sections = [
  { href: "/area-operatore", label: "Area operatore" },
  { href: "/area-operatore/calendario", label: "Importa calendario" },
  { href: "/area-operatore/network-b2b", label: "Network B2B" },
] as const;

export default function AreaOperatoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const operator = searchParams.get("operatore");
  const suffix = operator ? `?operatore=${encodeURIComponent(operator)}` : "";

  return <>
    <nav className="operator-section-nav" aria-label="Navigazione area operatore">
      <div className="operator-section-nav__inner">
        {sections.map(section => {
          const selected = pathname === section.href || (section.href === "/area-operatore" && pathname === "/area-operatore/");
          return (
            <Link
              key={section.href}
              href={`${section.href}${suffix}`}
              className="operator-section-nav__link"
              aria-current={selected ? "page" : undefined}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
    {children}
  </>;
}
