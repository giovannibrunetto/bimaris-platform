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

function isAllowedHost(hostname: string) {
  if (ALLOWED_HOSTS.has(hostname)) return true;

  // Vercel creates a new immutable hostname for every preview deployment.
  // Accept only preview hosts belonging to this BIMARIS project/account so the
  // callback stays on the deployment that initiated auth without opening the
  // redirect to arbitrary hosts.
  return /^bimaris-platform-[a-z0-9-]+-giovannibrunetto84-1508\.vercel\.app$/i.test(hostname);
}

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function publicUrl(path: string, requestUrl: URL) {
  const origin = isAllowedHost(requestUrl.hostname) ? requestUrl.origin : PUBLIC_SITE_URL;
  return new URL(path, origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
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

  // The selected entry point defines the application context. The same identity
  // may be both a personal BIMARIS user and an operator without either role
  // hijacking the other. Operator context still requires a real membership.
  if (operatorIntent) {
    const { data: membership } = await supabase
      .from("operator_memberships")
      .select("operator_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!membership) return NextResponse.redirect(publicUrl("/accedi?errore=operatore", url));
    return NextResponse.redirect(publicUrl("/area-operatore", url));
  }

  // Personal login never switches to operator context merely because this user
  // also manages one or more operators.
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
  return NextResponse.redirect(publicUrl("/profilo", url));
}
