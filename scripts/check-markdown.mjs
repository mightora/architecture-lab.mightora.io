import assert from 'node:assert/strict';
import fs from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import {JSDOM} from 'jsdom';
import {parseMarkdown,markdownWord,validateDiagramSource,diagramLanguages} from '../src/markdown-docx.js';
import {examples} from '../src/catalogue.js';
const model={width:300,height:100,shapes:[{kind:'path',commands:[{type:2,x:10,y:10},{type:16,x:280,y:10},{type:16,x:280,y:90},{type:16,x:10,y:90},{type:1}],fill:'ECFDF5',stroke:'059669',strokeWidth:1},{kind:'text',x:30,y:30,width:200,height:30,text:'Editable diagram label',fontSize:18,font:'Arial',fill:'111827'}]};
const languages=['mermaid','plantuml','d2','dot','vega-lite','wavedrom','bpmn','drawio','svg'];
const fences=languages.map(l=>'```'+l+'\nexample '+l+'\n```').join('\n\n');
const source='# Architecture notes\n\n**Bold** and *italic* with `inline code`. [Project](https://example.test/?a=1&b=2)\n\n3. First\n4. Second\n   - Nested\n\n| Owner | Action |\n| --- | --- |\n| Host | Cook |\n\n> A quote\n\n![Photo](https://example.test/private.png)\n\n<script>alert(1)</script>\n\n```js\nconsole.log("ordinary code");\n```\n\n'+fences+'\n\n```mermaid\ninvalid diagram\n```';
const parsed=parseMarkdown(source);assert.equal(parsed.diagrams.length,10);assert.equal(parsed.diagrams[3].platform,'graphviz');assert(!parsed.html.includes('<script>'));assert(!parsed.html.includes('<img'));
const results=new Map(parsed.diagrams.slice(0,9).map(d=>[d.id,{model,credit:'Credited renderer'}]));results.set(9,{error:'Invalid syntax'});
fs.mkdirSync('checks',{recursive:true});const bytes=markdownWord(parsed,results,{title:'Architecture notes'});fs.writeFileSync('checks/markdown-document.docx',bytes);
const files=unzipSync(bytes),document=strFromU8(files['word/document.xml']);const dom=new JSDOM(document,{contentType:'text/xml'});assert.equal(dom.window.document.querySelectorAll('parsererror').length,0);assert.equal(dom.window.document.getElementsByTagName('w:drawing').length,9);assert.equal(dom.window.document.getElementsByTagName('w:tbl').length,1);assert(!Object.keys(files).some(p=>p.startsWith('word/media/')));assert(document.includes('Invalid syntax'));assert(document.includes('invalid diagram'));assert(document.includes('ordinary code'));assert(document.includes('inline code'));assert(document.includes('&lt;script&gt;'));assert(!document.includes('example mermaid'));assert(document.includes('<w:numPr>'));const ids=[...dom.window.document.getElementsByTagName('wp:docPr')].map(e=>e.getAttribute('id'));assert.equal(new Set(ids).size,9);
const withSource=unzipSync(markdownWord(parsed,results,{includeSource:true}));assert(strFromU8(withSource['word/document.xml']).includes('example mermaid'));
for(const language of Object.keys(diagramLanguages)){assert.equal(parseMarkdown('```'+language+'\nA\n```').diagrams.length,1);}
for(const example of examples){const p=parseMarkdown('```'+example.platform+'\n'+example.source+'\n```');assert.equal(p.diagrams.length,1);validateDiagramSource(p.diagrams[0]);}
assert.equal(parseMarkdown('```constructor\ntext\n```').diagrams.length,0);
assert.equal(parseMarkdown('`mermaid: graph TD;A-->B`\n\n```unknown\nthing\n```').diagrams.length,0);
assert.equal(parseMarkdown(Array(200).fill('```mermaid\nA\n```').join('\n\n')).diagrams.length,200);assert.throws(()=>parseMarkdown('x'.repeat(2000001)));assert.throws(()=>parseMarkdown(Array(201).fill('```mermaid\nA\n```').join('\n\n')));
for(const source of ['<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.test/x"/></svg>','<svg><style>@import "https://example.test/font.css"</style></svg>','<svg><use href="data:image/svg+xml,x"/></svg>'])assert.throws(()=>validateDiagramSource({platform:'svg',source}));
assert.throws(()=>validateDiagramSource({platform:'drawio',source:'<mxfile><diagram>encoded-content</diagram></mxfile>'}));assert.throws(()=>validateDiagramSource({platform:'drawio',source:'<mxGraphModel><mxCell style="image=https://example.test/x"/></mxGraphModel>'}));
validateDiagramSource({platform:'svg',source:'<svg xmlns="http://www.w3.org/2000/svg"><use href="#shape"/></svg>'});
console.log('Markdown: all platform fence aliases, 89 example sources, native Word text/tables/lists, nine unique editable drawing groups, source fallbacks, limits and external-resource checks passed.');dom.window.close();

const large=parseMarkdown(Array(200).fill('```mermaid\nA\n```').join('\n\n'));const largeResults=new Map(large.diagrams.map(d=>[d.id,{model,credit:'Credited renderer'}]));fs.writeFileSync('checks/markdown-200-diagrams.docx',markdownWord(large,largeResults));const largeXml=strFromU8(unzipSync(markdownWord(large,largeResults))['word/document.xml']);assert.equal((largeXml.match(/<w:drawing>/g)||[]).length,200);console.log('Word generation accepts 200 native editable diagram groups.');
