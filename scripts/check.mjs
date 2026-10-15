import assert from 'node:assert/strict';
import fs from 'node:fs';
import {examples,platforms} from '../src/catalogue.js';
import {powerpoint,word} from '../src/office.js';
import {unzipSync,strFromU8} from 'fflate';
import {instance} from '@viz-js/viz';
import {D2} from '@d2lang/d2';
import {compile} from 'vega-lite';
assert.equal(platforms.length,8);assert.equal(examples.length,108);assert.equal(new Set(examples.map(e=>e.id)).size,examples.length);
for(const e of examples){assert(platforms.some(p=>p.id===e.platform));assert(e.source.length>10);}
const viz=await instance();for(const e of examples.filter(e=>e.platform==='graphviz')){const svg=viz.renderString(e.source,{format:'svg'});assert(svg.includes('<svg'));fs.mkdirSync('checks',{recursive:true});fs.writeFileSync(`checks/${e.id}.svg`,svg);console.log('Graphviz:',e.id);}
const d2=new D2();try{for(const e of examples.filter(e=>e.platform==='d2')){const result=await d2.compile(e.source);const svg=await d2.render(result.diagram,result.renderOptions);assert(svg.includes('<svg'));fs.writeFileSync(`checks/${e.id}.svg`,svg);console.log('D2:',e.id);}}finally{await d2.dispose();}
for(const e of examples.filter(e=>e.platform==='vega')){assert(compile(JSON.parse(e.source)).spec.marks.length);console.log('Vega-Lite:',e.id);}
for(const e of examples.filter(e=>e.platform==='wavedrom'))assert(JSON.parse(e.source));
const model={width:600,height:300,shapes:[{kind:'path',fill:'ECFDF5',stroke:'059669',strokeWidth:2,commands:[{type:2,x:40,y:80},{type:16,x:240,y:80},{type:16,x:240,y:150},{type:16,x:40,y:150},{type:1}]},{kind:'text',x:65,y:105,width:160,height:24,fontSize:18,font:'Arial',text:'Power Apps',fill:'111827'},{kind:'path',fill:null,stroke:'059669',strokeWidth:2,commands:[{type:2,x:240,y:115},{type:32,x1:270,y1:115,x2:290,y2:115,x:320,y:115}]},{kind:'text',x:340,y:105,width:160,height:24,fontSize:18,font:'Arial',text:'Dataverse & approval',fill:'111827'}]};
const meta={title:'Editable export validation',purpose:'Validate native geometry and text.',platform:'Mightora test fixture',credit:'Mightora',site:'https://mightora.io'};
for(const [ext,bytes]of [['pptx',powerpoint(model,meta)],['docx',word(model,meta,'Source remains editable')]]){const files=unzipSync(bytes);assert(files['[Content_Types].xml']);assert(!Object.keys(files).some(k=>k.includes('/media/')));const diagram=strFromU8(files[ext==='pptx'?'ppt/slides/slide1.xml':'word/document.xml']);assert(diagram.includes('custGeom'));assert(diagram.includes('Power Apps'));assert(!diagram.includes('<a:blip'));fs.writeFileSync(`checks/editable-export.${ext}`,bytes);console.log(ext+': native geometry, editable text, no embedded image');}
console.log(`Validated ${examples.length} catalogue entries across ${platforms.length} platforms.`);
