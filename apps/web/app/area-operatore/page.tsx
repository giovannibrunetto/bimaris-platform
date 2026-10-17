import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Metric = { total:number; whatsapp:number; phone:number; directions:number; website:number; instagram:number; booking:number };

function textProperty(properties: Record<string, unknown> | null, key: string) {
  const value = properties?.[key];
  return typeof value === "string" ? value : null;
}

export default async function OperatorAreaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/accedi?next=/area-operatore");

  const { data: memberships } = await supabase
    .from("operator_memberships")
    .select("role,operator_id,operators(id,slug,name,category,published,selection_status)")
    .eq("user_id", user.id);

  const rows = memberships ?? [];
  const slugs = rows.map((row:any) => row.operators?.slug).filter(Boolean);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = slugs.length ? await supabase
    .from("analytics_events")
    .select("event_name,properties")
    .gte("created_at", since)
    .in("event_name", ["whatsapp_click","phone_click","directions_click","website_click","instagram_click","booking_click"])
    .limit(5000) : { data: [] };

  const metrics = new Map<string,Metric>(slugs.map((slug:string) => [slug,{total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0}]));
  for (const event of events ?? []) {
    const slug = textProperty(event.properties as Record<string,unknown> | null,"operator_id");
    const metric = slug ? metrics.get(slug) : undefined;
    if (!metric) continue;
    const action = textProperty(event.properties as Record<string,unknown> | null,"action_type") ?? ({whatsapp_click:"whatsapp",phone_click:"phone",directions_click:"directions",website_click:"website",instagram_click:"instagram",booking_click:"booking"} as Record<string,string>)[event.event_name];
    if (action && action in metric) (metric as unknown as Record<string,number>)[action]++;
    metric.total++;
  }

  return <>
    <section className="page-hero"><div className="kicker">Area riservata operatori</div><h1>La tua attività su BIMARIS</h1><p>Consulta la presenza della tua attività e le azioni generate dalla piattaforma negli ultimi 30 giorni.</p></section>
    <section className="section">
      {rows.length === 0 ? <div className="detail-panel"><h2>Nessuna attività collegata</h2><p>Il tuo account è attivo, ma non è ancora associato a un operatore BIMARIS. L'associazione viene effettuata da BIMARIS dopo la verifica dell'attività.</p></div> :
      <div style={{display:"grid",gap:24}}>{rows.map((row:any) => { const operator=row.operators; const metric=metrics.get(operator.slug) ?? {total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0}; return <article className="detail-panel" key={row.operator_id}><div className="eyebrow">{operator.category ?? "Operatore"} · {row.role}</div><h2>{operator.name}</h2><p>Stato: <strong>{operator.published ? "Online" : "Non pubblicato"}</strong></p><div className="dashboard" style={{marginTop:22}}><div className="metric">Azioni<strong>{metric.total}</strong></div><div className="metric">WhatsApp<strong>{metric.whatsapp}</strong></div><div className="metric">Prenotazioni<strong>{metric.booking}</strong></div><div className="metric">Indicazioni<strong>{metric.directions}</strong></div></div><div style={{overflowX:"auto",marginTop:22}}><table className="table"><thead><tr><th>Telefono</th><th>Sito</th><th>Instagram</th></tr></thead><tbody><tr><td>{metric.phone}</td><td>{metric.website}</td><td>{metric.instagram}</td></tr></tbody></table></div>{operator.published&&<p style={{marginTop:20}}><a className="text-link" href={`/operatori/${operator.slug}`}>Apri la scheda pubblica →</a></p>}</article>; })}</div>}
    </section>
  </>;
}
