import { NextRequest, NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";

async function getContext(operatorId: string) {
  const supabase = await createUserServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase non configurato" }, { status: 500 }) };
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) return { error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  const { data: membership } = await supabase.from("operator_memberships").select("role").eq("operator_id", operatorId).eq("user_id", userId).maybeSingle();
  if (!membership) return { error: NextResponse.json({ error: "Operatore non autorizzato" }, { status: 403 }) };
  return { supabase, role: membership.role as string };
}

export async function GET(req: NextRequest) {
  const operatorId = req.nextUrl.searchParams.get("operatorId");
  if (!operatorId) return NextResponse.json({ error: "operatorId mancante" }, { status: 400 });
  const ctx = await getContext(operatorId);
  if ("error" in ctx) return ctx.error;
  const { data, error } = await ctx.supabase.from("operator_b2b_profiles").select("*").eq("operator_id", operatorId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data ?? null, canManage: ["owner", "manager"].includes(ctx.role) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const operatorId = typeof body?.operator_id === "string" ? body.operator_id : null;
  if (!operatorId) return NextResponse.json({ error: "operator_id mancante" }, { status: 400 });
  const ctx = await getContext(operatorId);
  if ("error" in ctx) return ctx.error;
  if (!["owner", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Permesso insufficiente" }, { status: 403 });

  const arr = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").slice(0, 30) : [];
  const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 1200) || null : null;
  const payload = {
    operator_id: operatorId,
    enabled: body?.enabled === true,
    offer_tags: arr(body?.offer_tags),
    seek_tags: arr(body?.seek_tags),
    collaboration_types: arr(body?.collaboration_types),
    customer_segments: arr(body?.customer_segments),
    languages: arr(body?.languages),
    areas: arr(body?.areas),
    availability_modes: arr(body?.availability_modes),
    offer_summary: text(body?.offer_summary),
    seek_summary: text(body?.seek_summary),
    conditions_notes: text(body?.conditions_notes),
    updated_at: new Date().toISOString(),
  };

  if (payload.enabled && (!payload.offer_tags.length || !payload.seek_tags.length || !payload.collaboration_types.length)) {
    return NextResponse.json({ error: "Per attivare il Network B2B indica almeno cosa offri, cosa cerchi e il tipo di collaborazione." }, { status: 400 });
  }

  const { data, error } = await ctx.supabase.from("operator_b2b_profiles").upsert(payload, { onConflict: "operator_id" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
