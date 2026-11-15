import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collaudo mobile questionario | BIMARIS", robots: { index: false, follow: false, noarchive: true } };

export default function SurveyViewportPreview() {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
  return <div style={{ minHeight: "100svh", background: "#032126", color: "#e3c38a", padding: "20px 0", fontFamily: "Arial, sans-serif" }}>
    <p style={{ textAlign: "center", fontSize: 12, margin: "0 0 14px" }}>Collaudo responsive · viewport 390 × 844 px · raccolta disattivata</p>
    <iframe title="Questionario BIMARIS — viewport mobile 390 pixel" src="/questionario-cittadini" width="390" height="844" style={{ display: "block", width: 390, height: 844, maxWidth: "100%", border: "1px solid #caa86a", borderRadius: 12, margin: "0 auto", background: "#032126" }} />
  </div>;
}
