import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Amministrazione BIMARIS",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authenticated = await isAdminAuthenticated();

  return (
    <>
      {authenticated && (
        <nav aria-label="Amministrazione BIMARIS" style={{ padding: "14px 6vw", display: "flex", gap: 18, flexWrap: "wrap", borderBottom: "1px solid rgba(3,17,26,.10)", background: "#f7f2e8" }}>
          <Link className="text-link" href="/admin">Dashboard</Link>
          <Link className="text-link" href="/admin/esperienze">Esperienze</Link>
          <Link className="text-link" href="/operatori" target="_blank" rel="noreferrer">Operatori pubblici ↗</Link>
          <Link className="text-link" href="/esperienze" target="_blank" rel="noreferrer">Esperienze pubbliche ↗</Link>
        </nav>
      )}
      {children}
    </>
  );
}
