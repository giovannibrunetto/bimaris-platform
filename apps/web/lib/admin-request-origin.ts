import "server-only";
import { NextResponse } from "next/server";

/**
 * V34-SEC-01: reject cross-site administrative mutations before any privileged work.
 * An Origin must match the request origin. If Origin is absent, only an explicit
 * same-origin Fetch Metadata signal is accepted; ambiguous requests fail closed.
 */
export function rejectCrossSiteAdminMutation(request: Request): NextResponse | null {
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
