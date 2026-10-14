import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {examples} from '../src/catalogue.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>');globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.DOMParser=dom.window.DOMParser;
const {default:mermaid}=await import('mermaid');mermaid.initialize({startOnLoad:false,securityLevel:'strict',flowchart:{htmlLabels:false}});
for(const e of examples.filter(e=>e.platform==='mermaid')){await mermaid.parse(e.source);console.log('Mermaid syntax:',e.id);}
const require=createRequire(import.meta.url),wave=require('wavedrom');
for(const e of examples.filter(e=>e.platform==='wavedrom')){const tree=wave.renderAny(0,JSON.parse(e.source),wave.waveSkin);const svg=wave.onml.stringify(tree);assert(svg.includes('<svg'));fs.writeFileSync(`checks/${e.id}.svg`,svg);console.log('WaveDrom:',e.id);}
for(const e of examples.filter(e=>['bpmn','drawio'].includes(e.platform))){const xml=new dom.window.DOMParser().parseFromString(e.source,'application/xml');assert.equal(xml.querySelector('parsererror'),null);console.log('Diagram XML:',e.id);}
dom.window.close();
