import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_SITE_URL = "https://www.bimarisnet.it";
const ALLOWED_HOSTS = new Set([
  "bimarisnet.it",
  "www.bimarisnet.it",
  "bimaris-platform.vercel.app",
  "bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app",
  "bimaris-platform-git-feat-publis-affef4-giovannibrunetto84-1508.vercel.app",
]);

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function publicUrl(path: string, requestUrl: URL) {
  // Keep the same host used to start OAuth so the freshly written Supabase
  // session cookie is immediately available on the destination page.
  // Falling back to the canonical public URL prevents redirects to unknown hosts.
  const origin = ALLOWED_HOSTS.has(requestUrl.hostname) ? requestUrl.origin : PUBLIC_SITE_URL;
  return new URL(path, origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Supabase can drop custom query parameters from the final PKCE callback.
  // Keep operator intent in the callback path as a fallback as well.
  const next = safePath(url.searchParams.get("next"));
  const operatorIntent = url.searchParams.get("operator") === "1";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(publicUrl("/accedi?errore=accesso", url));
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) return NextResponse.redirect(publicUrl("/accedi?errore=accesso", url));
    }
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) return NextResponse.redirect(publicUrl("/accedi?errore=accesso", url));

  if (operatorIntent) return NextResponse.redirect(publicUrl("/area-operatore", url));

  // A personal account that has never selected any interests has not completed
  // onboarding yet. Route it there before honoring the normal /profilo target.
  // Existing users keep going directly to their profile.
  if (!next || next === "/profilo") {
    const { count: interestCount } = await supabase
      .from("user_interests")
      .select("interest_key", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!interestCount) {
      return NextResponse.redirect(publicUrl("/profilo/onboarding", url));
    }
  }

  if (next) return NextResponse.redirect(publicUrl(next, url));

  const { data: membership } = await supabase
    .from("operator_memberships")
    .select("operator_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership) return NextResponse.redirect(publicUrl("/area-operatore", url));
  return NextResponse.redirect(publicUrl("/profilo", url));
}
