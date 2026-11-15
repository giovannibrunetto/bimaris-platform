import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// This endpoint is only a navigation hint. Every admin page and mutation
// independently enforces the verified individual Super Admin + AAL2 guard.
export async function GET() {
  const allowed = await isAuthorizedAdmin();
  return NextResponse.json(
    { allowed },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
