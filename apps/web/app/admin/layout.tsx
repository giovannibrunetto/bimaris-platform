import type { Metadata } from "next";
import "./admin-experience-create.css";
import "./admin-a9.css";

export const metadata: Metadata = {
  title: "Amministrazione BIMARIS",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

// Keep the shared layout free of session-dependent UI. In the App Router,
// layouts are reused across child-route navigations and can retain stale
// authentication state. AdminTemplate re-evaluates it on each navigation.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
