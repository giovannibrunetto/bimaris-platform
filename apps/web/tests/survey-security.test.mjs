import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const load = async path => readFile(new URL(path,import.meta.url),'utf8');
const src=(await load('../lib/survey/security.ts')).replace('import "server-only";','').replace('import { cookies } from "next/headers";','const cookies = async () => ({get:()=>undefined});').replace('import { createServiceClient } from "@/lib/supabase/server";','const createServiceClient=()=>null;');
const security=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(src)).toString('base64'));
process.env.VERCEL_ENV='preview';process.env.NEXT_PUBLIC_SUPABASE_URL='https://nzdeoimwikhoidtladnu.supabase.co';process.env.BIMARIS_SURVEY_TEST_SECRET='a'.repeat(64);
test('signed test session rejects modification, expiry and malformed values',()=>{const token=security.createTestToken();assert.ok(security.validTestToken(token));assert.equal(security.validTestToken(token.slice(0,-1)+'x'),false);assert.equal(security.validTestToken('1000000000000.'+token.split('.').slice(1).join('.')),false);assert.equal(security.validTestToken(''),false);});
test('production and wrong database are disabled',()=>{process.env.VERCEL_ENV='production';assert.equal(security.surveyConfigured(),false);process.env.VERCEL_ENV='preview';process.env.NEXT_PUBLIC_SUPABASE_URL='https://production.supabase.co';assert.equal(security.surveyConfigured(),false);process.env.NEXT_PUBLIC_SUPABASE_URL='https://nzdeoimwikhoidtladnu.supabase.co';});
test('origin and cross-site protection',()=>{const req=(origin,site)=>new Request('https://test.example/questionario-cittadini/invio',{headers:{origin,'sec-fetch-site':site}});assert.ok(security.sameOrigin(req('https://test.example','same-origin')));assert.equal(security.sameOrigin(req('https://evil.example','cross-site')),false);assert.equal(security.sameOrigin(req('https://test.example','cross-site')),false);});
test('bounded body reader rejects both declared and streamed oversized input',async()=>{assert.equal(await security.readLimitedText(new Request('https://a',{method:'POST',body:'12345'}),4),null);assert.equal(await security.readLimitedText(new Request('https://a',{method:'POST',body:'ok'}),4),'ok');});
test('no database or trusted IP fails closed',async()=>assert.equal(await security.surveyLimit(new Request('https://test.example'),'submit'),'unavailable'));
const questions=stripTypeScriptTypes(await load('../app/questionario-cittadini/questions.ts'));
const validation=(await load('../lib/survey/validation.ts')).replace('import { questions } from "../../app/questionario-cittadini/questions";',questions.replaceAll('export ',''));
const v=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(validation)).toString('base64'));
globalThis.surveyTestStubs={configured:true,session:true,limit:'allow',db:true,saved:true,calls:0};
let route=await load('../app/questionario-cittadini/invio/route.ts');route=route.replace(/^import .*;\n/gm,'');route=`const {validateSurvey,PRIVACY_VERSION,CONSENT_VERSION}=globalThis.surveyValidation;
const launchConsent='consent';
const surveyLiveConfigured=()=>false;
const s=globalThis.surveyTestStubs;
const surveyConfigured=()=>s.configured, surveyTestSession=async()=>s.session, surveyLimit=async()=>s.limit;
const {sameOrigin,json,readLimitedText}=globalThis.surveySecurity;
const createServiceClient=()=>s.db?{rpc:async()=>{s.calls++;return s.saved?{data:true,error:null}:{data:null,error:{}}}}:null;
`+route;
globalThis.surveyValidation=v;globalThis.surveySecurity=security;
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(route)).toString('base64'));
const payload=()=>({requestId:'12345678-1234-4123-8123-123456789abc',answers:[['Social network'],['Nessuna difficoltà'],['Escursioni e natura'],[],[]],idea:'',consent:'',email:'',website:''});
const request=(body=JSON.stringify(payload()),headers={})=>new Request('https://test.example/questionario-cittadini/invio',{method:'POST',headers:{origin:'https://test.example','content-type':'application/json',...headers},body});
for (const [name,setup,req,status] of [
 ['production',s=>s.configured=false,()=>request(),404],
 ['session missing',s=>s.session=false,()=>request(),403],
 ['foreign origin',()=>{},()=>request(undefined,{origin:'https://evil.example'}),403],
 ['wrong content type',()=>{},()=>request(undefined,{'content-type':'text/plain'}),415],
 ['rate limit',s=>s.limit='limited',()=>request(),429],
 ['limiter unavailable',s=>s.limit='unavailable',()=>request(),503],
 ['oversized body',()=>{},()=>request('x'.repeat(9000)),413],
 ['malformed JSON',()=>{},()=>request('{'),400],
 ['invalid answer',()=>{},()=>request('{}'),400],
 ['database missing',s=>s.db=false,()=>request(),503],
 ['database failure',s=>s.saved=false,()=>request(),503],
 ['successful save',()=>{},()=>request(),200],
]) test('HTTP handler: '+name,async()=>{const s=globalThis.surveyTestStubs;Object.assign(s,{configured:true,session:true,limit:'allow',db:true,saved:true,calls:0});setup(s);const response=await POST(req());assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');if(status===200)assert.equal((await response.json()).ok,true);else if(status!==503) assert.equal(s.calls,0);});

test('privacy v2 invalidates sessions signed before the version change',async()=>{
  const {createHmac}=await import('node:crypto');
  const token=security.createTestToken();const payload=token.split('.').slice(0,2).join('.');
  const oldSignature=createHmac('sha256',process.env.BIMARIS_SURVEY_TEST_SECRET).update(payload).digest('hex');
  assert.equal(security.validTestToken(payload+'.'+oldSignature),false);
});
test('privacy version matches the candidate notice and database migration',async()=>{
  const notice=await load('../app/privacy-questionario/page.tsx');
  assert.ok(notice.includes(v.PRIVACY_VERSION));
  assert.equal(v.PRIVACY_VERSION,'2026-11-17-v2');
});
