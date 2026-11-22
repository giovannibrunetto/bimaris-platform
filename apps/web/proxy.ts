import { NextRequest, NextResponse } from "next/server";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export function proxy(request: NextRequest) {
  const surveyHost = request.headers.get("host")?.split(":")[0]?.toLowerCase() === "sondaggio.bimarisnet.it";
  if (surveyHost && (request.nextUrl.pathname === "/robots.txt" || request.nextUrl.pathname === "/sitemap.xml")) {
    return NextResponse.next();
  }
  // On the isolated survey host the page itself enforces the live collection gate.
  // Never expose the rest of the prelaunch application through this exception.
  if (surveyHost && request.nextUrl.pathname === "/questionario-cittadini") {
    return NextResponse.next();
  }
  if (surveyHost && request.nextUrl.pathname === "/privacy-questionario") {
    return NextResponse.next();
  }
  if ((request.nextUrl.pathname.replace(/\/$/, "") === "/questionario-cittadini"
    || request.nextUrl.pathname.startsWith("/questionario-cittadini/"))
    && process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404, headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store",
    } });
  }
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
