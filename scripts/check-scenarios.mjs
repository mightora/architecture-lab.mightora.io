import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scenarios,questionFor,limitFor,filterExamples} from '../src/scenarios.js';
import {examples} from '../src/catalogue.js';
import {JSDOM} from 'jsdom';
assert.equal(scenarios.length,7);assert.equal(scenarios.filter(s=>s.kind==='Everyday').length,5);
for(const s of scenarios){
 const rows=filterExamples(examples,{scenario:s.name});assert(rows.length>=10);assert(rows.some(e=>e.id===s.start));assert(s.people.length>=3);assert(s.story.length>90);assert(s.facts.length===3);
 assert(rows.every(e=>questionFor(e).length>10&&limitFor(e).length>10));
 const platforms=new Set(rows.map(e=>e.platform));assert(platforms.size>=4);
 console.log(s.name+': '+rows.length+' complementary views, shared story and valid starting point.');
}
for(const name of ['Birthday party','Moving house','Online order']){
 const rows=filterExamples(examples,{scenario:name});assert.equal(rows.length,11);
 assert.equal(filterExamples(examples,{scenario:name,type:'Sequence'}).length,1);
 assert.equal(filterExamples(examples,{scenario:name,platform:'vega'}).length,1);
 assert.equal(filterExamples(examples,{scenario:name,search:'impossible-no-match'}).length,0);
}
assert.equal(filterExamples(examples).length,108);
const dom=new JSDOM(fs.readFileSync('index.html','utf8'));for(const id of ['scenario-cards','scenario-story','view-context','example-grid','scenario-filter','type-filter','platform-filter'])assert.equal(dom.window.document.querySelectorAll('#'+id).length,1);
assert.equal(dom.window.document.querySelector('[data-browse=scenario]').getAttribute('aria-pressed'),'true');assert.equal(dom.window.document.querySelectorAll('[data-browse]').length,3);
console.log('Scenario, diagram-type and platform browsing data checks passed.');dom.window.close();
