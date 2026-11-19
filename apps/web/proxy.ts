import { NextRequest, NextResponse } from "next/server";
import { isPrelaunchEnabled, isIsolatedSurveyDeployment, isIsolatedSurveyRequested } from "@/lib/prelaunch-mode";

export function proxy(request: NextRequest) {
  // Fail closed: a dedicated second Vercel project exposes only these exact
  // survey paths. The main BIMARIS deployment retains its original behavior.
  if (isIsolatedSurveyRequested()) {
    if (!isIsolatedSurveyDeployment()) return new NextResponse("Service Unavailable", { status: 503, headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "Cache-Control": "no-store",
    } });
    const path = request.nextUrl.pathname.replace(/[/]$/, "") || "/";
    const pages = new Set(["/questionario-cittadini", "/privacy-questionario"]);
    const submission = path === "/questionario-cittadini/invio";
    const publicAsset = path === "/brand/bimaris-main.jpeg" || path.startsWith("/_next/static/");
    if (pages.has(path) || submission || publicAsset) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    return new NextResponse("Not Found", { status: 404, headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    } });
  }
  if ((request.nextUrl.pathname.replace(/\/$/, "") === "/questionario-cittadini"
    || request.nextUrl.pathname.startsWith("/questionario-cittadini/"))
    && process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404, headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store",
    } });
  }
  const { pathname } = request.nextUrl;
  if (!isPrelaunchEnabled()) {
    if (pathname === "/itinerari" || pathname.startsWith("/itinerari/")) {
      return NextResponse.redirect(new URL("/mappa/epoche", request.url));
    }
    return NextResponse.next();
  }

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
