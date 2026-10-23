import Link from "next/link";
import "./correction-actions.css";

export default function AreaOperatoreLayout({children}:{children:React.ReactNode}){
  return <>
    <nav aria-label="Navigazione area operatore" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",padding:"10px 6vw",background:"#071b28",borderBottom:"1px solid rgba(202,168,106,.24)"}}>
      <Link href="/area-operatore" style={{color:"#fff",textDecoration:"none",fontSize:13,fontWeight:800}}>Area operatore</Link>
      <span style={{color:"rgba(255,255,255,.35)"}}>·</span>
      <Link href="/area-operatore/calendario" style={{color:"#caa86a",textDecoration:"none",fontSize:13,fontWeight:800}}>Importa calendario</Link>
    </nav>
    {children}
  </>;
}
