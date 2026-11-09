"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Activity = { id: string; slug: string; name: string };
const sections = [
 {href:"/area-operatore",label:"Area operatore"},
 {href:"/area-operatore/calendario",label:"Importa calendario"},
 {href:"/area-operatore/network-b2b",label:"Network B2B"},
] as const;

export default function OperatorWorkspaceNavigation({activities}:{activities:Activity[]}) {
 const pathname=usePathname();
 const params=useSearchParams();
 const requested=params.get("operatore");
 const active=activities.find(a=>a.id===requested||a.slug===requested)??activities[0];
 const suffix=active?`?operatore=${encodeURIComponent(active.slug)}`:"";
 return <div className="operator-workspace-navigation">
  {activities.length>0&&<nav className="operator-workspace-activities" aria-label="Attività che gestisci">
   <div className="operator-workspace-activities__inner">
    <strong>Attività che gestisci</strong>
    <div className="operator-workspace-activities__choices">
     {activities.map(activity=><Link key={activity.id} href={`${pathname}?operatore=${encodeURIComponent(activity.slug)}`} aria-current={active?.id===activity.id?"true":undefined} className="operator-workspace-activities__choice">{activity.name}</Link>)}
    </div>
   </div>
  </nav>}
  <nav className="operator-section-nav" aria-label="Navigazione area operatore">
   <div className="operator-section-nav__inner">
    {sections.map(section=><Link key={section.href} href={`${section.href}${suffix}`} className="operator-section-nav__link" aria-current={pathname===section.href||(section.href==="/area-operatore"&&pathname==="/area-operatore/")?"page":undefined}>{section.label}</Link>)}
   </div>
  </nav>
 </div>;
}
