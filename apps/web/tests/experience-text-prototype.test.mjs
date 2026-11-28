import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeExperienceText,MAX_EXPERIENCE_TEXT} from '../lib/experience-text-prototype.ts';
const cases=[
 ['breve','  Visita  guidata.  ','Visita guidata.'],
 ['grammatica non modificata','  I bambini  e ammessi. ','I bambini e ammessi.'],
 ['corretto','Visita guidata al museo.','Visita guidata al museo.'],
 ['prezzo e condizioni','  25,50 €  a persona; non rimborsabile. ','25,50 € a persona; non rimborsabile.'],
 ['orari','  Ore  09:30–12:00; lunedì chiuso. ','Ore 09:30–12:00; lunedì chiuso.'],
 ['incompleto','  Prezzo da definire. ','Prezzo da definire.'],
 ['contraddittorio',' Gratuito.  Costo: 20 €. ','Gratuito. Costo: 20 €.'],
 ['lungo',('Escursione  di 2 ore.\n\n\n').repeat(100),('Escursione di 2 ore.\n\n').repeat(100).trim()],
 ['unicode','  Caffè  e tè — 10 €; ½ ora. ','Caffè e tè — 10 €; ½ ora.'],
 ['negazioni','Non  adatto ai minori; nessun trasporto.','Non adatto ai minori; nessun trasporto.'],
 ['multilinea','A\r\n\r\n\r\n B','A\n\nB']
];
for(const [name,input,expected] of cases)test(name,()=>{
 const r=proposeExperienceText(input);
 assert.equal(r.original,input);assert.equal(r.proposed,expected);
 assert.equal(r.changed,input!==expected);
 assert.equal(r.original.replace(/\s/gu,''),r.proposed.replace(/\s/gu,''));
});
test('vuoto',()=>assert.throws(()=>proposeExperienceText('  ')));
test('limite',()=>assert.throws(()=>proposeExperienceText('x'.repeat(MAX_EXPERIENCE_TEXT+1))));
test('idempotenza',()=>{const r=proposeExperienceText('  A  B  ');assert.equal(proposeExperienceText(r.proposed).changed,false)});
