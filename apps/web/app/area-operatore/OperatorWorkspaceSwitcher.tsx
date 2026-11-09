"use client";

import { usePathname, useRouter } from "next/navigation";
import "./workspace-switcher.css";

type Activity = { id: string; slug: string; name: string };
const sections = [
  { href: "/area-operatore", label: "Area operatore", icon: "⌂" },
  { href: "/area-operatore/calendario", label: "Importa calendario", icon: "▣" },
  { href: "/area-operatore/network-b2b", label: "Network B2B", icon: "♧" },
];

export default function OperatorWorkspaceSwitcher({ activities, selectedSlug }: { activities: Activity[]; selectedSlug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activities.find(a => a.slug === selectedSlug || a.id === selectedSlug) ?? activities[0];
  if (!active) return null;
  function changeActivity(slug: string) {
    const query = new URLSearchParams(window.location.search);
    query.set("operatore", slug);
    // Switching activity must never carry another operator's experience or invitation.
    for (const key of ["experience", "step", "collaboration", "invito"]) query.delete(key);
    router.push(`${pathname}?${query.toString()}`);
  }
  return (
    <nav className="operator-workspace-switcher" aria-label="Attività e sezioni operatore">
      <div className="operator-workspace-switcher__activity">
        <span className="operator-workspace-switcher__activity-label"><span aria-hidden="true" className="operator-workspace-switcher__activity-icon">◇</span>Attività</span>
        <select aria-label="Attività che gestisci" value={active.slug} onChange={e => changeActivity(e.target.value)}>
          {activities.map(a => <option key={a.id} value={a.slug}>{a.name}</option>)}
        </select>
      </div>
      <div className="operator-workspace-switcher__divider" aria-hidden="true" />
      <div className="operator-workspace-switcher__sections">
        {sections.map(s => {
          const selected = pathname === s.href || (s.href === "/area-operatore" && pathname === "/area-operatore/");
          return <a key={s.href} href={`${s.href}?operatore=${encodeURIComponent(active.slug)}`} className="operator-workspace-switcher__link" aria-current={selected ? "page" : undefined}>
            <span className="operator-workspace-switcher__section-icon" aria-hidden="true">{s.icon}</span>{s.label}
          </a>;
        })}
      </div>
    </nav>
  );
}
