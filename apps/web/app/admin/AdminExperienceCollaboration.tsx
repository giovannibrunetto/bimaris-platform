"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Participant={operator_id:string;name:string;role:string;activity_label:string|null;approval_status:string;approved_at:string|null};
const statusLabel=(status:string)=>status==="accepted"?"Confermata":status==="rejected"?"Rifiutata":"In attesa";
export default function AdminExperienceCollaboration(){
 const pathname=usePathname();
 const match=pathname.match(/^\/admin\/esperienze\/([^/]+)$/);
 const [rows,setRows]=useState<Participant[]>([]);
 useEffect(()=>{setRows([]);if(!match)return;const controller=new AbortController();fetch(`/api/admin/experiences/${encodeURIComponent(match[1])}/collaboration`,{signal:controller.signal,cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(data?.participants)setRows(data.participants)}).catch(()=>{});return()=>controller.abort()},[pathname]);
 if(!match||!rows.length)return null;
 return <section style={{background:"#f8f4ee",padding:"14px 5vw 0"}}><article style={{padding:"18px 22px",background:"#fff",border:"1.5px solid #c99a4b",borderRadius:14,boxShadow:"0 5px 18px rgba(57,39,21,.05)"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".14em",fontWeight:800,color:"#a6763b"}}>COLLABORAZIONE BIMARIS</div><h2 style={{margin:"5px 0 12px",fontSize:21}}>Operatori coinvolti</h2><div style={{display:"grid",gap:8}}>{rows.map(row=><div key={row.operator_id} style={{display:"grid",gridTemplateColumns:"minmax(170px,1.2fr) minmax(180px,2fr) minmax(110px,.7fr)",gap:12,alignItems:"center",padding:"11px 13px",background:"#faf8f4",border:"1px solid #e9dfd4",borderRadius:10}}><div><strong>{row.name}</strong><div style={{fontSize:11,color:"#786b5e",marginTop:2}}>{row.role==="editor"?"Operatore proponente":"Operatore partner"}</div></div><div style={{fontSize:13}}>{row.activity_label||"Attività non specificata"}</div><div style={{fontSize:12,fontWeight:800}}>{statusLabel(row.approval_status)}</div></div>)}</div></article></section>;
}
