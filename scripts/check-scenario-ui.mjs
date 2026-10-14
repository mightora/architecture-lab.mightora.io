import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {platforms,examples,typeGuide} from '../src/catalogue.js';
import {scenarios,scenarioFor,questionFor,limitFor,filterExamples} from '../src/scenarios.js';
import versions from '../src/versions.json' with {type:'json'};
// DOM interaction unit test of the real application handlers. The renderer is
// stubbed; this is not browser layout, rendering or download verification.
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
Object.assign(w,{initMarkdownTool:()=>{},platforms,examples,typeGuide,scenarios,scenarioFor,questionFor,limitFor,filterExamples,versions,render:async(_,source,target)=>{target.innerHTML='<svg viewBox="0 0 100 100"></svg>';}});
const source=fs.readFileSync('src/main.js','utf8').replace(/^import .*;\n/gm,'');
w.eval(source);await new Promise(resolve=>setTimeout(resolve,0));const d=w.document;
assert.equal(d.querySelector('#scenario-filter').value,'Christmas dinner');assert.equal(d.querySelectorAll('#example-grid article').length,12);assert(d.querySelector('#scenario-story').textContent.includes('The Host'));
d.querySelector('[data-scenario="Birthday party"]').click();assert.equal(d.querySelectorAll('#example-grid article').length,10);assert(d.querySelector('#scenario-story').textContent.includes('Organiser'));
d.querySelector('#scenario-story [data-example]').click();await new Promise(resolve=>setTimeout(resolve,0));assert(d.querySelector('#view-context').textContent.includes('Birthday party'));
d.querySelector('[data-browse=platform]').click();assert.equal(d.querySelector('#scenario-cards').hidden,true);assert.equal(d.querySelectorAll('#example-grid article').length,89);
d.querySelector('#platform-filter').value='vega';d.querySelector('#platform-filter').dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('#example-grid article').length,7);
d.querySelector('[data-browse=type]').click();d.querySelector('#type-filter').value='State';d.querySelector('#type-filter').dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('#example-grid article').length,6);
d.querySelector('[data-browse=scenario]').click();assert.equal(d.querySelector('#scenario-cards').hidden,false);assert.equal(d.querySelector('#scenario-filter').value,'Christmas dinner');assert.equal(d.querySelectorAll('#example-grid article .view-limit').length,12);
console.log('Real application handlers: default scenario, story selection, view opening, platform/type filtering and return to scenario browsing passed.');
dom.window.close();
