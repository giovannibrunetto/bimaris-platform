import { NextRequest, NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { B2B_TAGS, COLLABORATION_TYPES, CUSTOMER_SEGMENTS, LANGUAGES, AVAILABILITY_MODES } from "@/lib/b2b";

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

const allowedValues = (items: readonly (readonly [string, string])[]) => new Set(items.map(([value]) => value));
const B2B_TAG_VALUES = allowedValues(B2B_TAGS);
const COLLABORATION_TYPE_VALUES = allowedValues(COLLABORATION_TYPES);
const CUSTOMER_SEGMENT_VALUES = allowedValues(CUSTOMER_SEGMENTS);
const LANGUAGE_VALUES = allowedValues(LANGUAGES);
const AVAILABILITY_MODE_VALUES = allowedValues(AVAILABILITY_MODES);

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

  const arr = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 30) : [];
  const taxonomyArr = (value: unknown, allowed: ReadonlySet<string>) => {
    const values = arr(value);
    return { values, valid: values.every((item) => allowed.has(item)) };
  };
  const offerTags = taxonomyArr(body?.offer_tags, B2B_TAG_VALUES);
  const seekTags = taxonomyArr(body?.seek_tags, B2B_TAG_VALUES);
  const collaborationTypes = taxonomyArr(body?.collaboration_types, COLLABORATION_TYPE_VALUES);
  const customerSegments = taxonomyArr(body?.customer_segments, CUSTOMER_SEGMENT_VALUES);
  const languages = taxonomyArr(body?.languages, LANGUAGE_VALUES);
  const availabilityModes = taxonomyArr(body?.availability_modes, AVAILABILITY_MODE_VALUES);
  if (![offerTags, seekTags, collaborationTypes, customerSegments, languages, availabilityModes].every((field) => field.valid)) {
    return NextResponse.json({ error: "Il profilo B2B contiene valori non riconosciuti." }, { status: 400 });
  }

  const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 1200) || null : null;
  const payload = {
    operator_id: operatorId,
    enabled: body?.enabled === true,
    offer_tags: offerTags.values,
    seek_tags: seekTags.values,
    collaboration_types: collaborationTypes.values,
    customer_segments: customerSegments.values,
    languages: languages.values,
    areas: arr(body?.areas),
    availability_modes: availabilityModes.values,
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
