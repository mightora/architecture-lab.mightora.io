import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {parseMarkdown,markdownWord,validateDiagramSource} from '../src/markdown-docx.js';
import {platforms,examples} from '../src/catalogue.js';
// Tests real document-tool handlers with renderer and SVG measurements stubbed.
// Browser engine integration, file downloads and layout are not covered by jsdom.
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/subfolder/',runScripts:'outside-only'}),w=dom.window,d=w.document;
const model={width:100,height:100,shapes:[{kind:'text',x:0,y:0,width:100,height:30,text:'Editable label',fontSize:18,fill:'111827'}]};
let disposed=0;Object.assign(w,{parseMarkdown,markdownWord,validateDiagramSource,platforms,examples,DOMPurify:{sanitize:s=>s},cleanSVG:s=>s,styledSnapshot:s=>s,svgToModel:async()=>model,createRenderer:()=>({render:async(_,source,target)=>{if(source.includes('INVALID'))throw new Error('Invalid diagram');target.innerHTML='<svg viewBox="0 0 100 100"><text x="0" y="20">Editable label</text></svg>';},exportSVG:async target=>target.innerHTML,dispose:()=>disposed++})});
w.URL.createObjectURL=()=> 'blob:local-document';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){this.wasClicked=true;};
w.eval(fs.readFileSync('src/markdown-tool.js','utf8').replace(/^import .*;\n/gm,'').replaceAll('export ',''));w.initMarkdownTool();
assert(d.querySelector('#markdown-input').value.includes('Christmas dinner'));assert.equal(d.querySelector('#markdown-language').options.length,9);
for(const id of ['mermaid','plantuml','d2','graphviz','vega','wavedrom','bpmn','drawio','svg']){d.querySelector('#markdown-language').value=id;d.querySelector('#markdown-add-diagram').click();}
assert.equal(parseMarkdown(d.querySelector('#markdown-input').value).diagrams.length,11);
d.querySelector('#markdown-input').value='# Notes\n\n```mermaid\ngraph TD;A-->B\n```\n\n```d2\nINVALID\n```';d.querySelector('#markdown-input').dispatchEvent(new w.Event('input'));d.querySelector('#markdown-export').click();
assert.equal(d.querySelector('#markdown-export').disabled,true);
for(let i=0;i<20&&d.querySelector('#markdown-export').disabled;i++)await new Promise(r=>setTimeout(r,5));
assert.equal(d.querySelector('#markdown-export').disabled,false);assert(d.querySelector('#markdown-status').textContent.includes('1 of 2'));assert.equal(d.querySelector('#markdown-download').hidden,false);assert.equal(d.querySelector('#markdown-download').wasClicked,true);assert.equal(d.querySelectorAll('#markdown-report li').length,2);assert(disposed>0);
d.querySelector('#markdown-input').dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('#markdown-download').hidden,true);
d.querySelector('#markdown-input').value='x'.repeat(300001);d.querySelector('#markdown-preview-button').click();await new Promise(r=>setTimeout(r,5));assert(d.querySelector('#markdown-status').textContent.includes('Conversion failed'));assert.equal(d.querySelector('#markdown-export').disabled,false);
console.log('Markdown UI: sample, all insertable platform fences, busy controls, mixed success/failure report, DOCX download link, stale-result invalidation and input limits passed.');dom.window.close();
