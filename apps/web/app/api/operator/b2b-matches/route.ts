import { NextRequest, NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";
import { scoreB2BMatch, type B2BProfile } from "@/lib/b2b";

export async function GET(req: NextRequest) {
  const operatorId = req.nextUrl.searchParams.get("operatorId");
  if (!operatorId) return NextResponse.json({ error: "operatorId mancante" }, { status: 400 });

  const userClient = await createUserServerClient();
  if (!userClient) return NextResponse.json({ error: "Supabase non configurato" }, { status: 500 });
  const { data: claimsData } = await userClient.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: membership } = await userClient.from("operator_memberships").select("operator_id").eq("operator_id", operatorId).eq("user_id", userId).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Operatore non autorizzato" }, { status: 403 });

  const { data: mine } = await userClient.from("operator_b2b_profiles").select("*").eq("operator_id", operatorId).maybeSingle();
  if (!mine?.enabled) return NextResponse.json({ matches: [], inactive: true });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 500 });

  const [{ data: profiles, error: profilesError }, { data: operators, error: operatorsError }] = await Promise.all([
    service.from("operator_b2b_profiles").select("*").eq("enabled", true).neq("operator_id", operatorId),
    service.from("operators").select("id,name,slug,category,territory_id,published,selection_status"),
  ]);
  if (profilesError || operatorsError) return NextResponse.json({ error: profilesError?.message ?? operatorsError?.message }, { status: 400 });

  const operatorMap = new Map((operators ?? []).map((o) => [o.id, o]));
  const myOperator = operatorMap.get(operatorId);
  const matches = (profiles ?? []).map((candidate) => {
    const op = operatorMap.get(candidate.operator_id);
    if (!op) return null;
    const result = scoreB2BMatch(mine as B2BProfile, candidate as B2BProfile, Boolean(myOperator?.territory_id && op.territory_id === myOperator.territory_id));
    if (!result || result.score < 55) return null;
    return {
      operator: { id: op.id, name: op.name, slug: op.slug, category: op.category },
      profile: candidate,
      ...result,
      level: result.score >= 85 ? "molto_forte" : result.score >= 70 ? "buono" : "potenziale",
    };
  }).filter(Boolean).sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));

  return NextResponse.json({ matches });
}
