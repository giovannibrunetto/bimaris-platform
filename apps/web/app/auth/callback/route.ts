import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/profilo";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profilo";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && supabaseUrl && supabaseKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Preserve explicit destinations, but make the default BIMARIS login role-aware.
      // Operator memberships are protected by RLS, so this only detects memberships
      // belonging to the authenticated user.
      if (safeNext === "/profilo") {
        const { data: membership } = await supabase
          .from("operator_memberships")
          .select("operator_id")
          .limit(1)
          .maybeSingle();
        if (membership) return NextResponse.redirect(new URL("/area-operatore", url.origin));
      }
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/accedi?errore=accesso", url.origin));
}
