import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missing = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return missing();
  const preview = request.nextUrl.searchParams.get("anteprima") === "1";
  if (preview) {
    if (!(await getVerifiedSuperAdmin())) return missing();
  } else {
    const { data, error } = await createPublicClient()?.from("culture_images").select("id").eq("id", id).eq("image_url", `/api/editoriale/immagini/${id}`).maybeSingle() ?? {};
    if (error || !data) return missing();
  }
  const { data, error } = await createServiceClient()?.storage.from("editorial-media").download(id) ?? {};
  if (error || !data) return missing();
  return new NextResponse(data, { headers: {
    "Content-Type": data.type || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
