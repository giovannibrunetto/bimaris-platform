import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const questions = stripTypeScriptTypes(await readFile(new URL('../app/questionario-cittadini/questions.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../lib/survey/validation.ts',import.meta.url),'utf8')).replace('import { questions } from "../../app/questionario-cittadini/questions";', questions.replaceAll('export ',''));
const { validateSurvey } = await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const input = () => ({ requestId:'12345678-1234-4123-8123-123456789abc', answers:[['Social network'],['Informazioni troppo disperse'],['Escursioni e natura'],['Ci sono, ma sono difficili da scoprire'],[]],idea:'',consent:'',email:'',website:'' });
test('minimal response requires Q4 but allows optional Q5 and no contact',()=>{assert.deepEqual(validateSurvey(input()),{requestId:input().requestId,q1:1,q2:1,q3:[3],q4:1,idea:'',email:null,consent:false});});
test('explicit consent records only synthetic contact',()=>{const v=input();v.consent='yes';v.email='PROVA@example.invalid';assert.equal(validateSurvey(v).email,'prova@example.invalid');assert.equal(validateSurvey(v).consent,true);});
for (const [name, mutate] of [
 ['missing required answer',v=>v.answers[0]=[]],
 ['missing required fourth answer',v=>v.answers[3]=[]],
 ['three interests',v=>v.answers[2]=['Escursioni e natura','Cultura, borghi e tradizioni','Eventi, musica e spettacoli']],
 ['duplicate interests',v=>v.answers[2]=['Escursioni e natura','Escursioni e natura']],
 ['invented option',v=>v.answers[0]=['other']],
 ['email without consent',v=>v.email='a@example.invalid'],
 ['real email',v=>{v.consent='yes';v.email='a@gmail.com'}],
 ['unsynthetic free text',v=>v.idea='My real name'],
 ['oversize text',v=>v.idea='COLLAUDO:'+'x'.repeat(1000)],
 ['honeypot',v=>v.website='bot'],
 ['unknown field',v=>v.name='person'],
 ['invalid UUID',v=>v.requestId='bad'],
 ['nonboolean consent shape',v=>v.consent=true],
 ['control character',v=>v.idea='COLLAUDO:\u0000'],
 ['missing payload field',v=>delete v.email],
]) test('rejects '+name,()=>{const v=input();mutate(v);assert.equal(validateSurvey(v),null);});
test('yes with empty optional email creates no contact',()=>{const v=input();v.consent='yes';assert.equal(validateSurvey(v).consent,false);});
test('valid two interests, required Q4 and optional fake text',()=>{const v=input();v.answers[2].push('Cultura, borghi e tradizioni');v.answers[3]=["Sono soddisfatto dell'offerta"];v.idea='COLLAUDO: prova';assert.deepEqual(validateSurvey(v).q3,[3,2]);assert.equal(validateSurvey(v).q4,4);});

test('mobile survey retains a compact BIMARIS image during questions and consent', async () => {
  const page = await readFile(new URL('../app/questionario-cittadini/CitizenSurvey.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(page, /step >= 0 && step < 7 \? styles\.brandCompact : ""/);
  assert.match(css, /@media\(max-width:760px\)\{[^\n]*\.brandCompact\{display:block\}/);
  assert.match(css, /\.brandCompact \.visual\{[^}]*height:72px/);
  assert.match(css, /\.primary\{[^}]*border-radius:999px/);
});

test('desktop questions use a compact layout without affecting welcome and thanks', async () => {
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(min-width:761px\)/);
  assert.match(css, /\.layout:has\(\.brandCompact\)\{margin-top:24px/);
  assert.match(css, /\.brandCompact \.visual\{width:100%;max-width:420px/);
  assert.match(css, /\.layout:has\(\.brandCompact\) \.panel\{min-height:0/);
  assert.match(css, /\.layout:has\(\.brandCompact\) \.choice\{min-height:58px/);
});

test('multi-select checkboxes have round indicators without changing checkbox semantics', async () => {
  const page = await readFile(new URL('../app/questionario-cittadini/CitizenSurvey.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(page, /type=\{step === 2 \? "checkbox" : "radio"\}/);
  assert.match(css, /\.choice input\[type=checkbox\]\{[^}]*border-radius:50%/);
  assert.match(css, /\.choice input\[type=checkbox\]:checked\{/);
});

test('round checkbox indicators have fixed equal mobile dimensions', async () => {
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(css, /\.survey \.choice input\[type=checkbox\]\{[^}]*inline-size:18px!important/);
  assert.match(css, /\.survey \.choice input\[type=checkbox\]\{[^}]*block-size:18px!important/);
  assert.match(css, /\.survey \.choice input\[type=checkbox\]\{[^}]*min-height:18px!important/);
  assert.match(css, /\.survey \.choice input\[type=checkbox\]\{[^}]*aspect-ratio:1 \/ 1!important/);
});

test('welcome screen stays stationary without autofocus-induced scroll', async () => {
  const page = await readFile(new URL('../app/questionario-cittadini/CitizenSurvey.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(page, /if \(step >= 0\) heading\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(page, /step === -1 \? styles\.welcomeScreen : ""/);
  assert.match(css, /\.welcomeScreen\{animation:none!important;transform:none!important;\}/);
});

test('welcome screen is centered and viewport-locked without trapping short displays', async () => {
  const page = await readFile(new URL('../app/questionario-cittadini/CitizenSurvey.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../app/questionario-cittadini/survey.module.css', import.meta.url), 'utf8');
  assert.match(page, /step === -1 \? styles\.surveyWelcome : ""/);
  assert.match(css, /\.surveyWelcome\{[^}]*height:100dvh;[^}]*overflow:hidden;[^}]*display:flex;/);
  assert.match(css, /\.surveyWelcome \.layout\{[^}]*flex:1 1 auto;[^}]*align-items:center;/);
  assert.match(css, /\.surveyWelcome \.panel\{[^}]*overflow-y:auto;/);
  assert.match(css, /@media\(max-width:760px\)\{[^}]*\.surveyWelcome\{/);
});

test('admin reporting reads Production only on the server and never exposes contact emails', async () => {
  const admin = await readFile(new URL('../app/admin/questionari/page.tsx', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../../../supabase/migrations/20261117142500_citizen_survey_admin_rehearsal_readonly.sql', import.meta.url), 'utf8');
  assert.match(admin, /isAuthorizedAdmin\(\)/);
  assert.match(admin, /redirect\("\/admin\/login"\)/);
  assert.match(admin, /BIMARIS_SURVEY_REPORTING_SECRET_KEY/);
  assert.match(admin, /BIMARIS_SURVEY_REPORTING_URL/);
  assert.match(admin, /db\.rpc\("admin_citizen_survey_summary"\)/);
  assert.match(admin, /db\.rpc\("admin_citizen_survey_ideas"/);
  assert.match(admin, /PRODUCTION · DATI REALI/);
  assert.match(admin, /Le email sono conservate in un archivio separato/);
  assert.doesNotMatch(admin, /\.from\("launch_contacts"\)/);
  assert.doesNotMatch(admin, /process\.env\.NEXT_PUBLIC_BIMARIS_SURVEY_REPORTING_SECRET_KEY/);
  // Historic Staging rehearsal function remains separately guarded.
  assert.match(migration, /WHERE rehearsal IS TRUE/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.admin_citizen_survey_test_summary\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.admin_citizen_survey_test_summary\(\) TO service_role/);
});

test('V6 privacy notice accurately describes isolated rehearsal flags without changing consent version', async () => {
  const notice = await readFile(new URL('../app/privacy-questionario/page.tsx', import.meta.url), 'utf8');
  assert.match(notice, /rehearsal=true/);
  assert.match(notice, /tabelle di test dedicate/);
  assert.match(notice, /versione 2026-11-17-v2/);
});
test('V6 backup procedure uses encrypted stream, never plaintext dump or automatic schedule', async () => {
  const script = await readFile(new URL('../../../scripts/backup-survey-encrypted.sh', import.meta.url), 'utf8');
  assert.match(script, /set -Eeuo pipefail/);
  assert.match(script, /pg_dump --format=custom --no-owner --no-acl --schema=survey_private \|\s*\n\s*gpg --batch --encrypt/);
  assert.match(script, /BIMARIS_GPG_RECIPIENT/);
  assert.match(script, /NOT VERIFIED BY RESTORE/);
  assert.doesNotMatch(script, /(?:--password=|PGPASSWORD=|service_role_key=)/);
});

test('production candidate is not a deployable migration and defaults to a disabled release gate', async () => {
  const prod = await readFile(new URL('../../../docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V7-production-candidate.sql', import.meta.url), 'utf8');
  assert.match(prod, /REVIEW CANDIDATE ONLY/);
  assert.match(prod, /enabled boolean NOT NULL DEFAULT false/);
  assert.match(prod, /staging_only boolean NOT NULL DEFAULT true/);
  assert.match(prod, /production_rehearsal_disabled/);
  assert.match(prod, /REVOKE ALL ON SCHEMA survey_private FROM PUBLIC,anon,authenticated/);
  assert.match(prod, /CREATE OR REPLACE FUNCTION public.admin_citizen_survey_test_summary/);
  assert.match(prod, /cron.schedule\('bimaris-citizen-survey-release-retention'/);
  assert.doesNotMatch(prod, /CREATE TABLE survey_private\.(?:responses_test|launch_contacts_test)/);
  assert.doesNotMatch(prod, /^INSERT INTO survey_private\.(?:responses|launch_contacts)\s/m);
});
