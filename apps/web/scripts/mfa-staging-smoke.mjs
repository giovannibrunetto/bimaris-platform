/**
 * DS-MFA-01/C: build-time, read-only staging credential smoke test.
 * Runs only for the approved feature branch in Vercel Preview.
 * No HTTP endpoint, account creation, data mutation, or secret logging.
 */
const branch = process.env.VERCEL_GIT_COMMIT_REF;
if (process.env.VERCEL_ENV === "preview" && branch === "feature/admin-individual-mfa") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const expectedHost = "nzdeoimwikhoidtladnu.supabase.co";
  if (!url || !key || new URL(url).hostname !== expectedHost) {
    throw new Error("DS-MFA staging smoke: missing or non-staging configuration");
  }
  const response = await fetch(new URL("/rest/v1/rpc/is_active_super_admin_session", url), {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_user_id: "00000000-0000-0000-0000-000000000000", p_session_id: "00000000-0000-0000-0000-000000000000" }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error(`DS-MFA staging smoke: service RPC HTTP ${response.status}`);
  }
  const result = await response.json();
  if (result !== false) {
    throw new Error("DS-MFA staging smoke: unknown user was not denied");
  }
  console.log("DS-MFA staging smoke: PASS (session-aware service RPC reachable; unknown session denied)");
}
