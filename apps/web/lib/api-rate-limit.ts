import "server-only";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type Scope = "admin_login" | "contact" | "operator_application" | "operator_interest";
const limits: Record<Scope, [number, number]> = {
  admin_login: [10, 15 * 60],
  contact: [5, 60 * 60],
  operator_application: [3, 60 * 60],
  operator_interest: [3, 60 * 60],
};

export async function checkApiRateLimit(request: NextRequest, scope: Scope): Promise<"allow" | "limited" | "unavailable"> {
  const db = createServiceClient();
  // Migration stage: prefer an independent secret. Legacy fallback is temporary and
  // MUST be removed only after staging/preview has the dedicated secret configured
  // and all rate-limit regression tests have passed.
  const secret = process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET || process.env.BIMARIS_ADMIN_PASSWORD;
  if (!db || !secret) return "unavailable";
  const ip = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip"))?.split(",")[0]?.trim();
  if (!ip) return "unavailable";
  const actor = createHmac("sha256", secret).update(ip).digest("hex");
  const [max, seconds] = limits[scope];
  const { data, error } = await db.rpc("consume_api_rate_limit", {
    p_scope: scope, p_actor_hash: actor, p_max_attempts: max, p_window_seconds: seconds,
  });
  if (error || typeof data !== "boolean") return "unavailable";
  return data ? "allow" : "limited";
}
