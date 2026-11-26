import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextResponse } from "next/server.js";
import ts from "typescript";

function load(path, imports = {}, jsx = false) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, ...(jsx ? { jsx: ts.JsxEmit.ReactJSX } : {}) },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    assert.ok(Object.hasOwn(imports, name), "Unexpected import " + name);
    return imports[name];
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const routes = load("../lib/editorial-routes.ts");
const origin = "https://preview.example.test";
const workspace = "11111111-1111-4111-8111-111111111111";

for (const model of ["culture", "legend", "village", "historical"]) {
  const historical = model === "historical";
  const api = "/api/admin/editoriale" + (historical ? "/racconti" : "");
  const page = "/admin/archivio-editoriale" + (historical ? "/racconti" : "");
  async function save({ conflict = false, replayed = false, json = true } = {}) {
    const { POST } = load("../app" + api + "/route.ts", {
      "next/server": { NextResponse },
      "@/lib/editorial-routes": routes,
      "@/lib/admin-mfa-guard": { getVerifiedSuperAdmin: async () => ({ userId: workspace }) },
      "@/lib/admin-request-origin": { rejectCrossSiteAdminMutation: () => null },
      "@/lib/editorial-draft-input": {
        readEditorialCover: async () => ({}),
        editorialSources: () => ({}),
        discardRejectedEditorialUpload: async () => {},
      },
      "@/lib/supabase/server": {
        createServiceClient: () => ({
          rpc: async (name, args) => {
            assert.equal(name, "save_editorial_draft");
            assert.equal(args.p_model, model);
            return conflict
              ? { error: { code: "P0001", message: "editorial-conflict" } }
              : { data: { version: 6, replayed } };
          },
        }),
      },
    });
    return POST(new Request(origin + api, {
      method: "POST",
      headers: json ? { Accept: "application/json" } : {},
      body: new URLSearchParams({ action: "save", workspace, version: "5", sezione: model }),
    }));
  }

  test(model + " accepts the real API confirmation and navigates to the saved draft", async () => {
    for (const replayed of [false, true]) {
      const response = await save({ replayed });
      assert.equal(response.status, 200);
      const { ok, state, redirect } = await response.json();
      assert.equal(ok, true);
      assert.equal(state, "save");
      const destination = routes.editorialConfirmationDestination(api, redirect, origin);
      assert.ok(destination);
      assert.equal(destination.pathname, page);
      assert.equal(destination.searchParams.get("id"), workspace);
      assert.equal(destination.searchParams.get("versione"), "6");
      assert.equal(destination.searchParams.get("esito"), "save");
      assert.equal(destination.searchParams.get("sezione"), ["legend", "village"].includes(model) ? model : null);
      assert.equal(destination.hash, historical ? "#historical-save" : "#editorial-save");
    }
    const native = await save({ json: false });
    assert.equal(native.status, 303);
    assert.equal(new URL(native.headers.get("location")).pathname, page);
  });

  test(model + " keeps a genuine conflict visible with no success navigation", async () => {
    const response = await save({ conflict: true });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { ok: false, state: "conflitto" });
  });
}

test("confirmation rejects cross-origin, wrong or missing destinations", () => {
  for (const redirect of [null, undefined, "//other.example/admin/archivio-editoriale",
    "/\\outside.example/admin/archivio-editoriale", "/admin/editoriale", "/admin/archivio-editoriale/racconti"]) {
    assert.equal(routes.editorialConfirmationDestination("/api/admin/editoriale", redirect, origin), null);
  }
});

test("historical publication route verifies access and forwards explicit confirmation only for publish", async () => {
  const calls = [];
  const requestGuard = load("../lib/admin-request-origin.ts", {
    "server-only": {},
    "next/server": { NextResponse },
  });
  let authorized = true;
  const api = routes.editorialRoutes.historical.api;
  const { POST } = load("../app" + api + "/route.ts", {
    "next/server": { NextResponse },
    "@/lib/editorial-routes": routes,
    "@/lib/admin-mfa-guard": { getVerifiedSuperAdmin: async () => authorized ? { userId: workspace } : null },
    "@/lib/admin-request-origin": requestGuard,
    "@/lib/editorial-draft-input": { discardRejectedEditorialUpload: async () => {} },
    "@/lib/supabase/server": {
      createServiceClient: () => ({
        from() {
          return { select: () => ({ eq: () => ({ eq: () => ({
            maybeSingle: async () => ({ data: { draft: { title: "Original story" } } }),
          }) }) }) };
        },
        async rpc(name, args) {
          assert.equal(name, "manage_historical_editorial");
          assert.equal(args.p_actor, workspace);
          assert.equal(args.p_version, 5);
          calls.push(args);
          if (args.p_action !== "publish") return { error: { code: "P0001", message: "editorial-protected" } };
          if (!args.p_data.confirmed) return { error: { code: "P0001", message: "editorial-confirmation-required" } };
          return { data: workspace };
        },
      }),
    },
  });
  const post = (action, confirmation, requestOrigin = origin) => POST(new Request(origin + api, {
    method: "POST",
    headers: { Accept: "application/json", Origin: requestOrigin },
    body: new URLSearchParams({ action, workspace, version: "5", confirmPublication: confirmation }),
  }));
  authorized = false;
  assert.equal((await post("publish", "yes")).status, 403);
  authorized = true;
  assert.equal((await post("publish", "yes", "https://other.example.test")).status, 403);
  assert.equal(calls.length, 0);

  const unconfirmed = await post("publish", "true");
  assert.equal(unconfirmed.status, 422);
  assert.deepEqual(await unconfirmed.json(), { ok: false, state: "conferma" });
  for (const action of ["withdraw", "archive"]) {
    const denied = await post(action, "yes");
    assert.equal(denied.status, 422);
    assert.deepEqual(await denied.json(), { ok: false, state: "protetto" });
    assert.deepEqual(calls.at(-1).p_data, {});
  }
  const published = await post("publish", "yes");
  assert.equal(published.status, 200);
  const { state, redirect } = await published.json();
  assert.equal(state, "publish");
  assert.ok(routes.editorialConfirmationDestination(api, redirect, origin));
});

test("protected historical editor offers confirmation and a private preview while hiding destructive actions", async () => {
  const { jsx, jsxs } = await import("react/jsx-runtime");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const content = { title: "Original", subtitle: "Subtitle", theme: "Era", intro: ["Opening"],
    conclusion: ["Closing"], chapters: [{ title: "Chapter", paragraphs: ["Text"] }] };
  const inertComponent = () => null;
  const fixture = {
    historical_editorial_stories: [{ id: workspace, slug: "original", published: true, protected: true, content }],
    editorial_workspaces: [{ id: workspace, entry_id: workspace, version: 5, archived: false, draft: content }],
    editorial_activity: [],
  };
  const { default: page } = load("../app/admin/archivio-editoriale/racconti/page.tsx", {
    "react/jsx-runtime": { jsx, jsxs, Fragment: Symbol.for("react.fragment") },
    "node:crypto": { randomUUID: () => workspace },
    "next/link": { default: props => jsx("a", props) },
    "next/navigation": {},
    "@/lib/editorial-routes": routes,
    "@/lib/admin-mfa-guard": { getVerifiedSuperAdmin: async () => ({ userId: workspace }) },
    "@/lib/supabase/server": { createServiceClient: () => ({ from(table) {
      const result = { data: fixture[table] };
      const q = { select: () => q, order: () => q, eq: () => q, limit: () => q,
        maybeSingle: async () => ({ data: null }), then: resolve => resolve(result) };
      return q;
    } }) },
    "@/data/live": { getPublishedCultureEntries: async () => [] },
    "@/components/HistoricalStoryCard": { default: inertComponent },
    "@/components/HistoricalStoryView": { default: ({ preview }) => jsx("div", { "data-private-preview": preview }) },
    "../EditorialDraftForm": { default: ({ photoControls, publicationControls }) => jsxs("div", { children: [photoControls, publicationControls] }) },
    "../EditorialPhotoFields": { default: () => jsx("div", { "data-cover-fields": true }) },
    "../EditorialSources": { default: inertComponent },
    "../EditorialStatusFilter": { default: inertComponent },
    "./HistoricalChapters": { default: inertComponent },
    "../editoriale.css": {},
    "@/app/ti-racconto-la-storia-di-messina/storytelling.css": {},
    "@/app/ti-racconto-la-storia-di-messina/[story]/story-detail.css": {},
    "./racconti.css": {},
  }, true);
  const html = async (query = {}) => renderToStaticMarkup(await page({ searchParams: Promise.resolve({ id: workspace, ...query }) }));
  const editor = await html();
  assert.match(editor, /data-cover-fields="true"/);
  assert.match(editor, /type="checkbox"[^>]*required[^>]*name="confirmPublication"|type="checkbox"[^>]*name="confirmPublication"[^>]*required/);
  assert.match(editor, /value="publish"/);
  assert.match(editor, /anteprima=1/);
  assert.doesNotMatch(editor, /value="(?:withdraw|archive)"/);
  assert.match(await html({ anteprima: "1" }), /data-private-preview="true"/);
  fixture.historical_editorial_stories[0].protected = false;
  const unprotected = await html();
  assert.match(unprotected, /value="withdraw"/);
  assert.match(unprotected, /value="archive"/);
});
