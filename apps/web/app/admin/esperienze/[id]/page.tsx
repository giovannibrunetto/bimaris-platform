import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Photo={storage_path:string;alt_text:string|null;sort_order:number;is_cover:boolean};
const mediaUrl=(path:string)=>`${process.env.NEXT_PUBLIC_SUPABASE_URL??"https://vhvccwvcqdhiovpopsze.supabase.co"}/storage/v1/object/public/experience-media/${path.split("/").map(encodeURIComponent).join("/")}`;

export default async function AdminExperienceDetailPage({params}:{params:Promise<{id:string}>}){
  if(!(await isAdminAuthenticated())) redirect("/admin/login");
  const {id}=await params;
  const supabase=createServiceClient();
  if(!supabase) throw new Error("Supabase service client non configurato");
  const [{data:item},{data:photos}]=await Promise.all([
    supabase.from("experiences").select("*,operator:operators(name),territory:territories(name),category:categories(name)").eq("id",id).maybeSingle(),
    supabase.from("experience_media").select("storage_path,alt_text,sort_order,is_cover").eq("experience_id",id).order("sort_order")
  ]);
  if(!item) notFound();
  const gallery=(photos??[]) as Photo[];
  return <>
    <section className="page-hero"><div className="kicker">Area privata · esperienza</div><h1>{item.name}</h1><p>Controlla la scheda completa e le fotografie prima di decidere se pubblicarla.</p><div className="actions"><Link className="button ghost" href="/admin/esperienze">← Torna alle esperienze</Link>{item.published&&<Link className="button" href={`/esperienze/${item.slug}`}>Apri scheda pubblica</Link>}</div></section>
    <section className="section"><div className="detail-panel">
      <div className="kicker">{item.operator?.name??"Operatore non indicato"} · {item.review_status??"—"}</div>
      <h2 style={{marginBottom:8}}>{item.name}</h2>
      <p><strong>Stato:</strong> {item.published?"Online":"Non pubblicata"} · <strong>Territorio:</strong> {item.territory?.name??"—"} · <strong>Categoria:</strong> {item.category?.name??"—"}</p>
      {item.excerpt&&<><h3>Testo breve</h3><p>{item.excerpt}</p></>}
      {item.description&&<><h3>Descrizione</h3><p style={{whiteSpace:"pre-wrap",lineHeight:1.65}}>{item.description}</p></>}
      {item.why_selected&&<><h3>Perché BIMARIS la seleziona</h3><p style={{whiteSpace:"pre-wrap"}}>{item.why_selected}</p></>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginTop:20}}>
        <div><strong>Durata</strong><p>{item.duration_minutes?`${item.duration_minutes} min`:"—"}</p></div><div><strong>Prezzo da</strong><p>{item.price_from!=null?`€ ${item.price_from}`:"—"}</p></div><div><strong>Punto di incontro</strong><p>{item.meeting_point??"—"}</p></div><div><strong>Prenotabile</strong><p>{item.bookable?"Sì":"No"}</p></div>
      </div>
    </div></section>
    <section className="section sand"><div className="section-head"><div><div className="kicker">Media</div><h2>Fotografie</h2></div><p>{gallery.length} {gallery.length===1?"fotografia":"fotografie"} associate alla scheda.</p></div>
      {gallery.length===0?<div className="detail-panel"><p style={{margin:0}}>Nessuna fotografia presente nella galleria dell'esperienza.</p></div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>{gallery.map(photo=><figure className="detail-panel" key={photo.storage_path} style={{margin:0,padding:12}}><img src={mediaUrl(photo.storage_path)} alt={photo.alt_text??item.name} style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:12}}/><figcaption style={{marginTop:8}}>{photo.is_cover?"★ Copertina":"Fotografia"} · posizione {photo.sort_order+1}</figcaption></figure>)}</div>}
    </section>
  </>;
}
