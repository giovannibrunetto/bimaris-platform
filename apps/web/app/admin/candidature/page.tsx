import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic"; export const revalidate=0;
function fmt(v:string){return new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v));}
function statusLabel(v:string){return ({new:"Nuova",reviewing:"In valutazione",accepted:"Accettata",rejected:"Rifiutata"} as Record<string,string>)[v]??v;}
function stateMessage(state?:string){const m:Record<string,string>={reviewing:"Candidatura messa in valutazione.",rejected:"Candidatura rifiutata.",accepted:"Candidatura approvata.",published:"Candidatura approvata e operatore pubblicato.","accepted-access-invited":"Candidatura approvata. Invito all'area operatore inviato.","published-access-invited":"Operatore pubblicato. Invito all'area operatore inviato.","access-invited":"Invito all'area operatore inviato.","access-sent":"Link di accesso inviato.","access-email-failed":"Invio email non riuscito.","action-error":"Operazione non riuscita."};return state?(m[state]??state):null;}
const filters=[{key:"all",label:"Totali"},{key:"pending",label:"Da esaminare"},{key:"reviewing",label:"In valutazione"},{key:"closed",label:"Concluse"}] as const;
const statusTone:Record<string,{bg:string;color:string}>={new:{bg:"#f5e7c9",color:"#73531e"},reviewing:{bg:"#e8edf0",color:"#405563"},accepted:{bg:"#167347",color:"#ffffff"},rejected:{bg:"#f2e5e2",color:"#7b433b"}};
export default async function Page({searchParams}:{searchParams:Promise<{state?:string;filter?:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin/login"); const db=createServiceClient(); if(!db)throw new Error("Supabase non configurato");
 const {data}=await db.from("operator_applications").select("*").order("created_at",{ascending:false}).limit(200); const applications=data??[]; const {state,filter}=await searchParams; const message=stateMessage(state);
 const activeFilter=filters.some((x)=>x.key===filter)?filter??"all":"all"; const visibleApplications=activeFilter==="all"?applications:applications.filter((a:any)=>activeFilter==="pending"?a.status==="new":activeFilter==="closed"?a.status==="accepted"||a.status==="rejected":a.status===activeFilter);
 const counts=applications.reduce<Record<string,number>>((a:any,x:any)=>(a[x.status]=(a[x.status]??0)+1,a),{});
 return <>
  <style>{`
.bimaris-candidature-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}
.bimaris-candidature-status{display:flex;justify-content:center}
.bimaris-candidature-controls{display:flex;flex-direction:column;align-items:flex-end;gap:10px}.bimaris-candidature-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.bimaris-candidature-action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:0;padding:10px 16px;font-size:13px;text-align:center;white-space:nowrap;text-decoration:none}
.bimaris-candidature-action--secondary{background:transparent;color:var(--navy);border:1px solid var(--navy)}
.bimaris-candidature-action--primary{background:var(--gold);color:#10202b;border:1px solid var(--gold)}
.bimaris-candidature-action:hover{filter:brightness(.96)}
.bimaris-candidature-action:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
@media(max-width:850px){.bimaris-candidature-row{grid-template-columns:minmax(0,1fr)}.bimaris-candidature-controls{align-items:flex-start}.bimaris-candidature-status{justify-content:flex-start}.bimaris-candidature-actions{justify-content:flex-start}}
@media(max-width:430px){.bimaris-candidature-row{grid-template-columns:minmax(0,1fr)}.bimaris-candidature-status{justify-content:flex-start}.bimaris-candidature-actions{flex-direction:column;align-items:stretch;width:100%}.bimaris-candidature-action{width:100%;min-width:0;white-space:normal}}
`}</style>
  <section style={{background:"#f5eddf",padding:"24px 20px 12px"}}><div style={{maxWidth:1180,margin:"0 auto"}}><div className="kicker">Area privata · Amministrazione</div><div style={{display:"flex",alignItems:"end",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}><div><h1 style={{margin:"4px 0 4px",font:"500 clamp(34px,4vw,48px)/1 Georgia,serif"}}>Candidature</h1><p style={{margin:0,color:"#667078",fontSize:14,lineHeight:1.45}}>Esamina e gestisci l’ingresso degli operatori nella piattaforma.</p></div></div></div></section>
  {message&&<section style={{padding:"8px 20px 0",background:"#f5eddf"}}><div style={{maxWidth:1180,margin:"0 auto",padding:"10px 13px",borderRadius:10,background:"#fff",border:"1px solid #dfd4c3",fontSize:13}}>{message}</div></section>}
  <section id="pending-candidatures" style={{padding:"16px 20px 30px",background:"#f5eddf",minHeight:"45vh",scrollMarginTop:110}}><div style={{maxWidth:1180,margin:"0 auto"}}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(135px,1fr))",gap:8,marginBottom:18,overflowX:"auto"}}>{filters.map(({key,label})=>{const value=key==="all"?applications.length:key==="pending"?(counts.new??0):key==="closed"?(counts.accepted??0)+(counts.rejected??0):counts[key]??0;const selected=activeFilter===key;return <Link key={key} href={key==="all"?"/admin/candidature":`/admin/candidature?filter=${key}`} aria-current={selected?"page":undefined} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,textDecoration:"none",background:selected?"#eee3d2":"rgba(255,255,255,.72)",border:selected?"1px solid #b99863":"1px solid #e1d6c6",borderRadius:11,padding:"10px 13px",minWidth:110}}><span style={{fontSize:12,fontWeight:selected?800:600,color:selected?"#6e5125":"#756858"}}>{label}</span><strong style={{font:"600 19px Georgia,serif",color:"#17242d"}}>{value}</strong></Link>})}</div>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:10}}><div><div className="kicker">Gestione</div><h2 style={{margin:"2px 0 0",font:"500 clamp(25px,3vw,34px) Georgia,serif"}}>{activeFilter==="all"?"Candidature ricevute":`${filters.find((x)=>x.key===activeFilter)?.label}: ${visibleApplications.length}`}</h2></div></div>
   <div style={{display:"grid",gap:7}}>{visibleApplications.map((a:any)=>{const tone=statusTone[a.status]??statusTone.reviewing;return <article key={a.id} className="bimaris-candidature-row" style={{background:"#fff",border:"1px solid #dfd6c8",borderRadius:13,padding:"11px 14px"}}>
    <div style={{minWidth:0}}><div className="eyebrow" style={{fontSize:10}}>{a.category??"Categoria non indicata"}</div><h3 style={{margin:"2px 0 3px",font:"500 22px Georgia,serif",overflowWrap:"anywhere"}}>{a.business_name}</h3><div style={{color:"#727b82",fontSize:12}}>{a.location??"Località non indicata"} · {fmt(a.created_at)}</div></div>
    <div className="bimaris-candidature-controls"><div className="bimaris-candidature-status"><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:94,padding:"6px 10px",borderRadius:999,background:tone.bg,fontSize:11,fontWeight:800,color:tone.color}}>{statusLabel(a.status)}</span></div>
    <div className="bimaris-candidature-actions">{a.status==="accepted"&&a.operator_id?<Link className="button bimaris-candidature-action bimaris-candidature-action--primary" href={`/admin/operatori/${a.operator_id}?tab=profilo`}>Gestisci operatore →</Link>:<Link className="button bimaris-candidature-action bimaris-candidature-action--primary" href={`/admin/candidature/${a.id}`}>{a.status==="reviewing"?"Continua valutazione →":a.status==="rejected"||a.status==="accepted"?"Visualizza candidatura →":"Esamina candidatura →"}</Link>}</div></div>
   </article>})}{visibleApplications.length===0&&<div style={{background:"#fff",border:"1px solid #dfd6c8",borderRadius:13,padding:20}}>Nessuna candidatura in questa sezione.</div>}</div>
  </div></section>
 </>;
}
