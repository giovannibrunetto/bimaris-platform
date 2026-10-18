import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_SITE_URL = "https://www.bimarisnet.it";

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function publicUrl(path: string) {
  return new URL(path, PUBLIC_SITE_URL);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safePath(url.searchParams.get("next"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(publicUrl("/accedi?errore=accesso"));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  // A PKCE magic link/invite normally arrives with a code. Exchange it once
  // and persist the resulting session in the response cookies.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // If the browser already owns a valid session (for example after a
      // repeated redirect), do not turn a successful login into an error.
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) return NextResponse.redirect(publicUrl("/accedi?errore=accesso"));
    }
  }

  // Supabase invite links can also complete auth before reaching this route.
  // In that case there is no code left to exchange, but the session cookie is
  // already present and must be honoured.
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) return NextResponse.redirect(publicUrl("/accedi?errore=accesso"));

  if (next) return NextResponse.redirect(publicUrl(next));

  const { data: membership } = await supabase
    .from("operator_memberships")
    .select("operator_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership) return NextResponse.redirect(publicUrl("/area-operatore"));
  return NextResponse.redirect(publicUrl("/profilo"));
}
