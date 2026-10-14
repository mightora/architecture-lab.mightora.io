import assert from 'node:assert/strict';
import {examples,typeGuide} from '../src/catalogue.js';
import {scenarioFor} from '../src/scenarios.js';
const rows=examples.filter(e=>e.scenario==='Public application service');assert.equal(rows.length,12);assert.equal(new Set(rows.map(e=>e.type)).size,6);
for(const type of new Set(rows.map(e=>e.type))){const group=rows.filter(e=>e.type===type);assert.equal(group.length,2);assert(group.some(e=>e.platform==='plantuml'));assert(group.some(e=>e.platform!=='plantuml'));assert(group.every(e=>e.question.length>20&&e.leavesOut.length>30));}
for(const e of rows){assert(!/\b(?:TRACS|TRA)\b/i.test(JSON.stringify(e)));assert(!/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(e.source));assert(!/https?:\/\//i.test(e.source));}
assert.equal(scenarioFor('Public application service').start,'solution-concepts-plantuml');
const deployment=rows.find(e=>e.id==='solution-deployment-plantuml');assert(deployment.source.includes('All subscriptions, tenants and environments already exist'));assert(!deployment.source.includes('sign-in'));assert(!deployment.source.includes('Applicant ->'));assert(deployment.source.includes('Arrows show artefact placement only'));
assert(rows.find(e=>e.id==='solution-workloads-plantuml').source.includes('Migration is deliberately outside'));
assert(rows.find(e=>e.id==='solution-data-flow-plantuml').source.includes('Private submissions do not become public automatically'));
assert(typeGuide.some(row=>row[0]==='Physical deployment architecture'));
console.log('Six architecture view pairs: PlantUML coverage, generic identifiers, consistent scenario metadata, approved publication and deployment/runtime distinctions passed.');
