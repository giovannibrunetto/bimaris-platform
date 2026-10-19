import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

const PUBLIC_SITE_URL = "https://www.bimarisnet.it";

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safePath(url.searchParams.get("next"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!tokenHash || !type || !supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/accedi?errore=accesso", PUBLIC_SITE_URL));
  }

  // Keep the auth cookies produced by verifyOtp and attach them explicitly to
  // the final redirect response. This is important for magic-link requests,
  // because the browser must receive the new session before /area-operatore
  // performs its server-side authentication check.
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return []; },
      setAll(values) { cookiesToSet.push(...(values as CookieToSet[])); },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL("/accedi?errore=link", PUBLIC_SITE_URL));
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) {
    return NextResponse.redirect(new URL("/accedi?errore=accesso", PUBLIC_SITE_URL));
  }

  let destination = next;
  if (!destination) {
    const { data: membership } = await supabase
      .from("operator_memberships")
      .select("operator_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    destination = membership ? "/area-operatore" : "/profilo";
  }

  const response = NextResponse.redirect(new URL(destination, PUBLIC_SITE_URL));
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }
  return response;
}
