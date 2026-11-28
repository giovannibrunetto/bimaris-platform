import { editorialRoutes } from "@/lib/editorial-routes";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-request-origin";
import { discardRejectedEditorialUpload, editorialSaveDigest, editorialSources, readEditorialCover } from "@/lib/editorial-draft-input";
import { createServiceClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const base = editorialRoutes.catalog.page;

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
  const requestId = form.get("saveRequest");
  const saveRequest = typeof requestId === "string" && uuid.test(requestId) ? requestId : null;
  const redirect = (id: string, state: string, savedVersion?: number) => {
    const url = new URL(base, request.url);
    if (model !== "culture") url.searchParams.set("sezione", model);
    if (savedVersion !== undefined) url.searchParams.set("versione", String(savedVersion));
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
    if (request.headers.get("accept")?.includes("application/json")) {
      const ok = state === action;
      return NextResponse.json({ ok, state, ...(ok ? { redirect: url.pathname + url.search + url.hash } : {}) }, { status: ok ? 200 : state === "conflitto" ? 409 : 422, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.redirect(url, 303);
  };
  if (!["create","save","photo","publish","withdraw","archive","delete"].includes(action)
    || (action !== "create" && (!uuid.test(workspace) || !/^\d+$/.test(value("version", 16)) || !Number.isSafeInteger(version) || version > 2147483647))
    || (entry && !uuid.test(entry))) return redirect(workspace, "dati");
  let payload: Record<string, unknown> = {};
  if (action === "save") {
    const sources = editorialSources(form);
    if (!sources) return redirect(workspace, "fonti");
    payload = sources;
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
  const saveDigest = action === "save" && saveRequest ? await editorialSaveDigest(form) : null;
  const media = action === "photo" || action === "save"
    ? await readEditorialCover(db, form, model, workspace, action === "photo") : {};
  if ("error" in media) return redirect(workspace, media.error);
  if (media.cover) {
    const gallery = model === "culture" && media.uploaded && form.get("photoPlacement") === "gallery";
    payload = action === "photo" ? media.cover : { ...payload, [gallery ? "galleryPhoto" : "cover"]: media.cover };
  }
  const { data, error } = action === "save"
    ? await db.rpc("save_editorial_draft", {
      p_model: model, p_actor: admin.userId, p_workspace: workspace, p_version: version,
      p_request: saveRequest, p_digest: saveDigest, p_data: payload,
    })
    : action === "publish"
    ? await db.rpc("publish_editorial_with_sources", { p_model: model, p_actor: admin.userId, p_workspace: workspace, p_version: version, p_data: payload })
    : await db.rpc(model === "culture" ? "manage_culture_editorial" : "manage_other_editorial", {
    ...(model === "culture" ? {} : { p_model: model }),
    p_action: action, p_actor: admin.userId, p_workspace: workspace || null, p_entry: entry || null, p_version: version, p_data: payload,
  });
  if (error) {
    await discardRejectedEditorialUpload(db, media.uploaded, error.code);
    console.error("Editorial operation failed", error.code, error.message);
    return redirect(workspace, error.message.includes("invalid-sources") ? "fonti" : error.message.includes("photo-limit") ? "fotolimite" : error.message.includes("conflict") ? "conflitto" : error.message.includes("fields-required") ? "campi" : "errore");
  }
  if (action === "save") {
    if (data.replayed) await discardRejectedEditorialUpload(db, media.uploaded, "replayed");
    return redirect(workspace, action, data.version);
  }
  return redirect(action === "delete" ? "" : String(data), action);
}
