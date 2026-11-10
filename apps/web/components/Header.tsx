"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const primaryLinks = [
  { href: "/cultura", label: "Cultura" },
  { href: "/storie-miti-leggende", label: "Miti e leggende" },
  { href: "/borghi", label: "Borghi" },
  { href: "/rete-bimaris", label: "Rete BIMARIS" },
  { href: "/mappa", label: "Mappa" },
];

const utilityLinks = [
  { href: "/operatori/candidatura", label: "Sei un operatore?" },
  { href: "/contatti", label: "Contatti" },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const [access,setAccess] = useState<"guest"|"user"|"operator"|"both">("guest");

  useEffect(() => {
    const supabase=createBrowserSupabaseClient();
    if(!supabase)return;
    let active=true;
    let request=0;
    async function refresh(){
      const current=++request;
      const {data:{user},error}=await supabase!.auth.getUser();
      if(!active||current!==request)return;
      if(error||!user){setAccess("guest");return;}
      const {data:memberships,error:membershipError}=await supabase!.from("operator_memberships").select("role").eq("user_id",user.id);
      if(!active||current!==request)return;
      if(membershipError){setAccess("user");return;}
      const hasOperator=(memberships??[]).some(item=>["owner","manager","viewer"].includes(item.role));
      setAccess(hasOperator?"both":"user");
    }
    void refresh();
    const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{
      queueMicrotask(()=>{if(active)void refresh();});
    });
    return()=>{active=false;request++;subscription.unsubscribe();};
  },[]);

  const accessLinks=access==="guest"
    ?[{href:"/accedi",label:"Accedi"}]
    :access==="user"
      ?[{href:"/profilo",label:"Area personale"}]
      :[{href:"/profilo",label:"Area personale"},{href:"/area-operatore",label:"Area Operatore"}];

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
        {accessLinks.map(link=><Link key={link.href} href={link.href} aria-current={isCurrentPath(pathname,link.href)?"page":undefined}>{link.label}</Link>)}
        {utilityLinks.map(link => (
          <Link
            href={link.href}
            key={link.href}
            aria-current={isCurrentPath(pathname, link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
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
          {accessLinks.map(link=><Link key={link.href} href={link.href} onClick={closeMobileMenu} aria-current={isCurrentPath(pathname,link.href)?"page":undefined}>{link.label}</Link>)}
          {utilityLinks.map(link => (
            <Link
              href={link.href}
              key={link.href}
              onClick={closeMobileMenu}
              aria-current={isCurrentPath(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
