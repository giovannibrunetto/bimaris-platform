import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-request-origin";
import { createServiceClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const base = "/admin/archivio-editoriale";

function imageMime(bytes: Uint8Array) {
  const data = Buffer.from(bytes);
  if (data.subarray(0, 3).equals(Buffer.from([255,216,255]))) return "image/jpeg";
  if (data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteAdminMutation(request);
  if (rejected) return rejected;
  const admin = await getVerifiedSuperAdmin();
  if (!admin) return new NextResponse(null, { status: 403 });
  const db = createServiceClient();
  if (!db) return new NextResponse(null, { status: 503 });
  const form = await request.formData();
  const value = (field: string, limit: number) => String(form.get(field) ?? "").trim().slice(0, limit);
  const action = value("action", 16);
  const workspace = value("workspace", 36);
  const entry = value("entry", 36);
  const version = Number(form.get("version"));
  const redirect = (id: string, state: string) => {
    const url = new URL(base, request.url);
    if (uuid.test(id)) url.searchParams.set("id", id);
    url.searchParams.set("esito", state);
    return NextResponse.redirect(url, 303);
  };
  if (!["create","save","photo","publish","withdraw","archive"].includes(action)
    || (action !== "create" && (!uuid.test(workspace) || !Number.isSafeInteger(version) || version < 0))
    || (entry && !uuid.test(entry))) return redirect(workspace, "dati");
  let payload: Record<string, string | { name: string; address: string } | null> = {};
  let uploaded: string | null = null;
  if (action === "save") {
    const placeId = value("place", 36);
    const newPlace = placeId === "new"
      ? { name: value("newPlaceName", 180), address: value("newPlaceAddress", 300) }
      : null;
    if (newPlace ? !newPlace.name : placeId && !uuid.test(placeId)) return redirect(workspace, "dati");
    payload = { title: value("title", 180), body: value("body", 40000), placeId: newPlace ? "" : placeId, newPlace };
  }
  if (action === "publish") {
    const { data } = await db.from("editorial_workspaces").select("draft").eq("id", workspace).eq("model", "culture").maybeSingle();
    if (!data) return redirect(workspace, "errore");
    const slug = String(data.draft.title ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
    payload = { slug: `${slug || "cultura"}-${workspace.slice(0,8)}` };
  }
  if (action === "photo") {
    const file = form.get("photo");
    const alt = value("alt", 250);
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024 || !alt) return redirect(workspace, "foto");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = imageMime(bytes);
    if (!type || type !== file.type) return redirect(workspace, "foto");
    const source = value("source", 500);
    const licenseUrl = value("licenseUrl", 500);
    if ([source, licenseUrl].some(url => { if (!url) return false; try { return !["http:", "https:"].includes(new URL(url).protocol); } catch { return true; } })) return redirect(workspace, "dati");
    uploaded = randomUUID();
    const { error } = await db.storage.from("editorial-media").upload(uploaded, bytes, { contentType: type });
    if (error) return redirect(workspace, "errore");
    payload = { id: uploaded, alt, author: value("author", 180), license: value("license", 180), source, licenseUrl };
  }
  const { data, error } = await db.rpc("manage_culture_editorial", {
    p_action: action, p_actor: admin.userId, p_workspace: workspace || null, p_entry: entry || null, p_version: version, p_data: payload,
  });
  if (error) {
    console.error("Editorial operation failed", error.code, error.message);
    return redirect(workspace, error.message.includes("conflict") ? "conflitto" : error.message.includes("fields-required") ? "campi" : "errore");
  }
  return redirect(String(data), action);
}
