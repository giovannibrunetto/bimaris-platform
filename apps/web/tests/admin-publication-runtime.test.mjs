import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const load=(path,mocks={})=>{
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 new Function("require","module","exports",code)(name=>{if(name in mocks)return mocks[name];throw Error("Unexpected import "+name)},mod,mod.exports);
 return mod.exports;
};
const ready=load("../app/admin/ready-to-publish.ts");
const editorial=load("../app/admin/ready-editorial.ts",{"server-only":{}});
const origin="https://preview.example.test",id="11111111-1111-4111-8111-111111111111";
const response={json:(body,opts)=>({status:opts.status,body,headers:new Headers(opts.headers)}),redirect:(url,status)=>({status,headers:new Headers({location:String(url)})})};
const guard=load("../lib/admin-request-origin.ts",{"server-only":{},"next/server":{NextResponse:response}});
const experience={id,review_status:"approved",published:false,experience_origin:"operator",operator:{published:true}};
for(const state of ["draft","pending","submitted","rejected","approved"])for(const published of [false,true])for(const pending of [false,true]){
 test("experience matrix "+state+" published="+published+" revision="+pending,()=>{
  const row={...experience,review_status:state,published};
  const review=pending||(!published&&["pending","submitted"].includes(state));
  const publish=ready.isReadyExperience(row,new Set(pending?[id]:[]));
  assert.equal(publish,state==="approved"&&!published&&!pending);
  assert.equal(review&&publish,false);
 });
}
test("operator offline blocks publication",()=>assert.equal(ready.isReadyExperience({...experience,operator:{published:false}},new Set()),false));
for(const state of ["pending","verified","rejected"])for(const published of [false,true]){
 test("appointment matrix "+state+" published="+published,()=>{
  const review=state==="pending"&&!published;
  const publish=ready.isReadyAppointment({verification_status:state,published});
  assert.equal(publish,state==="verified"&&!published);assert.equal(review&&publish,false);
 });
}
const workspace={id,model:"village",version:1,archived:false,entry_id:id,draft:{title:"Borgo sintetico",body:"Descrizione"}};
for(const [action,expected] of [["create",false],["save",true],["photo",true],["publish",false],["withdraw",false],["archive",false]]){
 test("editorial transition "+action,()=>assert.equal(editorial.isReadyEditorial(workspace,action),expected));
}
for(const [name,patch] of [["archived",{archived:true}],["deleted",{draft:{...workspace.draft,deletedAt:"now"}}],["empty",{draft:{title:"Borgo",body:""}}],["fixture",{draft:{title:"COLLAUDO — prova",body:"test"}}]]){
 test("editorial exclusion "+name,()=>assert.equal(editorial.isReadyEditorial({...workspace,...patch},"save"),false));
}
test("culture without location is not ready",()=>assert.equal(editorial.isReadyEditorial({...workspace,model:"culture"},"save"),false));
test("historical incomplete is not ready",()=>assert.equal(editorial.isReadyEditorial({...workspace,model:"historical"},"save"),false));
test("historical complete is ready",()=>assert.equal(editorial.isReadyEditorial({...workspace,model:"historical",draft:{title:"Racconto",subtitle:"Sub",theme:"Tema",intro:["a"],conclusion:["b"],chapters:[{title:"Capitolo",paragraphs:["c"]}]}},"save"),true));
async function invoke({category="experiences",row=experience,revisions=[],version=1,editorialRows=[{id,version:1,model:"village"}],authorized=true,headers={origin,"sec-fetch-site":"same-origin"},requestId=id,state,serviceError=false,production=false}={}){
 const calls=[];
 const query=(table)=>{const q={select(){return q},eq(){return q},neq(){return q},maybeSingle:async()=>({data:row,error:serviceError?{}:null}),then(resolve){return Promise.resolve({data:revisions,error:null}).then(resolve)}};return q};
 const delegate=(kind,defaultState,key)=>async(req,params)=>{const form=await req.formData();calls.push({kind,action:form.get("action"),id:form.get("experience_id")||form.get("workspace")||(params? (await params.params).id:null),version:form.get("version"),model:form.get("sezione"),origin:req.headers.get("origin")});return response.redirect(origin+"/admin/result?"+key+"="+(state??defaultState),303)};
 const mod=load("../app/api/admin/publications/bulk-item/route.ts",{
 "next/server":{NextRequest:Request,NextResponse:response},"@/lib/admin-mfa-guard":{getVerifiedSuperAdmin:async()=>authorized?{userId:id}:null},
 "@/lib/admin-request-origin":guard,"@/lib/supabase/server":{createServiceClient:()=>({from:query})},"@/app/admin/ready-to-publish":ready,"@/app/admin/ready-editorial":{loadReadyEditorial:async()=>editorialRows},
 "../../experiences/route":{POST:delegate("experience","experience-published","state")},"../../events/[id]/status/route":{POST:delegate("appointment","published","status")},"../../editoriale/route":{POST:delegate("editorial","publish","esito")},"../../editoriale/racconti/route":{POST:delegate("historical","publish","esito")}
 });
 const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV=production?"production":"preview";
 try{const result=await mod.POST(new Request(origin+"/api/admin/publications/bulk-item",{method:"POST",headers:{...headers,"content-type":"application/json"},body:JSON.stringify({category,id:requestId,version})}));return {result,calls};}
 finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
}
for(const [name,opts,status] of [
 ["unauthorized",{authorized:false},403],["cross-site",{headers:{origin:"https://other.example","sec-fetch-site":"cross-site"}},403],["production",{production:true},403],
 ["invalid category",{category:"all"},400],["invalid id",{requestId:"bad"},400],["experience pending",{row:{...experience,review_status:"pending"}},409],["experience published",{row:{...experience,published:true}},409],["experience revision",{revisions:[{experience_id:id}]},409],["experience offline",{row:{...experience,operator:{published:false}}},409],["appointment pending",{category:"appointments",row:{verification_status:"pending",published:false}},409],["appointment published",{category:"appointments",row:{verification_status:"verified",published:true}},409],["editorial stale",{category:"editorial",version:0},409],["editorial absent",{category:"editorial",editorialRows:[]},409],["database error",{serviceError:true},503]
]){
 test("bulk refuses "+name,async()=>{const {result,calls}=await invoke(opts);assert.equal(result.status,status);assert.equal(result.body.ok,false);assert.equal(calls.length,0)});
}
for(const [kind,opts] of [["experience",{}],["appointment",{category:"appointments",row:{verification_status:"verified",published:false}}],["editorial",{category:"editorial"}],["historical",{category:"editorial",editorialRows:[{id,version:1,model:"historical"}]}]]){
 test("bulk dispatches only "+kind,async()=>{const {result,calls}=await invoke(opts);assert.equal(result.status,200);assert.equal(result.body.ok,true);assert.equal(calls.length,1);assert.equal(calls[0].kind,kind);assert.equal(calls[0].id,id);assert.equal(calls[0].action,"publish");assert.equal(calls[0].origin,origin);if(kind==="editorial"||kind==="historical")assert.equal(calls[0].version,"1")});
}
test("single handler rejection is not reported as success",async()=>{const {result,calls}=await invoke({category:"editorial",state:"conflitto"});assert.equal(result.status,409);assert.equal(result.body.ok,false);assert.equal(calls.length,1)});
