import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import B2BNetwork from "./B2BNetwork";
import "../operator-area.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operator = { id: string; name: string };
type Membership = { role: string; operator_id: string; operators: Operator | Operator[] | null };
function one(v: Operator | Operator[] | null) { return Array.isArray(v) ? v[0] ?? null : v; }

export default async function B2BPage() {
  const supabase = await createUserServerClient();
  if (!supabase) redirect("/accedi");
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect("/accedi");

  const { data } = await supabase.from("operator_memberships").select("role,operator_id,operators(id,name)").eq("user_id", userId).limit(1);
  const row = ((data ?? [])[0] ?? null) as Membership | null;
  const operator = row ? one(row.operators) : null;
  if (!row || !operator) redirect("/area-operatore");

  return <section style={{background:"var(--sand)",padding:"clamp(34px,6vw,70px) 20px",minHeight:"70vh"}}><div className="container" style={{maxWidth:1120}}><div style={{marginBottom:22}}><a href="/area-operatore">← Torna all'area operatore</a></div><B2BNetwork operatorId={row.operator_id} operatorName={operator.name} canManage={["owner","manager"].includes(row.role)}/></div></section>;
}
