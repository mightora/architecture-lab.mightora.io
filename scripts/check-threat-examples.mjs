import assert from 'node:assert/strict';
import {examples,typeGuide} from '../src/catalogue.js';
import {scenarios,filterExamples} from '../src/scenarios.js';
const threats=examples.filter(e=>e.type==='Threat model');
assert.equal(threats.length,scenarios.length);
for(const scenario of scenarios){
 const rows=filterExamples(threats,{scenario:scenario.name});assert.equal(rows.length,1,scenario.name);
 const e=rows[0];assert.equal(e.platform,'plantuml');
 assert(e.purpose.includes('SAMPLE ONLY'));assert(e.purpose.includes('not a security assessment'));
 assert(e.source.includes('note top of Process'));assert(e.source.includes('SAMPLE ONLY'));
 assert(e.source.includes('not verified controls'));assert(e.source.includes('residual risk'));
 assert(e.source.includes('trust boundary'));assert(e.source.includes('Open questions for review'));
 assert.equal((e.source.match(/Threat:/g)||[]).length,3);assert.equal((e.source.match(/Candidate safeguard:/g)||[]).length,3);
 assert(!/interested[\s_-]*part(?:y|ies)|represent(?:ation|ative)|\bTRACS\b|\bTRA\b/i.test(e.source));
 assert(filterExamples(examples,{scenario:scenario.name,type:'Threat model'}).includes(e));
 console.log('Sample warning, boundaries, threats, safeguards and scenario filter:',scenario.name);
}
assert(typeGuide.some(row=>row[0]==='Threat model'));
