import { NextRequest, NextResponse } from "next/server";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export function proxy(request: NextRequest) {
  if (!isPrelaunchEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
};
