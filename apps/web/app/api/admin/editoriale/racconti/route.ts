import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-request-origin";
import { createServiceClient } from "@/lib/supabase/server";

const base = "/admin/archivio-editoriale/racconti";
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const paragraphs = (value: string) => value.split(/\r?\n(?:[ \t]*\r?\n)*/).map(line => line.trim()).filter(Boolean);

export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteAdminMutation(request);
  if (rejected) return rejected;
  const admin = await getVerifiedSuperAdmin();
  if (!admin) return new NextResponse(null, { status: 403 });
  const db = createServiceClient();
  if (!db) return new NextResponse(null, { status: 503 });
  const form = await request.formData();
  const field = (key: string) => String(form.get(key) ?? "").trim();
  const action = field("action");
  const workspace = field("workspace");
  const entry = field("entry");
  const version = Number(form.get("version"));
  const redirect = (id: string, notice: string) => {
    const url = new URL(base, request.url);
    if (uuid.test(id)) url.searchParams.set("id", id);
    url.searchParams.set("esito", notice);
    if (action !== "create") url.hash = action === "save" ? "historical-save" : "historical-publication";
    return NextResponse.redirect(url, 303);
  };
  if (!["create", "save", "publish", "withdraw", "archive"].includes(action) || (entry && !uuid.test(entry)) ||
    (action !== "create" && (!uuid.test(workspace) || !/^\d+$/.test(field("version")) || !Number.isSafeInteger(version) || version > 2147483647))) {
    return redirect(workspace, "dati");
  }

  let payload: Record<string, unknown> = {};
  if (action === "save") {
    const limits = { chapterTitle: 220, chapterBody: 12000, chapterSlug: 180, chapterPlaceTitle: 220, chapterTransition: 12000 };
    const columns = Object.entries(limits).map(([key, limit]) => form.getAll(key).map(value => String(value).trim().slice(0, limit)));
    const [titles, bodies, slugs, labels, transitions] = columns;
    if (titles.length > 30 || columns.some(column => column.length !== titles.length) ||
      slugs.some(slug => slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) return redirect(workspace, "dati");
    payload = {
      title: field("title").slice(0, 180), subtitle: field("subtitle").slice(0, 400), theme: field("theme").slice(0, 160),
      intro: paragraphs(field("intro").slice(0, 20000)), conclusion: paragraphs(field("conclusion").slice(0, 20000)),
      chapters: titles.map((title, index) => ({
        number: index + 1, title, placeTitle: labels[index], slug: slugs[index] || undefined,
        paragraphs: paragraphs(bodies[index]), transition: paragraphs(transitions[index]),
      })),
    };
  }
  if (action === "publish") {
    const { data } = await db.from("editorial_workspaces").select("draft").eq("model", "historical").eq("id", workspace).maybeSingle();
    if (!data) return redirect(workspace, "errore");
    const name = String(data.draft.title ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").slice(0, 90).replace(/^-|-$/g, "");
    payload = { slug: `${name || "racconto"}-${workspace.slice(0, 8)}` };
  }
  const { data, error } = await db.rpc("manage_historical_editorial", {
    p_action: action, p_actor: admin.userId, p_workspace: workspace || null,
    p_entry: entry || null, p_version: version, p_data: payload,
  });
  if (error) {
    const known: Record<string, string> = {
      "editorial-conflict": "conflitto", "editorial-fields-required": "campi",
      "editorial-protected": "protetto", "editorial-invalid-culture-link": "luogo",
    };
    console.error("Historical editorial operation failed", error.code, error.message);
    return redirect(workspace, known[error.message] ?? "errore");
  }
  return redirect(String(data), action);
}
