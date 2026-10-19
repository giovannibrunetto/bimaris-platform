import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

const PUBLIC_SITE_URL = "https://www.bimarisnet.it";

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

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

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
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

  if (next) {
    return NextResponse.redirect(new URL(next, PUBLIC_SITE_URL));
  }

  const { data: membership } = await supabase
    .from("operator_memberships")
    .select("operator_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return NextResponse.redirect(new URL(membership ? "/area-operatore" : "/profilo", PUBLIC_SITE_URL));
}
