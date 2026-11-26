import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextResponse } from "next/server.js";
import ts from "typescript";

function load(path, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    assert.ok(Object.hasOwn(imports, name), "Unexpected import " + name);
    return imports[name];
  }, module, module.exports);
  return module.exports;
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
