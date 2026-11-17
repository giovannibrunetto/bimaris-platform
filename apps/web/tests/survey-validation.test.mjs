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

test('admin displays rehearsal counts separately without exposing emails or altering live statistics', async () => {
  const admin = await readFile(new URL('../app/admin/questionari/page.tsx', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../../supabase/migrations/20261117142500_citizen_survey_admin_rehearsal_readonly.sql', import.meta.url), 'utf8');
  assert.match(admin, /db\.rpc\("admin_citizen_survey_test_summary"\)/);
  assert.match(admin, /STAGING · SOLO COLLAUDI/);
  assert.match(admin, /rehearsal\.rehearsal_responses/);
  assert.match(admin, /rehearsal\.rehearsal_contacts/);
  assert.match(migration, /WHERE rehearsal IS TRUE/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.admin_citizen_survey_test_summary\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.admin_citizen_survey_test_summary\(\) TO service_role/);
});
