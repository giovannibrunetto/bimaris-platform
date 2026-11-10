import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const destination = new URL("/admin/password-setup", url.origin);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://nzdeoimwikhoidtladnu.supabase.co") {
    destination.searchParams.set("error", "unavailable");
    return NextResponse.redirect(destination);
  }
  if (!code && !(tokenHash && type === "recovery")) {
    destination.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(destination);
  }

  const response = NextResponse.redirect(destination);
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items) {
        items.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });
  const result = tokenHash && type === "recovery"
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
    : await supabase.auth.exchangeCodeForSession(code!);
  if (result.error) {
    // Do not redirect using the cookie-bearing response if verification failed.
    const failed = new URL("/admin/password-setup", url.origin);
    failed.searchParams.set("error", "expired");
    return NextResponse.redirect(failed);
  }
  destination.searchParams.set("recovery", "verified");
  return response;
}
