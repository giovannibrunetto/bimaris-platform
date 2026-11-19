import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import AdminSectionHeader from "../AdminSectionHeader";
import "../eventi/admin-events.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperatorsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  if ((await searchParams).view === "pending") redirect("/admin/contenuti");

  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");
  const { data, error } = await db.from("operators").select("id,slug,name,category,published")
    .order("published", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw new Error("Impossibile caricare gli operatori");
  const operators = data ?? [];
  const online = operators.filter(operator => operator.published).length;

  return <div className="admin-events">
    <AdminSectionHeader
      title="Operatori"
      description="Consulta i profili degli operatori e accedi ai loro dossier."
      summary={<><span><strong>{online}</strong> online</span><span><strong>{operators.length - online}</strong> non pubblicati</span></>}
    />
    <section className="admin-events__body" aria-label="Schede operatori">
      <div className="admin-events__container admin-events__list">
        {operators.map(operator => {
          const dossier = `/admin/operatori/${operator.id}`;
          const category = operator.category?.trim();
          return <article key={operator.id} className="admin-events__card admin-events__card--compact">
            <div className="admin-events__card-main">
              <span className="admin-events__eyebrow">
                {category && category.toLowerCase() !== "esperienze" ? category : "Operatore"} · {operator.published ? "Online" : "Non pubblicato"}
              </span>
              <h3>{operator.name}</h3>
            </div>
            <div className="admin-operator-card-actions">
              <Link className="admin-events__examine" href={dossier}>Apri dossier →</Link>
              {operator.published && <Link className="text-link" href={`/operatori/${operator.slug}`} target="_blank" rel="noreferrer">Scheda pubblica ↗</Link>}
            </div>
          </article>;
        })}
        {operators.length === 0 && <p className="admin-events__empty">Nessun operatore presente.</p>}
      </div>
    </section>
  </div>;
}
