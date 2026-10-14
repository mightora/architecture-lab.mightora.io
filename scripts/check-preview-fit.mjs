import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {diagramFit,createPreviewFit} from '../src/preview-fit.js';
for(const [width,height] of [[4000,100],[100,4000],[4000,4000],[500,350],[60,40]])for(const [vw,vh] of [[600,390],[280,300],[1200,560]]){
 const f=diagramFit(width,height,vw,vh);assert(f.width<=vw-48+.001);assert(f.height<=vh-48+.001);assert.equal(f.stageWidth,vw);assert.equal(f.stageHeight,vh);assert(Math.abs(f.width/f.height-width/height)<.001);
}
assert.equal(diagramFit(0,100,600,400),null);
const dom=new JSDOM('<div id="viewport"><div id="target"><svg viewBox="0 0 100 4000"></svg></div></div>');globalThis.window=dom.window;
const viewport=window.document.getElementById('viewport'),target=window.document.getElementById('target');let width=600,height=390;Object.defineProperties(viewport,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});let fits=0,zooms=0;
const controller=createPreviewFit(viewport,target,{fitVisual:()=>fits++,zoomVisual:()=>zooms++});controller.fit();const svg=target.querySelector('svg');assert.equal(parseFloat(svg.style.height),342);assert.equal(parseFloat(target.style.height),390);
controller.zoomBy(.2);assert(parseFloat(svg.style.height)>342);viewport.scrollTop=100;viewport.scrollLeft=40;controller.fit();assert.equal(viewport.scrollTop,0);assert.equal(viewport.scrollLeft,0);
width=280;height=300;window.dispatchEvent(new window.Event('resize'));assert.equal(parseFloat(svg.style.height),252);assert.equal(parseFloat(target.style.width),280);
target.classList.add('visual-preview');controller.fit();assert.equal(fits,1);controller.zoomBy(.2);assert.equal(zooms,1);assert.equal(target.style.width,'');controller.dispose();dom.window.close();delete globalThis.window;
console.log('Preview fit: wide/tall/square diagrams fit desktop and mobile bounds, aspect ratios, zoom, Fit reset, resizing and embedded-editor callbacks passed.');
