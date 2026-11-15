import { NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Navigation eligibility is NOT administrative authorization.
// An AAL1 Super Admin may see the link, but every protected admin page and
// mutation still requires the verified individual session and MFA AAL2.
export async function GET() {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  const hidden = () => NextResponse.json({ visible: false, verified: false }, { headers });

  // Fail closed when the Preview is not connected to the isolated Staging project.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://nzdeoimwikhoidtladnu.supabase.co") return hidden();
  const client = await createUserServerClient();
  if (!client) return hidden();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) return hidden();

  const service = createServiceClient();
  if (!service) return hidden();
  const { data: active, error: roleError } = await service.rpc("is_active_super_admin", {
    p_user_id: data.user.id,
  });
  if (roleError || active !== true) return hidden();

  const verified = await isAuthorizedAdmin();
  return NextResponse.json({ visible: true, verified }, { headers });
}
