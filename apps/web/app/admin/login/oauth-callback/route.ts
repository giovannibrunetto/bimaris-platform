import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveAdminEnvironment } from "@/lib/admin-environment";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const login = new URL("/admin/login", url.origin);
  const code = url.searchParams.get("code");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const environment = resolveAdminEnvironment();
  if (!code || !key || !environment || !environment.origins.includes(url.origin)) {
    return NextResponse.redirect(login);
  }
  const response = NextResponse.redirect(new URL("/admin/mfa", url.origin));
  const supabase = createServerClient(environment.supabaseUrl, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items) {
        items.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(login);
  return response;
}
