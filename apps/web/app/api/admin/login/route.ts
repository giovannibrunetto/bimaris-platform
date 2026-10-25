import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, isAdminConfigured, verifyAdminPassword, verifyAdminTotp, isAdminTotpEnabled } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
    }
  }
  const rateLimit = await checkApiRateLimit(request, "admin_login");
  if (rateLimit === "limited") return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": "900" } });
  if (rateLimit === "unavailable") return NextResponse.json({ ok: false, error: "rate_limit_unavailable" }, { status: 503 });
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const otp = String(form.get("otp") ?? "").trim();

  if (!isAdminConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=not-configured", request.url), 303);
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  if (isAdminTotpEnabled() && !verifyAdminTotp(otp)) {
    return NextResponse.redirect(new URL("/admin/login?error=otp", request.url), 303);
  }

  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
