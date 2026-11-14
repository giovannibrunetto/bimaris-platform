"use client";

import { usePathname, useRouter } from "next/navigation";
import "./workspace-switcher.css";

type Activity = { id: string; slug: string; name: string };
const sections = [
  { href: "/area-operatore", label: "Area operatore", icon: "home" },
  { href: "/area-operatore/calendario", label: "Importa calendario", icon: "calendar" },
  { href: "/area-operatore/network-b2b", label: "Network B2B", icon: "network" },
];

function SectionIcon({ name }: { name: string }) {
  const common = { width: 23, height: 23, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M8 17h3M15 14h2"/></svg>;
  if (name === "network") return <svg {...common}><circle cx="12" cy="4.5" r="2.5"/><circle cx="5" cy="18.5" r="2.5"/><circle cx="19" cy="18.5" r="2.5"/><path d="M10.5 6.6 6.5 16M13.5 6.6 17.5 16M7.5 18.5h9"/></svg>;
  return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/></svg>;
}

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
            <span className="operator-workspace-switcher__section-icon" aria-hidden="true"><SectionIcon name={s.icon}/></span>{s.label}
          </a>;
        })}
      </div>
    </nav>
  );
}
