import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The same server-side identity, MFA/AAL2 and active Super Admin gate used by /admin.
// This endpoint discloses only whether the navigation link may be shown.
export async function GET() {
  try {
    const authorized = await isAuthorizedAdmin();
    return NextResponse.json({ authorized }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ authorized: false }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }
}
