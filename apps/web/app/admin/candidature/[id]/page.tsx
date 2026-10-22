import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic"; export const revalidate=0;
function fmt(v:string){return new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v));}
function statusLabel(v:string){return ({new:"Nuova",reviewing:"In valutazione",accepted:"Accettata",rejected:"Rifiutata"} as Record<string,string>)[v]??v;}
function modeLabel(v?:string|null){return ({fixed:"Sede fisica",physical:"Sede fisica",itinerant:"Attività itinerante / senza sede aperta al pubblico",both:"Sede fisica e attività itinerante"} as Record<string,string>)[v??""]??v??"—";}
const fieldStyle={display:"grid",gap:6,fontSize:13,fontWeight:700,color:"#26343d"} as const;
const inputStyle={width:"100%",minHeight:44,border:"1px solid #d8d3ca",borderRadius:10,padding:"0 12px",background:"#fff",color:"#101820"} as const;
export default async function Page({params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin/login"); const {id}=await params; const db=createServiceClient(); if(!db)throw new Error("Supabase non configurato");
 const {data:a}=await db.from("operator_applications").select("*").eq("id",id).maybeSingle(); if(!a)notFound();
 const facts=[["Referente",a.contact_name],["Email",a.email],["Telefono",a.phone??"—"],["WhatsApp",a.whatsapp??"—"],["Modalità operativa",modeLabel(a.operating_mode)],["Comune / località",a.location??"—"],["Indirizzo sede",a.address??"—"],["Sito / Instagram",a.website??a.instagram??"—"]];
 return <section style={{padding:"42px 20px 72px",background:"#f5eddf",minHeight:"75vh"}}><div style={{maxWidth:1050,margin:"0 auto"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"center",flexWrap:"wrap",marginBottom:18}}><Link className="text-link" href="/admin/candidature">← Tutte le candidature</Link><span style={{padding:"8px 12px",borderRadius:999,background:a.status==="new"?"#f7e8cc":"#eef1f3",fontSize:12,fontWeight:800,color:"#614617"}}>{statusLabel(a.status)}</span></div>
  <article style={{background:"#fff",border:"1px solid #dfd6c8",borderRadius:22,padding:"clamp(22px,4vw,38px)",boxShadow:"0 14px 38px rgba(7,24,35,.06)"}}>
   <div style={{paddingBottom:20,borderBottom:"1px solid #eee8df"}}><div className="eyebrow">{a.category??"Categoria non indicata"}</div><h1 style={{margin:"6px 0 8px",font:"500 clamp(34px,5vw,50px) Georgia,serif"}}>{a.business_name}</h1><div style={{color:"#6e7680",fontSize:13}}>Candidatura ricevuta {fmt(a.created_at)}</div></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px 28px",padding:"25px 0"}}>{facts.map(([label,value])=><div key={label}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:'.08em',fontWeight:800,color:"#9a7b47",marginBottom:5}}>{label}</div><div style={{fontSize:14,color:"#26343d",overflowWrap:"anywhere"}}>{value}</div></div>)}</div>
   <div style={{padding:"18px 20px",borderRadius:14,background:"#f8f5ef",border:"1px solid #eee5d8"}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:'.08em',fontWeight:800,color:"#9a7b47",marginBottom:7}}>Presentazione</div><div style={{lineHeight:1.65,color:"#35434c"}}>{a.description}</div></div>
   {(a.status==="new"||a.status==="reviewing")&&<form method="post" action="/api/admin/applications" style={{display:"grid",gridTemplateColumns:"minmax(220px,.65fr) minmax(300px,1.35fr)",gap:14,marginTop:22}}><input type="hidden" name="application_id" value={a.id}/><input type="hidden" name="business_name" value={a.business_name}/><label style={fieldStyle}>Slug della scheda<input style={inputStyle} name="slug" defaultValue={a.business_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}/></label><label style={fieldStyle}>Note interne BIMARIS<textarea name="notes" defaultValue={a.review_notes??""} style={{...inputStyle,minHeight:78,padding:11,resize:"vertical"}}/></label><div style={{gridColumn:"1 / -1",display:"flex",gap:9,flexWrap:"wrap",paddingTop:2}}><button className="button ghost" name="action" value="reviewing">In valutazione</button><button className="button" name="action" value="accept">Approva</button><button className="button" name="action" value="accept_publish">Approva e pubblica</button><button className="button ghost" name="action" value="reject">Rifiuta</button></div></form>}
   {a.status==="accepted"&&a.operator_id&&<div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginTop:22}}><Link className="text-link" href={`/admin/operatori/${a.operator_id}`}>Apri dossier operatore →</Link><form method="post" action="/api/admin/applications"><input type="hidden" name="application_id" value={a.id}/><input type="hidden" name="operator_id" value={a.operator_id}/><button className="button ghost" name="action" value="send_operator_access">Invia / reinvia accesso</button></form></div>}
  </article>
 </div></section>;
}
