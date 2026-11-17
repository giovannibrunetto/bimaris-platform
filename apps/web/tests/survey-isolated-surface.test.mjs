import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const read = p => readFile(new URL(p, import.meta.url), "utf8");
const moduleFrom = src => import("data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(src)).toString("base64"));
const mode = await moduleFrom(await read("../lib/prelaunch-mode.ts"));
const mainId = "prj_KXD8HdV3hY2ipyN8DAdA7uhp6kgX";
const otherId = "prj_NsbtPm214NbbweDhUQvPnSaFM1rH";
const setEnv = (id = otherId) => {
  process.env.VERCEL_ENV = "production";
  process.env.VERCEL_PROJECT_ID = id;
  process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID = otherId;
  process.env.BIMARIS_SURVEY_PUBLIC_ONLY = "true";
};
test("isolated mode needs explicit matching non-main Vercel project", () => {
  setEnv(); assert.equal(mode.isIsolatedSurveyDeployment(), true);
  process.env.VERCEL_PROJECT_ID = mainId;
  process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID = mainId;
  assert.equal(mode.isIsolatedSurveyDeployment(), false);
  setEnv(); delete process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID;
  assert.equal(mode.isIsolatedSurveyDeployment(), false);
  assert.equal(mode.isIsolatedSurveyRequested(), true);
  setEnv(); process.env.BIMARIS_SURVEY_PUBLIC_ONLY = "false";
  assert.equal(mode.isIsolatedSurveyDeployment(), false);
  setEnv(); process.env.VERCEL_ENV = "development";
  assert.equal(mode.isIsolatedSurveyDeployment(), false);
});
const proxySource = (await read("../proxy.ts"))
  .replace('import { NextRequest, NextResponse } from "next/server";', `
    const NextResponse = class {
      constructor(body, opts={}) { this.status=opts.status??200; this.body=body; this.headers=new Headers(opts.headers); }
      static next() { return new NextResponse("", {status:200}); }
      static json(body, opts={}) { return new NextResponse(JSON.stringify(body), opts); }
    };
  `)
  .replace('import { isPrelaunchEnabled, isIsolatedSurveyDeployment, isIsolatedSurveyRequested } from "@/lib/prelaunch-mode";',
    'const {isPrelaunchEnabled, isIsolatedSurveyDeployment, isIsolatedSurveyRequested}=globalThis.surveyIsolatedMode;');
globalThis.surveyIsolatedMode = mode;
const {proxy}=await moduleFrom(proxySource);
const request = path => ({nextUrl: {pathname:path}});
test("public-only allowlist permits exactly survey, notice, submit and needed assets", () => {
  setEnv();
  for (const path of ["/questionario-cittadini","/questionario-cittadini/","/privacy-questionario",
      "/questionario-cittadini/invio","/brand/bimaris-main.jpeg","/_next/static/chunks/a.js"]) {
    assert.equal(proxy(request(path)).status,200,path);
  }
  for (const path of ["/","/mappa","/admin","/area-operatore","/api/admin/operators",
      "/questionario-cittadini/collaudo","/questionario-cittadini/collaudo/session",
      "/questionario-cittadini/other","/privacy","/robots.txt","/_next/image","/brand/secret.jpg"]) {
    assert.equal(proxy(request(path)).status,404,path);
  }
});
test("main deployment cannot activate public-only routes", () => {
  setEnv(mainId);process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID=mainId;
  assert.equal(mode.isIsolatedSurveyDeployment(),false);
  assert.equal(proxy(request("/questionario-cittadini")).status,503);
});
test("isolated survey removes main site chrome and keeps live off by default",async()=>{
  const layout = await read("../app/layout.tsx");
  const page = await read("../app/questionario-cittadini/page.tsx");
  const live = await read("../lib/survey/live.ts");
  assert.match(layout,/isIsolatedSurveyDeployment\(\)/);
  assert.match(page,/!isIsolatedSurveyDeployment\(\)/);
  assert.match(live,/BIMARIS_SURVEY_COLLECTION_MODE === "live"/);
});

test("incomplete or mismatched public-only configuration fails closed for all routes", () => {
  setEnv(); delete process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID;
  for (const path of ["/", "/questionario-cittadini", "/privacy-questionario", "/admin", "/api/admin/operators"]) {
    assert.equal(proxy(request(path)).status, 503, path);
  }
  setEnv(); process.env.VERCEL_PROJECT_ID = mainId;
  assert.equal(proxy(request("/mappa")).status, 503);
  setEnv(); process.env.VERCEL_ENV = "development";
  assert.equal(proxy(request("/questionario-cittadini")).status, 503);
});

test("known isolated project remains closed when both custom flags are absent", () => {
  setEnv();
  delete process.env.BIMARIS_SURVEY_PUBLIC_ONLY;
  delete process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID;
  assert.equal(mode.isIsolatedSurveyRequested(), true);
  assert.equal(mode.isIsolatedSurveyDeployment(), false);
  for (const path of ["/", "/admin", "/area-operatore", "/mappa", "/questionario-cittadini", "/privacy-questionario", "/questionario-cittadini/invio"]) {
    assert.equal(proxy(request(path)).status, 503, path);
  }
});

test("isolated submit never falls back to staging test submissions", async () => {
  const route = await read("../app/questionario-cittadini/invio/route.ts");
  const live = await read("../lib/survey/live.ts");
  assert.match(route, /if \(isIsolatedSurveyDeployment\(\)\)/);
  assert.match(route, /if \(!surveyLiveConfigured\(\)\) return json\(\{ error: "raccolta_disattivata" \}, 503\)/);
  assert.match(live, /process\.env\.BIMARIS_SURVEY_PUBLIC_ONLY === "true"/);
});
