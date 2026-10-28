"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import "./correction-actions.css";

export default function AreaOperatoreLayout({children}:{children:React.ReactNode}){
  const searchParams=useSearchParams();
  const operator=searchParams.get("operatore");
  const suffix=operator?`?operatore=${encodeURIComponent(operator)}`:"";
  return <>
    <nav aria-label="Navigazione area operatore" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",padding:"10px 6vw",background:"#071b28",borderBottom:"1px solid rgba(202,168,106,.24)"}}>
      <Link href={`/area-operatore${suffix}`} style={{color:"#fff",textDecoration:"none",fontSize:13,fontWeight:800}}>Area operatore</Link>
      <span style={{color:"rgba(255,255,255,.35)"}}>·</span>
      <Link href={`/area-operatore/calendario${suffix}`} style={{color:"#caa86a",textDecoration:"none",fontSize:13,fontWeight:800}}>Importa calendario</Link>
      <span style={{color:"rgba(255,255,255,.35)"}}>·</span>
      <Link href={`/area-operatore/network-b2b${suffix}`} style={{color:"#caa86a",textDecoration:"none",fontSize:13,fontWeight:800}}>Network B2B</Link>
    </nav>
    {children}
  </>;
}
