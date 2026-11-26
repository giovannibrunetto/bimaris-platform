import assert from "node:assert/strict";
import {createServer} from "node:http";
import {fileURLToPath,pathToFileURL} from "node:url";
import {readFileSync} from "node:fs";
import path from "node:path";
const harness=process.env.RUNNER_TEMP+"/admin-browser/node_modules";
const {build}=await import(pathToFileURL(harness+"/esbuild/lib/main.js"));
const {chromium}=await import(pathToFileURL(harness+"/playwright/index.mjs"));
const web=fileURLToPath(new URL("../",import.meta.url));
const component=path.join(web,"app/admin/attivita/BulkPublishButton.tsx");
const source=readFileSync(component,"utf8");
assert.ok(source.includes("window.confirm"));
const entry=String.raw`import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import BulkPublishButton from "./app/admin/attivita/BulkPublishButton";
const categories=["experiences","appointments","editorial"];
window.fixture=Object.fromEntries(categories.map(category=>[category,[1,2].map(n=>({id:category+"-"+n,title:category+" item "+n,...(category==="editorial"?{version:n}:{})}))]));
function Harness(){
 const [rows,setRows]=useState(()=>structuredClone(window.fixture));
 window.refreshQueue=()=>setRows(structuredClone(window.fixture));
 return <main>{categories.map(category=><section key={category} data-category={category}><h2>{category} ({rows[category].length})</h2><BulkPublishButton category={category} items={rows[category]}/><ul>{rows[category].map(item=><li key={item.id}>{item.title}</li>)}</ul></section>)}</main>;
}
createRoot(document.getElementById("root")).render(<Harness/>);`;
const built=await build({stdin:{contents:entry,resolveDir:web,sourcefile:"browser-harness.tsx",loader:"tsx"},bundle:true,write:false,platform:"browser",jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"isolated-router",setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:"router",namespace:"stub"}));b.onLoad({filter:/.*/,namespace:"stub"},()=>({contents:"export function useRouter(){return {refresh(){window.refreshQueue()}}}",loader:"js"}));}}]});
const bundle=built.outputFiles[0].text;
const server=createServer((req,res)=>{if(req.url==="/bundle.js"){res.writeHead(200,{"Content-Type":"text/javascript"});res.end(bundle);}else if(req.url==="/"){res.writeHead(200,{"Content-Type":"text/html"});res.end('<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');}else{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch();
let count=0;
function check(label,condition){assert.ok(condition,label);console.log("PASS "+label);count++;}
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});
  const page=await context.newPage();
  const calls=[];
  let mode="ok";
  await context.route("**/*",async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==base)return route.abort();
   if(url.pathname!=="/api/admin/publications/bulk-item")return route.continue();
   const body=route.request().postDataJSON();calls.push(body);
   if(mode==="deny")return route.fulfill({status:403,json:{ok:false}});
   if(mode==="partial"&&body.id.endsWith("-2"))return route.fulfill({status:409,json:{ok:false,reason:"Versione cambiata."}});
   await page.evaluate(({category,id})=>{window.fixture[category]=window.fixture[category].filter(row=>row.id!==id)},body);
   return route.fulfill({status:200,json:{ok:true}});
  });
  await page.goto(base);
  const section=category=>page.locator('[data-category="'+category+'"]');
  const button=category=>section(category).getByRole("button");
  await button("experiences").waitFor();
  page.once("dialog",async d=>{assert.match(d.message(),/2 esperienze/);await d.dismiss()});
  await button("experiences").click();
  check(width+" cancel makes no request",calls.length===0);
  for(const category of ["experiences","appointments","editorial"]){
   mode=category==="editorial"?"partial":"ok";
   const before=calls.length;
   page.once("dialog",async d=>{assert.match(d.message(),/2 /);await d.accept()});
   await button(category).click();
   const expected=category==="editorial"?"1 pubblicati · 1 non confermati":"2 pubblicati · 0 non confermati";
   await section(category).getByRole("status").getByText(expected,{exact:true}).waitFor();
   check(width+" "+category+" only category requests",calls.length===before+2&&calls.slice(before).every(x=>x.category===category));
   if(category==="editorial"){
    check(width+" editorial exact versions",calls.slice(before).map(x=>x.version).join(",")==="1,2");
    await section(category).getByRole("heading",{name:"editorial (1)"}).waitFor();
    check(width+" failed row retained",await section(category).getByText("Versione cambiata.",{exact:false}).count()===1);
   }else{
    await section(category).getByRole("heading",{name:category+" (0)"}).waitFor();
    check(width+" "+category+" empty button disabled",await button(category).isDisabled());
   }
  }
  mode="deny";const before=calls.length;
  page.once("dialog",d=>d.accept());
  await button("editorial").click();
  await section("editorial").getByText("Sessione o autorizzazione non valida.",{exact:false}).waitFor();
  check(width+" authorization failure retained",calls.length===before+1&&await section("editorial").getByRole("heading",{name:"editorial (1)"}).count()===1);
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log("ADMIN PUBLICATION BROWSER PASS "+count+" checks");
