import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateAdminPolicy } from '../lib/admin-policy-core.ts';

const resource = 'admin.operators';
const action = 'read';
const valid = {userId:'fixture-user',sessionId:'fixture-session',aal:'aal2',role:'super_admin'};
const decide = (verifyIndividual, hasPermission) => evaluateAdminPolicy(
  {resource,action,mode:'individual_required'}, {verifyIndividual,hasPermission});

test('M01: unauthenticated identity is denied', async () => {
  assert.deepEqual(await decide(async()=>null), {ok:false,reason:'identity_unverified'});
});
test('M02: aal1 identity is denied', async () => {
  assert.deepEqual(await decide(async()=>({...valid,aal:'aal1'})), {ok:false,reason:'identity_unverified'});
});
test('M03: simulated aal2 super_admin is accepted by pure policy', async () => {
  const result=await decide(async()=>valid);
  assert.equal(result.ok,true);
  assert.equal(result.actor.sessionId,valid.sessionId);
});
test('M04: aal2 identity without super_admin role is denied', async () => {
  assert.deepEqual(await decide(async()=>({...valid,role:'viewer'})), {ok:false,reason:'identity_unverified'});
});
test('M05: revoked permission is denied when permission checker returns false', async () => {
  assert.deepEqual(await decide(async()=>valid,async()=>false), {ok:false,reason:'permission_denied'});
});
test('M09: identity and permission lookup errors fail closed', async () => {
  assert.deepEqual(await decide(async()=>{throw Error('unavailable')}), {ok:false,reason:'identity_unverified'});
  assert.deepEqual(await decide(async()=>valid,async()=>{throw Error('unavailable')}), {ok:false,reason:'identity_unverified'});
});
test('M08: legacy mode remains denied', async () => {
  assert.deepEqual(await evaluateAdminPolicy({resource,action,mode:'legacy_explicit'},{verifyIndividual:async()=>valid}),{ok:false,reason:'individual_required'});
});
test('source contract: MFA guard requires validated user, aal2 and service RPC', () => {
  const source=readFileSync(new URL('../lib/admin-mfa-guard.ts',import.meta.url),'utf8');
  assert.match(source,/auth\.getUser\(accessToken\)/);
  assert.match(source,/assurance\?\.currentLevel !== "aal2"/);
  assert.match(source,/rpc\("is_active_super_admin_session"/);
  assert.match(source,/roleError \|\| allowed !== true/);
  assert.match(source,/nzdeoimwikhoidtladnu\.supabase\.co/);
});
