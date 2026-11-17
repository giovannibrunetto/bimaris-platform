import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const read = p => readFile(new URL(p, import.meta.url), 'utf8');
const load = source => import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const questions = stripTypeScriptTypes(await read('../app/questionario-cittadini/questions.ts'));
const validation = await load((await read('../lib/survey/validation.ts')).replace('import { questions } from "../../app/questionario-cittadini/questions";', questions.replaceAll('export ', '')));
const security = await load((await read('../lib/survey/security.ts')).replace('import "server-only";', '').replace('import { cookies } from "next/headers";', 'const cookies=async()=>({get:()=>undefined});').replace('import { createServiceClient } from "@/lib/supabase/server";', 'const createServiceClient=()=>null;'));
globalThis.liveTest = { db: true, open: true, limited: false, fail: '', calls: [], saved: null };
globalThis.liveValidation = validation; globalThis.liveSecurity = security;
const live = await load(`import {createHmac} from 'node:crypto';
const {json,sameOrigin,readLimitedText}=globalThis.liveSecurity;
const {validateSurvey,PRIVACY_VERSION,CONSENT_VERSION}=globalThis.liveValidation;
const launchConsent='Sì, desidero ricevere esclusivamente la comunicazione del lancio via email e ho letto l’informativa privacy';
const createServiceClient=()=>globalThis.liveTest.db?{rpc:async(name,args)=>{
 const s=globalThis.liveTest;s.calls.push({name,args});
 if(s.fail===name)return {data:null,error:{message:'DO_NOT_EXPOSE_PAYLOAD'}};
 if(name==='citizen_survey_collection_open')return {data:s.open,error:null};
 if(name==='consume_citizen_survey_live_limit')return {data:!s.limited,error:null};
 s.saved=args;return {data:true,error:null};
}}:null;
` + (await read('../lib/survey/live.ts')).replace(/^import .*;\n/gm, ''));
const env = () => {
 process.env.VERCEL_ENV='production'; process.env.BIMARIS_SURVEY_COLLECTION_MODE='live';
 process.env.BIMARIS_SURVEY_LIVE_PROJECT_REF='aaaaaaaaaaaaaaaaaaaa';
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://aaaaaaaaaaaaaaaaaaaa.supabase.co';
 process.env.BIMARIS_SURVEY_LIVE_SECRET='x'.repeat(64);
};
const reset = () => { env(); Object.assign(globalThis.liveTest,{db:true,open:true,limited:false,fail:'',calls:[],saved:null}); };
const payload = () => ({requestId:'12345678-1234-4123-8123-123456789abc',answers:[['Social network'],['Nessuna difficoltà'],['Escursioni e natura'],[],[]],idea:'',email:'',consent:'',website:''});
const request = (body=JSON.stringify(payload()),headers={}) => new Request('https://bimaris.example/questionario-cittadini/invio',{method:'POST',headers:{origin:'https://bimaris.example','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1',...headers},body});
for(const [name,modify] of [
 ['preview',()=>process.env.VERCEL_ENV='preview'],
 ['disabled switch',()=>delete process.env.BIMARIS_SURVEY_COLLECTION_MODE],
 ['staging database',()=>{process.env.BIMARIS_SURVEY_LIVE_PROJECT_REF='nzdeoimwikhoidtladnu';process.env.NEXT_PUBLIC_SUPABASE_URL='https://nzdeoimwikhoidtladnu.supabase.co';}],
 ['mismatched project',()=>process.env.NEXT_PUBLIC_SUPABASE_URL='https://bbbbbbbbbbbbbbbbbbbb.supabase.co'],
 ['missing project',()=>delete process.env.BIMARIS_SURVEY_LIVE_PROJECT_REF],
 ['short secret',()=>process.env.BIMARIS_SURVEY_LIVE_SECRET='short']
]) test('live gate rejects '+name,async()=>{reset();modify();assert.equal(live.surveyLiveConfigured(),false);assert.equal(await live.liveCollectionOpen(),false);assert.equal(globalThis.liveTest.calls.length,0);});
for(const [name,setup,req,status] of [
 ['database gate closed',s=>s.open=false,()=>request(),503],
 ['database absent',s=>s.db=false,()=>request(),503],
 ['gate query failure',s=>s.fail='citizen_survey_collection_open',()=>request(),503],
 ['cross origin',()=>{},()=>request(undefined,{origin:'https://other.example'}),403],
 ['wrong content type',()=>{},()=>request(undefined,{'content-type':'text/plain'}),415],
 ['no trusted IP',()=>{},()=>request(undefined,{'x-vercel-forwarded-for':''}),503],
 ['rate limited',s=>s.limited=true,()=>request(),429],
 ['limiter failure',s=>s.fail='consume_citizen_survey_live_limit',()=>request(),503],
 ['oversized body',()=>{},()=>request('x'.repeat(9000)),413],
 ['bad JSON',()=>{},()=>request('{'),400],
 ['invalid input',()=>{},()=>request('{}'),400],
 ['save failure',s=>s.fail='submit_citizen_survey',()=>request(),503],
 ['valid anonymous save',()=>{},()=>request(),200],
 ['optional synthetic email',()=>{},()=>{const p=payload();p.consent='yes';p.email='test@example.invalid';return request(JSON.stringify(p));},200],
]) test('live handler '+name,async()=>{
 reset();setup(globalThis.liveTest);const response=await live.handleLiveSubmission(req());
 assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
 const body=await response.text();assert.ok(!body.includes('DO_NOT_EXPOSE_PAYLOAD'));
 if(status!==200)assert.equal(globalThis.liveTest.saved,null);
 else {assert.equal(globalThis.liveTest.saved.p_privacy_version,'2026-11-17-v2');assert.equal(globalThis.liveTest.saved.p_rehearsal,false);}
 const limit=globalThis.liveTest.calls.find(c=>c.name==='consume_citizen_survey_live_limit');
 if(limit){assert.match(limit.args.p_actor,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(limit.args).includes('192.0.2.1'));}
});
test('live validation permits multiline answers without test prefix',()=>{const p=payload();p.idea='Esempio fittizio\nSeconda riga';assert.ok(validation.validateSurvey(p,'live'));assert.equal(validation.validateSurvey(p),null);});
for(const email of ['bad address@example.invalid','a@-example.invalid','a@example..invalid','a@example.invalid\nInjected: x']) test('live validation rejects malformed email '+JSON.stringify(email),()=>{const p=payload();p.consent='yes';p.email=email;assert.equal(validation.validateSurvey(p,'live'),null);});
