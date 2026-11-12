import "server-only";
import { NextResponse } from "next/server";

/**
 * Fail closed on cross-site operator mutations. Mirrors the existing
 * administrative origin policy without changing administrative endpoints.
 */
export function rejectCrossSiteOperatorMutation(request: Request): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ ok: false, error: "invalid_site" }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (!origin && site !== "same-origin") {
    return NextResponse.json({ ok: false, error: "missing_origin" }, { status: 403 });
  }
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
    }
  }
  return null;
}
