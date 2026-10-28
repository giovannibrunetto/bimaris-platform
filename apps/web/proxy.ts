import { NextRequest, NextResponse } from "next/server";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export function proxy(request: NextRequest) {
  if (!isPrelaunchEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // The minimal public mode intentionally exposes only the root document and
  // Next.js build assets required to render it. Application-owned public files
  // (images, maps, brand assets, etc.) remain unreachable by direct URL.
  if (pathname === "/") {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    return response;
  }

  if (pathname.startsWith("/_next/static/") || pathname.startsWith("/_next/image/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "not_found" }, { status: 404 });
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
