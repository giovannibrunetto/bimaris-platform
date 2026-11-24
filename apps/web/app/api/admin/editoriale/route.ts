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
  const section = value("sezione", 12);
  const model = section === "legend" || section === "village" ? section : "culture";
  const action = value("action", 16);
  const workspace = value("workspace", 36);
  const entry = value("entry", 36);
  const version = Number(form.get("version"));
  const redirect = (id: string, state: string) => {
    const url = new URL(base, request.url);
    if (model !== "culture") url.searchParams.set("sezione", model);
    if (uuid.test(id)) url.searchParams.set("id", id);
    url.searchParams.set("esito", state);
    if (state === "delete") url.searchParams.set("stato", "Archiviata");
    if (action === "save" && uuid.test(id)) {
      url.searchParams.set("salvataggio", "1");
      url.hash = "editorial-save";
    }
    if (action === "photo" && uuid.test(id)) {
      url.searchParams.set("fotografia", "1");
      url.hash = "editorial-photos";
    }
    if ((action === "publish" || action === "withdraw") && uuid.test(id)) {
      url.searchParams.set("pubblicazione", "1");
      url.hash = "editorial-publication";
    }
    return NextResponse.redirect(url, 303);
  };
  if (!["create","save","photo","publish","withdraw","archive","delete"].includes(action)
    || (action !== "create" && (!uuid.test(workspace) || !Number.isSafeInteger(version) || version < 0))
    || (entry && !uuid.test(entry))) return redirect(workspace, "dati");
  let payload: Record<string, unknown> = {};
  let uploaded: string | null = null;
  if (action === "save") {
    if (form.get("sourcesEdited") === "1") {
      const columns = ["sourceLabel", "sourceLink", "sourceType", "sourceNote"].map(field => form.getAll(field).map(item => String(item).trim()));
      const [labels, urls, types, notes] = columns;
      if (labels.length > 24 || columns.some(column => column.length !== labels.length)) return redirect(workspace, "fonti");
      const sources = labels.map((label, index) => ({ label, url: urls[index], source_type: types[index], note: notes[index] }));
      for (const source of sources) {
        if (!source.label || source.label.length > 400 || source.url.length > 1000 || source.note.length > 1200) return redirect(workspace, "fonti");
        if (!source.url) continue;
        try {
          if (!["https:", "http:"].includes(new URL(source.url).protocol)) return redirect(workspace, "fonti");
        } catch {
          return redirect(workspace, "fonti");
        }
      }
      payload.sources = sources;
    }
    const category = value("category", 16);
    if (model === "legend" && category && category !== "Mito" && category !== "Leggenda") return redirect(workspace, "dati");
    const lat = value("latitude", 32).replace(",", ".");
    const lng = value("longitude", 32).replace(",", ".");
    const latitude = lat ? Number(lat) : null;
    const longitude = lng ? Number(lng) : null;
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
    if ((lat || lng) && (!decimal.test(lat) || !decimal.test(lng) || latitude === null || longitude === null
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) return redirect(workspace, "mappa");
    payload = {
      ...payload,
      title: value("title", 180),
      body: value("body", 40000),
      ...(model !== "culture" ? {
        excerpt: value("excerpt", 400), history: value("history", 40000),
        identity: value("identity", 40000), thingsToSee: value("thingsToSee", 40000),
      } : {}),
      ...(model === "legend" && category ? { category } : {}),
      location: { address: value("locationAddress", 250), placeId: value("locationPlaceId", 250), latitude, longitude },
    };
  }
  if (action === "publish") {
    const { data } = await db.from("editorial_workspaces").select("draft").eq("id", workspace).eq("model", model).maybeSingle();
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
  const { data, error } = action === "publish"
    ? await db.rpc("publish_editorial_with_sources", { p_model: model, p_actor: admin.userId, p_workspace: workspace, p_version: version, p_data: payload })
    : await db.rpc(model === "culture" ? "manage_culture_editorial" : "manage_other_editorial", {
    ...(model === "culture" ? {} : { p_model: model }),
    p_action: action, p_actor: admin.userId, p_workspace: workspace || null, p_entry: entry || null, p_version: version, p_data: payload,
  });
  if (error) {
    if (uploaded) await db.storage.from("editorial-media").remove([uploaded]);
    console.error("Editorial operation failed", error.code, error.message);
    return redirect(workspace, error.message.includes("invalid-sources") ? "fonti" : error.message.includes("photo-limit") ? "fotolimite" : error.message.includes("conflict") ? "conflitto" : error.message.includes("fields-required") ? "campi" : "errore");
  }
  return redirect(action === "delete" ? "" : String(data), action);
}
