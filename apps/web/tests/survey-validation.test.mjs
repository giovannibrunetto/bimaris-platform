import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const questions = stripTypeScriptTypes(await readFile(new URL('../app/questionario-cittadini/questions.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../lib/survey/validation.ts',import.meta.url),'utf8')).replace('import { questions } from "../../app/questionario-cittadini/questions";', questions.replaceAll('export ',''));
const { validateSurvey } = await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const input = () => ({ requestId:'12345678-1234-4123-8123-123456789abc', answers:[['Social network'],['Informazioni troppo disperse'],['Escursioni e natura'],[],[]],idea:'',consent:'',email:'',website:'' });
test('minimal response has optional Q4/Q5 and no contact',()=>{assert.deepEqual(validateSurvey(input()),{requestId:input().requestId,q1:1,q2:1,q3:[3],q4:null,idea:'',email:null,consent:false});});
test('explicit consent records only synthetic contact',()=>{const v=input();v.consent='yes';v.email='PROVA@example.invalid';assert.equal(validateSurvey(v).email,'prova@example.invalid');assert.equal(validateSurvey(v).consent,true);});
for (const [name, mutate] of [
 ['missing required answer',v=>v.answers[0]=[]],
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
test('valid two interests, optional Q4 and fake text',()=>{const v=input();v.answers[2].push('Cultura, borghi e tradizioni');v.answers[3]=["Sono soddisfatto dell'offerta"];v.idea='COLLAUDO: prova';assert.deepEqual(validateSurvey(v).q3,[3,2]);assert.equal(validateSurvey(v).q4,4);});

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
