import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/in-arrivo", "/operatori/candidatura", "/admin", "/auth"];
const PUBLIC_API_PATHS = ["/api/operator-applications", "/api/admin", "/api/auth"];
const allowed = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production" || process.env.BIMARIS_PRELAUNCH_MODE !== "true") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/_next/") || path.startsWith("/brand/") ||
      path.startsWith("/images/") || path.startsWith("/icons/") ||
      path.startsWith("/fonts/") || path === "/favicon.ico") {
    return NextResponse.next();
  }
  if (path.startsWith("/api/")) {
    if (PUBLIC_API_PATHS.some(prefix => allowed(path, prefix))) return NextResponse.next();
    return NextResponse.json({ error: "unavailable_during_prelaunch" }, { status: 404 });
  }
  if (PUBLIC_PATHS.some(prefix => allowed(path, prefix))) return NextResponse.next();
  return NextResponse.redirect(new URL("/in-arrivo", request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
