import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, isAdminConfigured, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
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
