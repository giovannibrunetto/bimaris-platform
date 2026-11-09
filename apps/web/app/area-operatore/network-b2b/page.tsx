import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import B2BNetwork from "./B2BNetwork";
import "../operator-area.css";

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

  return <><section className="page-hero operator-calendar-hero operator-b2b-hero" style={{paddingTop:"clamp(18px,2.5vw,28px)",paddingBottom:"clamp(18px,2.5vw,28px)"}}><div className="operator-workspace-hero__inner"><div className="kicker">Area Operatore · Network B2B</div><h1 style={{margin:"6px 0 6px",color:"#fff",fontSize:"clamp(34px,4vw,52px)"}}>Trova operatori compatibili <span>con {operator.name}</span></h1><p style={{maxWidth:760,margin:0,color:"rgba(255,255,255,.88)"}}>Indica cosa offri e cosa cerchi. BIMARIS individua opportunità di collaborazione tra gli operatori aderenti.</p></div></section><section className="b2b-page"><div className="b2b-page__container"><B2BNetwork operatorId={row.operator_id} operatorName={operator.name} canManage={["owner","manager"].includes(row.role)}/></div></section></>;
}
