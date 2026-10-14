import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mermaidConfig} from '../src/mermaid-config.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{pretendToBeVisual:true});const w=dom.window;
Object.assign(globalThis,{window:w,document:w.document,DOMParser:w.DOMParser,XMLSerializer:w.XMLSerializer,CSSStyleSheet:w.CSSStyleSheet,SVGElement:w.SVGElement,HTMLElement:w.HTMLElement,Node:w.Node,getComputedStyle:w.getComputedStyle.bind(w)});
// DOM measurement stand-ins permit running the real Mermaid renderer. This
// checks emitted/sanitized labels, not browser font metrics or visual layout.
w.SVGElement.prototype.getBBox=function(){return {x:0,y:0,width:Math.max(20,(this.textContent||'').length*8),height:24};};
w.SVGElement.prototype.getComputedTextLength=function(){return (this.textContent||'').length*8;};
w.SVGElement.prototype.getSubStringLength=function(_,length){return length*8;};
const {default:createDOMPurify}=await import('dompurify');const {cleanSVG}=await import('../src/svg-sanitize.js');
const purifier=createDOMPurify(w);const foreign='<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="200" height="40"><div xmlns="http://www.w3.org/1999/xhtml"><span>Confirm guests</span></div></foreignObject></svg>';
const old=purifier.sanitize(foreign,{USE_PROFILES:{svg:true,svgFilters:true},ADD_TAGS:['foreignObject','div','span','p','br']});assert(!old.includes('Confirm guests'),'Regression reproducer: old SVG-only namespace sanitization removes HTML labels');
const sanitized=cleanSVG(foreign,purifier);assert(sanitized.includes('Confirm guests'));
const unsafe=cleanSVG('<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div xmlns="http://www.w3.org/1999/xhtml" onclick="alert(1)">Safe label<script>alert(1)</script><img src="https://example.test/tracker" onerror="alert(1)"></div></foreignObject></svg>',purifier);assert(unsafe.includes('Safe label'));assert(!/onclick|onerror|<script|<img/.test(unsafe));
const {default:mermaid}=await import('mermaid');mermaid.initialize(mermaidConfig);
for(const [name,source,labels] of [
 ['flow','flowchart TD\n A[Confirm guests] --> B[Agree the menu]',['Confirm guests','Agree the menu']],
 ['state','stateDiagram-v2\n [*] --> Invited\n Invited --> Confirmed',['Invited','Confirmed']],
 ['sequence','sequenceDiagram\n participant Host\n participant Guest\n Host->>Guest: Dinner invitation',['Host','Guest','Dinner invitation']]
]){
 const {svg}=await mermaid.render('labeltest'+name,source);const safe=cleanSVG(svg,purifier);const document=new w.DOMParser().parseFromString(safe,'image/svg+xml');const text=[...document.querySelectorAll('text,tspan')].map(e=>e.textContent).join(' ');for(const label of labels)assert(text.includes(label),`${name}: native SVG label survives render and sanitizer: ${label}`);assert(!document.querySelector('foreignObject'),name+' uses native SVG labels');
}
console.log('Mermaid labels: old HTML-label stripping reproduced; safe XHTML labels preserved; actual flowchart, state and sequence renderer text survives sanitization.');dom.window.close();
