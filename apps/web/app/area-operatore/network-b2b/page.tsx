import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import B2BNetwork from "./B2BNetwork";
import OperatorWorkspaceSwitcher from "../OperatorWorkspaceSwitcher";
import "../operator-area.css";
import "../operator-subpages.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operator = { id: string; name: string; slug: string };
type Membership = { role: string; operator_id: string; operators: Operator | Operator[] | null };
function one(v: Operator | Operator[] | null) { return Array.isArray(v) ? v[0] ?? null : v; }

export default async function B2BPage({searchParams}:{searchParams:Promise<{operatore?:string}>}) {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect("/accedi");

  const { data } = await supabase.from("operator_memberships").select("role,operator_id,operators(id,name,slug)").eq("user_id", userId);
  const rows = (data ?? []) as Membership[];
  const params = await searchParams;
  const requested = params.operatore;
  const row = requested ? rows.find(r => r.operator_id === requested || one(r.operators)?.slug === requested) ?? null : rows[0] ?? null;
  const operator = row ? one(row.operators) : null;
  if (!row || !operator) redirect(requested ? `/area-operatore?operatore=${encodeURIComponent(requested)}` : "/area-operatore");

  const activities = rows.flatMap(r => {
    const item = one(r.operators);
    return item ? [{ id: r.operator_id, slug: item.slug, name: item.name }] : [];
  });
  return <main className="operator-subpage operator-subpage--b2b"><div className="operator-subpage__shell">
      <header className="operator-subpage__heading"><div className="eyebrow">Area Operatore · Network B2B</div><h1>La tua rete professionale</h1><p>Presenta ciò che offri e trova opportunità di collaborazione con altri operatori BIMARIS.</p></header>
      <OperatorWorkspaceSwitcher activities={activities} selectedSlug={operator.slug}/>
      <B2BNetwork operatorId={row.operator_id} operatorName={operator.name} canManage={["owner","manager"].includes(row.role)}/>
    </div></main>;
}
