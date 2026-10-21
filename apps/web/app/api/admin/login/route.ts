import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, isAdminConfigured, verifyAdminPassword } from "@/lib/admin-auth";

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
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!isAdminConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=not-configured", request.url), 303);
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
