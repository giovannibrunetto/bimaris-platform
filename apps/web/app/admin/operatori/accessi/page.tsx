import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function Page(){
 if(!(await isAdminAuthenticated())) redirect("/admin/login");
 const db=createServiceClient(); if(!db) throw new Error("Supabase non configurato");
 const {data}=await db.from("operators").select("id,slug,name,category,published").order("name");
 return <section className="section"><div className="section-head"><div><div className="kicker">Area privata</div><h1>Accessi operatori</h1></div><Link className="button ghost" href="/admin/operatori">Torna agli operatori</Link></div><p>Collega un account BIMARIS già registrato alla relativa attività.</p><div style={{display:"grid",gap:18,marginTop:24}}>{(data??[]).map((o:any)=><article className="detail-panel" key={o.id}><div className="eyebrow">{o.category??"Operatore"} · {o.published?"Online":"Non pubblicato"}</div><h3>{o.name}</h3><form method="post" action="/api/admin/operator-memberships" style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end"}}><input type="hidden" name="operator_id" value={o.id}/><label>Email account<input name="email" type="email" required/></label><label>Ruolo<select name="role" defaultValue="owner"><option value="owner">Titolare</option><option value="manager">Manager</option><option value="viewer">Solo lettura</option></select></label><button className="button" type="submit">Collega account</button></form></article>)}</div></section>;
}
