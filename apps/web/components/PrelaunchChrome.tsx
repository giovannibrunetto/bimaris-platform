import Link from "next/link";

export function PrelaunchHeader() {
  return (
    <header className="site-header">
      <Link className="brand brand-image" aria-label="BIMARIS — Messina da Vivere" href="/" />
      <nav className="nav" aria-label="Pre-lancio">
        <Link href="/operatori/interesse">Sei un operatore?</Link>
      </nav>
    </header>
  );
}

export function PrelaunchFooter() {
  return (
    <footer style={{padding:"32px 20px",background:"#032126",color:"#f7f3eb",textAlign:"center"}}>
      <div style={{display:"flex",justifyContent:"center",gap:20,flexWrap:"wrap",fontSize:13}}>
        <Link href="/operatori/interesse">Operatori</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookie">Cookie</Link>
        <Link href="/note-legali">Note legali</Link>
      </div>
      <p style={{margin:"18px 0 0",fontSize:12,opacity:.78}}>© 2026 BIMARIS — Messina da Vivere.</p>
    </footer>
  );
}
