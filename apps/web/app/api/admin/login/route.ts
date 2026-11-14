import { NextResponse } from "next/server";

/**
 * DS-MFA-01/L-V34: retire the shared-password login on this isolated branch.
 * Supabase individual login is performed through /admin/login.
 * No legacy session can be issued through this endpoint.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "legacy_admin_login_disabled" },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
