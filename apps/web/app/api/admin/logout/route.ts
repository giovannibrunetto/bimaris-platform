import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";
import { createUserServerClient } from "@/lib/supabase/user-server";

/**
 * DS-MFA-01/C transitional logout: clear the legacy admin cookie and
 * invalidate the individual Supabase Auth session when one exists.
 * No personal accounts are provisioned here; legacy login remains enabled.
 */
export async function POST(request: NextRequest) {
  // Always clear the legacy cookie, including when the individual Auth
  // session is absent or Supabase is temporarily unavailable.
  await clearAdminSession();

  const userClient = await createUserServerClient();
  if (userClient) {
    // Server-side signOut revokes the current refresh token; existing JWTs
    // can remain valid until expiry. Do not claim immediate global revocation.
    const { error } = await userClient.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Admin individual logout failed");
      return NextResponse.json({ ok: false, error: "individual_logout_failed" }, { status: 503 });
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
