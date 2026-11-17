import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const raw = await readFile(new URL('../app/questionario-cittadini/collaudo/session/route.ts', import.meta.url), 'utf8');
const source = raw.replace(/^import .*;\n/gm, '');
globalThis.surveyUnlockTest = { admin:false, configured:true, limited:false, cookie:null };
const harness = `
const state=globalThis.surveyUnlockTest;
const cookies=async()=>({set:(...args)=>{state.cookie=args}});
const isAuthorizedAdmin=async()=>state.admin;
const surveyConfigured=()=>state.configured;
const sameOrigin=request=>request.headers.get("origin")===new URL(request.url).origin;
const surveyLimit=async()=>state.limited?"limited":"allow";
const readLimitedText=async(request,max)=>{const data=await request.text();return data.length>max?null:data;};
const equalSecret=code=>code==="synthetic-secret";
const createTestToken=()=>"synthetic-token";
const json=(value,status=200)=>Response.json(value,{status});
const TEST_COOKIE="bimaris_survey_test", TEST_SECONDS=1800;
`;
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(harness+source)).toString('base64'));
const request=(body,origin='https://preview.bimaris.invalid')=>new Request('https://preview.bimaris.invalid/questionario-cittadini/collaudo/session',{
  method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)
});
for(const [name,admin,body,status] of [
  ['MFA verified admin unlock',true,{mode:'admin'},303],
  ['unauthorized admin unlock',false,{mode:'admin'},403],
  ['existing secret unlock',false,{code:'synthetic-secret'},303],
  ['incorrect secret unlock',false,{code:'wrong'},403],
]) test(name,async()=>{
  Object.assign(globalThis.surveyUnlockTest,{admin,configured:true,limited:false,cookie:null});
  const response=await POST(request(body));
  assert.equal(response.status,status);
  if(status===303){
    assert.equal(response.headers.get('location'),'https://preview.bimaris.invalid/questionario-cittadini');
    assert.equal(globalThis.surveyUnlockTest.cookie[0],'bimaris_survey_test');
    assert.equal(globalThis.surveyUnlockTest.cookie[2].httpOnly,true);
    assert.equal(globalThis.surveyUnlockTest.cookie[2].sameSite,'strict');
    assert.equal(globalThis.surveyUnlockTest.cookie[2].maxAge,1800);
  } else assert.equal(globalThis.surveyUnlockTest.cookie,null);
});
test('unconfigured preview fails closed without granting a cookie',async()=>{
  Object.assign(globalThis.surveyUnlockTest,{admin:true,configured:false,limited:false,cookie:null});
  assert.equal((await POST(request({mode:'admin'}))).status,404);
  assert.equal(globalThis.surveyUnlockTest.cookie,null);
});
test('cross-origin request is denied even for MFA admin',async()=>{
  Object.assign(globalThis.surveyUnlockTest,{admin:true,configured:true,limited:false,cookie:null});
  assert.equal((await POST(request({mode:'admin'},'https://other.example'))).status,403);
  assert.equal(globalThis.surveyUnlockTest.cookie,null);
});
test('unlock limiter remains enforced for admin',async()=>{
  Object.assign(globalThis.surveyUnlockTest,{admin:true,configured:true,limited:true,cookie:null});
  assert.equal((await POST(request({mode:'admin'}))).status,429);
  assert.equal(globalThis.surveyUnlockTest.cookie,null);
});
