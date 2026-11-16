import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { surveyTestSession } from "@/lib/survey/security";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collaudo questionario | BIMARIS", robots: { index: false, follow: false, noarchive: true } };
export default async function SurveyViewportPreview({ searchParams }: { searchParams: Promise<{ width?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
  const requested = Number((await searchParams).width);
  const width = [360, 390, 430, 768, 1280, 1440].includes(requested) ? requested : 390;
  const test = await surveyTestSession();
  return <div style={{ minHeight: "100svh", background: "#032126", color: "#e3c38a", padding: "20px 0", fontFamily: "Arial, sans-serif" }}>
    <p style={{ textAlign: "center", fontSize: 12 }}>Collaudo responsive · viewport {width} × 844 px · {test ? "salvataggio di soli dati fittizi" : "raccolta disattivata"}</p>
    <nav aria-label="Risoluzione di collaudo" style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>{[360,390,430,768,1280,1440].map(w => <a key={w} href={`?width=${w}`}>{w} px</a>)}</nav>
    <div style={{ overflowX: "auto" }}><iframe title={`Questionario BIMARIS — viewport ${width} pixel`} src="/questionario-cittadini" width={width} height="844" style={{ display: "block", width, height: 844, border: 0, margin: "0 auto", background: "#032126" }} /></div>
    {!test && <form action="/questionario-cittadini/collaudo/session" method="post" style={{ maxWidth: 440, margin: "30px auto", padding: 20 }}>
      <h2>Accesso riservato al collaudo</h2><p>Consente salvataggi di prova per 30 minuti. Usa esclusivamente dati inventati, email @example.invalid e risposta aperta con prefisso COLLAUDO:.</p>
      <label htmlFor="test-code">Codice riservato</label><input id="test-code" name="code" type="password" required maxLength={128} autoComplete="off" style={{ display: "block", width: "100%", margin: "12px 0", color: "#032126", background: "white" }} /><button type="submit">Abilita collaudo</button>
    </form>}
  </div>;
}
