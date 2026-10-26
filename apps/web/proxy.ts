import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PRELAUNCH_PATHS = new Set([
  "/",
  "/operatori/interesse",
  "/privacy",
  "/cookie",
  "/note-legali",
]);

const PUBLIC_PRELAUNCH_API_PATHS = new Set([
  "/api/operator-interest",
]);

function isPrelaunchEnabled() {
  return process.env.VERCEL_ENV === "production" && process.env.BIMARIS_PRELAUNCH_MODE === "true";
}

export function proxy(request: NextRequest) {
  if (!isPrelaunchEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (PUBLIC_PRELAUNCH_PATHS.has(pathname) || PUBLIC_PRELAUNCH_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // During pre-launch, unknown/internal API routes must not be exposed as HTML redirects.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
};
