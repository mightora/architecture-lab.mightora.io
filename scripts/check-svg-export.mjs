import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {unzipSync,strFromU8} from 'fflate';
import {powerpoint,word} from '../src/office.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
Object.defineProperty(document,'fonts',{value:{ready:Promise.resolve()}});
class Matrix{
 constructor(a=1,b=0,c=0,d=1,e=0,f=0){Object.assign(this,{a,b,c,d,e,f});}
 inverse(){const t=this.a*this.d-this.b*this.c;return new Matrix(this.d/t,-this.b/t,-this.c/t,this.a/t,(this.c*this.f-this.d*this.e)/t,(this.b*this.e-this.a*this.f)/t);}
 multiply(m){return new Matrix(this.a*m.a+this.c*m.b,this.b*m.a+this.d*m.b,this.a*m.c+this.c*m.d,this.b*m.c+this.d*m.d,this.a*m.e+this.c*m.f+this.e,this.b*m.e+this.d*m.f+this.f);}
 translate(x,y){return this.multiply(new Matrix(1,0,0,1,x,y));}scale(x,y=x){return this.multiply(new Matrix(x,0,0,y));}rotate(deg){const a=deg*Math.PI/180;return this.multiply(new Matrix(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a)));}
}
globalThis.DOMPoint=class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(m){return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};}};
// jsdom has no SVG layout. Give only graphics elements the browser geometry
// interface; title/style/desc/metadata must remain non-graphics. This reproduces
// the crashing distinction without pretending to be a browser rendering test.
const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polygon','polyline','text','tspan','foreignObject']);
Object.defineProperty(dom.window.SVGElement.prototype,'getScreenCTM',{get(){return tags.has(this.localName)?()=>new Matrix():undefined;}});
Object.defineProperty(dom.window.SVGElement.prototype,'getBBox',{value:function(){return {x:Number(this.getAttribute('x')||0),y:Number(this.getAttribute('y')||20)-14,width:(this.textContent||'').length*8,height:16};}});
Object.defineProperty(dom.window.SVGElement.prototype,'viewBox',{get(){const [x=0,y=0,width=0,height=0]=(this.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);return {baseVal:{x,y,width,height}};}});
const source='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180"><title>Christmas dinner</title><desc>A simple process</desc><metadata>creator=Mightora</metadata><style>.label{font-family:Arial}</style><defs><clipPath id="not-used"><rect width="1" height="1"/></clipPath></defs><g><rect x="20" y="40" width="150" height="60" style="fill:rgb(236,253,245);stroke:rgb(5,150,105);stroke-width:2"/><text x="35" y="75" style="font-family:Arial;font-size:16px;fill:rgb(17,24,39)">Plan the menu</text><path d="M170 70 L250 70" style="fill:none;stroke:rgb(5,150,105);stroke-width:2"/><text x="270" y="75" style="font-family:Arial;font-size:16px;fill:rgb(17,24,39)">Family dinner</text></g></svg>';
fs.mkdirSync('checks',{recursive:true});
const {svgToModel,parsePath}=await import('../src/svg-model.js');
// Run the actual installed path library, including horizontal/vertical and arc commands.
const path=parsePath('M0 0 H20 V20 Q30 30 40 20 A10 10 0 0 0 50 30 Z',new Matrix());assert(path.every(c=>[1,2,16,32].includes(c.type)));
const model=await svgToModel(source);
assert.equal(model.shapes.length,4);assert.equal(model.shapes.filter(s=>s.kind==='text').length,2);assert.equal(model.shapes[1].text,'Plan the menu');assert(model.shapes[2].commands.every(c=>c.x===undefined||Number.isFinite(c.x)));
const meta={title:'Christmas dinner export regression',purpose:'Native drawing conversion from SVG.',platform:'Test fixture',credit:'Mightora',site:'https://mightora.io'};
for(const [ext,bytes]of [['pptx',powerpoint(model,meta)],['docx',word(model,meta,source)]]){const z=unzipSync(bytes),part=strFromU8(z[ext==='pptx'?'ppt/slides/slide1.xml':'word/document.xml']);assert(part.includes('Plan the menu'));assert(part.includes('custGeom'));assert(!Object.keys(z).some(x=>x.includes('/media/')));fs.writeFileSync(`checks/svg-converted-export.${ext}`,bytes);}
assert.equal(document.body.children.length,0);
console.log('SVG metadata and path-library regressions passed; converter produces editable DOCX/PPTX geometry and text from the same SVG.');
dom.window.close();
