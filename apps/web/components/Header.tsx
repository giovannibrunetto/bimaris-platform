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
  { href: "/operatori/candidatura", label: "Candida la tua attività" },
  { href: "/contatti", label: "Contatti" },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const [access,setAccess] = useState<"guest"|"user"|"operator"|"both">("guest");
  const [adminAccess,setAdminAccess] = useState<{visible:boolean;verified:boolean}>({visible:false,verified:false});

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

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setAdminAccess({visible:false,verified:false});
    async function checkAdminNavigation() {
      try {
        const response = await fetch("/api/admin/nav-access", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result: { visible?: boolean; verified?: boolean } = await response.json();
        if (active) setAdminAccess({visible:result.visible === true,verified:result.verified === true});
      } catch {
        // Keep the link hidden when the session check is unavailable.
      }
    }
    void checkAdminNavigation();
    const supabase = createBrowserSupabaseClient();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      // Refresh after login/logout/MFA changes, never derive the admin role
      // from client-provided identity or operator membership.
      queueMicrotask(() => {
        if (active) { setAdminAccess({visible:false,verified:false}); void checkAdminNavigation(); }
      });
    });
    return () => {
      active = false;
      controller.abort();
      subscription?.data.subscription.unsubscribe();
    };
  }, [pathname]);

  const accessLinks = [
    access === "guest"
      ? { href: "/accedi/utente", label: "Accesso utente" }
      : { href: "/profilo", label: "Area personale" },
    access === "guest" || access === "user"
      ? { href: "/accedi/operatore", label: "Accedi come operatore" }
      : { href: "/area-operatore", label: "Area Operatore" },
  ];

  const adminLink = adminAccess.visible
    ? { href: adminAccess.verified ? "/admin" : "/admin/mfa", label: "Area Amministratore" }
    : null;

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
        {adminLink && <Link href={adminLink.href} aria-current={isCurrentPath(pathname,adminLink.href)?"page":undefined}>{adminLink.label}</Link>}
        {utilityLinks.filter(link=>access!=="both"&&access!=="operator"||link.href!=="/operatori/candidatura").map(link => (
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
          {adminLink && <Link href={adminLink.href} onClick={closeMobileMenu} aria-current={isCurrentPath(pathname,adminLink.href)?"page":undefined}>{adminLink.label}</Link>}
          {utilityLinks.filter(link=>access!=="both"&&access!=="operator"||link.href!=="/operatori/candidatura").map(link => (
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
