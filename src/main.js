import {createPreviewFullscreen} from './preview-fullscreen.js';
import {createPreviewFit} from './preview-fit.js';
import {initMarkdownTool} from './markdown-tool.js';
import './styles.css';
import {platforms,examples,typeGuide} from './catalogue.js';
import versions from './versions.json';
import {scenarios,scenarioFor,questionFor,limitFor,filterExamples} from './scenarios.js';
import {render,exportSVG,cleanSVG,graphvizExport,fitViewport,zoomViewport} from './renderers.js';
import {styledSnapshot,svgToModel} from './svg-model.js';
import {powerpoint,word} from './office.js';
import {strToU8,strFromU8,deflateSync,inflateSync} from 'fflate';
const $=id=>document.getElementById(id),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const previewFit=createPreviewFit($('preview-scroll'),$('preview'),{fitVisual:fitViewport,zoomVisual:zoomViewport});
const previewFullscreen=createPreviewFullscreen($('preview-pane'),$('preview-fullscreen'),()=>previewFit.fit());
let current=examples.find(e=>e.id==='christmas-menu-flow'),platform=platforms.find(p=>p.id==='mermaid'),rendering=false,queued=false,renderedSource='',renderedPlatform='',timer,toastTimer;
const marks={plantuml:'PU',mermaid:'MM',graphviz:'GV',d2:'D2',vega:'VL',wavedrom:'WD',bpmn:'BP',drawio:'↗'};
const sourceLinks={plantuml:'https://github.com/plantuml/plantuml',mermaid:'https://github.com/mermaid-js/mermaid',graphviz:'https://github.com/mdaines/viz-js',d2:'https://github.com/d2lang/d2/tree/6a7b4837838a3907604a1d9eec57ee98b6f3cd01',vega:'https://github.com/vega',wavedrom:'https://github.com/wavedrom/wavedrom',bpmn:'https://github.com/bpmn-io/bpmn-js',drawio:'https://github.com/jgraph/drawio'};
function art(type){
 const text=(x,y,t)=>`<text x="${x}" y="${y}" font-size="9" font-family="Arial" fill="#698475" text-anchor="middle">${t}</text>`;
 let content='';
 if(/ArchiMate|Layered/.test(type))content='<rect x="55" y="6" width="185" height="20" rx="3" fill="#fff4bf" stroke="#d9c980"/><rect x="55" y="33" width="185" height="20" rx="3" fill="#dceeff" stroke="#9fbdda"/><rect x="55" y="60" width="185" height="20" rx="3" fill="#ddf4df" stroke="#a0caa7"/>'+text(147,20,'Business')+text(147,47,'Application')+text(147,74,'Technology');
 else if(/Sequence|Timing/.test(type))content='<path d="M65 22V76M145 22V76M225 22V76M65 36H145M145 53H225M225 68H65" stroke="#7aad94" stroke-width="1.5" fill="none"/>'+[65,145,225].map((x,i)=>`<rect x="${x-20}" y="8" width="40" height="18" rx="4" fill="white" stroke="#a2c9b4"/>`+text(x,20,['User','App','Data'][i])).join('');
 else if(/chart|Gantt|Timeline/.test(type))content='<path d="M48 15V74H255" stroke="#bad3c5" fill="none"/><rect x="73" y="39" width="30" height="35" rx="3" fill="#9dd2b8"/><rect x="130" y="22" width="30" height="52" rx="3" fill="#059669"/><rect x="187" y="47" width="30" height="27" rx="3" fill="#c9e7d6"/>';
 else content='<path d="M84 44H122M170 44H210" fill="none" stroke="#81b398" stroke-width="1.5"/><rect x="30" y="26" width="55" height="35" rx="6" fill="white" stroke="#b1cebd"/><rect x="122" y="20" width="49" height="48" rx="7" fill="#059669"/><rect x="210" y="26" width="55" height="35" rx="6" fill="white" stroke="#b1cebd"/>'+text(57,47,'Input')+text(237,47,'Outcome')+'<path d="M139 39h14m-14 7h14m-14 7h9" stroke="white" stroke-width="1.6"/>';
 return `<svg viewBox="0 0 295 85" aria-hidden="true">${content}</svg>`;
}
let browseMode='scenario';
function renderStory(){
 const selected=scenarioFor($('scenario-filter').value);$('scenario-story').hidden=browseMode!=='scenario'||!selected;
 document.querySelectorAll('#scenario-cards [data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenario===selected?.name)));
 if(!selected)return;
 const related=examples.filter(e=>e.scenario===selected.name),questions=new Map();for(const e of related.filter(e=>e.type!=='Threat model'))if(!questions.has(questionFor(e)))questions.set(questionFor(e),e);
 const threat=related.find(e=>e.type==='Threat model');if(threat){while(questions.size>8)questions.delete([...questions.keys()].at(-1));questions.set(questionFor(threat),threat);}
 $('scenario-story').innerHTML=`<div class="story-brief-main"><p class="eyebrow">THE SHARED STORY / ${esc(selected.kind)}</p><h3>${esc(selected.name)}</h3><p>${esc(selected.story)}</p><div class="story-people">${selected.people.map(p=>`<span>${esc(p)}</span>`).join('')}</div><ul>${selected.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></div><div class="story-questions"><h4>What would you like to understand?</h4>${[...questions].slice(0,9).map(([q,e])=>`<button data-example="${e.id}"><span>${esc(q)}</span><small>${esc(e.type)} · ${esc(platforms.find(p=>p.id===e.platform).name)} ↗</small></button>`).join('')}<p>Each view shows one part of this story. Explore the full collection below.</p></div>`;
}
function listExamples(){const rows=filterExamples(examples,{search:$('search').value,platform:$('platform-filter').value,type:$('type-filter').value,scenario:$('scenario-filter').value});$('example-count').textContent=`${rows.length} examples`;$('no-results').hidden=!!rows.length;
 $('example-grid').innerHTML=rows.map(e=>`<article class="example-card"><div class="card-art"><span class="card-type">${esc(e.type)}</span>${art(e.type)}</div><div class="card-body"><div class="card-platform">${esc(platforms.find(p=>p.id===e.platform).name)} · ${esc(e.scenario)}</div><h3>${esc(questionFor(e))}</h3><div class="example-view-title">${esc(e.title)}</div><p>${esc(e.purpose)}</p><p class="view-limit"><strong>Leaves out:</strong> ${esc(limitFor(e))}</p><div class="card-bottom"><span>${esc(e.level)}</span><button class="try-example" data-example="${e.id}">Explore this view ↗</button></div></div></article>`).join('');renderStory();
}
$('scenario-cards').innerHTML=scenarios.map(s=>`<button class="scenario-story" data-scenario="${esc(s.name)}" aria-pressed="false"><span>${esc(s.kind.toUpperCase())} / ${examples.filter(e=>e.scenario===s.name).length} VIEWS</span><strong>${esc(s.name)}</strong><small>${esc(s.summary)} →</small></button>`).join('');
function chooseScenario(name){$('search').value='';$('platform-filter').value='all';$('type-filter').value='all';$('scenario-filter').value=name;listExamples();}
function setBrowseMode(mode){browseMode=mode;document.querySelectorAll('[data-browse]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.browse===mode)));$('scenario-cards').hidden=mode!=='scenario';chooseScenario(mode==='scenario'?'Christmas dinner':'all');if(mode!=='scenario')$(mode==='type'?'type-filter':'platform-filter').focus();}
$('scenario-filter').innerHTML+=[...new Set(examples.map(e=>e.scenario))].sort().map(s=>`<option>${esc(s)}</option>`).join('');
$('platform-filter').innerHTML+=platforms.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('type-filter').innerHTML+=[...new Set(examples.map(e=>e.type))].sort().map(t=>`<option>${t}</option>`).join('');
$('play-platform').innerHTML=platforms.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
$('type-guide').innerHTML=typeGuide.map(row=>`<tr>${row.map(s=>`<td>${esc(s)}</td>`).join('')}</tr>`).join('');
$('platform-grid').innerHTML=platforms.map(p=>`<article class="platform-card"><div class="platform-mark" aria-hidden="true">${marks[p.id]}</div><h3>${p.name}</h3><div class="platform-tag">${p.tag}</div><p>${p.description}</p><ul>${p.strengths.map(s=>`<li>${s}</li>`).join('')}</ul><div class="links"><a href="${p.site}" target="_blank" rel="noopener">Home ↗</a><a href="${p.docs}" target="_blank" rel="noopener">Docs ↗</a></div><button class="button" data-platform="${p.id}">Try ${p.id==='drawio'?'the editor':p.name} →</button></article>`).join('');
$('credits-list').innerHTML=platforms.map(p=>`<div class="credit-row"><div><h3>${p.name}</h3><span class="version">${p.package?`${p.package} ${versions[p.package]}`:'Self-hosted upstream editor'}</span></div><div><p>${p.credit}</p><span class="version">${p.license}</span></div><div class="credit-links"><a href="${p.site}" target="_blank" rel="noopener">Project home ↗</a><a href="${sourceLinks[p.id]}" target="_blank" rel="noopener">Source & licence ↗</a></div></div>`).join('');
function notice(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function error(message){$('error').textContent=message;$('error').hidden=!message;}
function updateCount(){$('source-count').textContent=`${$('source').value.split('\n').length} lines · ${$('source').value.length.toLocaleString()} characters`;}
function selectExample(id,scroll=false){current=examples.find(e=>e.id===id)||examples[0];platform=platforms.find(p=>p.id===current.platform);$('view-context').innerHTML=`<div><span>${esc(current.scenario)}</span><strong>${esc(questionFor(current))}</strong><p>${esc(current.purpose)}</p></div><p><strong>This view leaves out:</strong> ${esc(limitFor(current))}</p>`;$('play-platform').value=platform.id;for(const id of ['zoom-in','zoom-out']){$(id).disabled=platform.id==='drawio';$(id).title=platform.id==='drawio'?'Use the diagrams.net toolbar to zoom':'Zoom relative to the fitted diagram';}document.querySelectorAll('.graphviz-extra').forEach(b=>b.hidden=platform.id!=='graphviz');$('play-example').innerHTML=examples.filter(e=>e.platform===platform.id).map(e=>`<option value="${e.id}">${esc(e.type)} — ${esc(e.title)}</option>`).join('');$('play-example').value=current.id;$('source').value=current.source;$('source-language').textContent=platform.language;$('platform-note').textContent=platform.note;$('platform-docs').href=platform.docs;updateCount();previewFit.fit();error('');runRender();if(scroll)$('playground').scrollIntoView({behavior:'smooth'});}
function applyFont(){const font=$('font').value;if(font)$('preview').querySelectorAll('svg text,svg tspan,svg foreignObject div').forEach(el=>el.style.fontFamily=font);}
async function runRender(){
 if(rendering){queued=true;return;}rendering=true;queued=false;const s=$('source').value,p=platform.id;
 $('render').disabled=true;$('render-status').textContent='Rendering on your device…';error('');const began=performance.now();
 try{if(s.length>150000)throw new Error('Please keep diagrams below 150,000 characters.');$('preview').classList.remove('visual-preview');
 await render(p,s,$('preview'),xml=>{if(platform.id===p){$('source').value=xml;renderedSource=xml;updateCount();}});
 renderedSource=s;renderedPlatform=p;applyFont();previewFit.fit();$('render-status').textContent=`${platforms.find(x=>x.id===p).name} · ${Math.round(performance.now()-began)} ms · ready`;
 }catch(e){renderedSource='';renderedPlatform='';error(e.message||String(e));$('render-status').textContent='Check the source and try again';}
 finally{rendering=false;$('render').disabled=false;if(queued)runRender();}
}
async function copy(text){if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();}}
function project(){return {version:1,platform:platform.id,example:current.id,source:$('source').value,font:$('font').value,background:$('background').value};}
function restore(data){if(data.version!==1||!platforms.some(p=>p.id===data.platform)||typeof data.source!=='string'||data.source.length>150000)throw new Error('This is not a supported Architecture Lab project.');selectExample(examples.find(e=>e.id===data.example&&e.platform===data.platform)?.id||examples.find(e=>e.platform===data.platform).id);$('source').value=data.source;if([...$('font').options].some(o=>o.value===data.font))$('font').value=data.font;if(/^#[a-f0-9]{6}$/i.test(data.background||''))$('background').value=data.background;updateCount();runRender();}
let activeDownloadUrl;let activeDownloadFile;
function download(data,name,type){
 const blob=data instanceof Blob?data:new Blob([data],{type});
 if(activeDownloadUrl)URL.revokeObjectURL(activeDownloadUrl);
 activeDownloadUrl=URL.createObjectURL(blob);activeDownloadFile=new File([blob],name,{type:blob.type||type});
 const link=$('download-file');link.href=activeDownloadUrl;link.download=name;link.textContent='Download '+name;
 $('export-result').hidden=false;$('export-file-info').textContent=`Ready: ${name} · ${Math.max(1,Math.round(blob.size/1024))} KB. If the download does not start, use the link below.`;
 $('share-file').hidden=!(navigator.canShare?.({files:[activeDownloadFile]}));
 // Keep a direct user-activated link alive for Safari and embedded browsers.
 // Do not revoke the blob URL after five seconds; it belongs to the result panel.
 link.click();
}
$('share-file').addEventListener('click',async()=>{if(!activeDownloadFile)return;try{await navigator.share({files:[activeDownloadFile],title:activeDownloadFile.name});}catch(e){if(e.name!=='AbortError')error('Could not open the save/share sheet. Use the download link instead.');}});
window.addEventListener('pagehide',()=>{if(activeDownloadUrl)URL.revokeObjectURL(activeDownloadUrl);});
async function preparedSVG(){
 if(rendering)throw new Error('Wait for the diagram to finish rendering.');if(renderedPlatform!==platform.id||renderedSource!==$('source').value){await runRender();if(renderedPlatform!==platform.id||!renderedSource)throw new Error('Fix the diagram before exporting.');}
 let source=await exportSVG($('preview'));const mount=document.createElement('div');mount.style.cssText='position:fixed;left:-20000px;top:0;width:1600px';mount.innerHTML=cleanSVG(source);document.body.append(mount);
 try{const svg=mount.querySelector('svg');if(!svg)throw new Error('The editor has not produced a diagram yet.');const font=$('font').value;if(font)svg.querySelectorAll('text,tspan,foreignObject div').forEach(e=>e.style.fontFamily=font);
 for(const el of svg.querySelectorAll('[href],[xlink\\:href]')){const href=el.getAttribute('href')||el.getAttribute('xlink:href');if(href&&!href.startsWith('#')&&!href.startsWith('data:image/'))throw new Error('Remove external image or font references before exporting.');}
 const vb=svg.viewBox.baseVal;if(!vb.width)svg.setAttribute('viewBox',`0 0 ${parseFloat(svg.getAttribute('width'))||800} ${parseFloat(svg.getAttribute('height'))||500}`);
 const snapshot=styledSnapshot(svg);snapshot.style.cssText='';snapshot.setAttribute('width',svg.viewBox.baseVal.width);snapshot.setAttribute('height',svg.viewBox.baseVal.height);return new XMLSerializer().serializeToString(snapshot);
 }finally{mount.remove();}
}
const htmlDoc=svg=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(current.title)}</title><style>body{font-family:Arial,sans-serif;margin:35px;color:#111827;background:${$('background').value}}h1{font-size:24px}svg{max-width:100%;height:auto}p{color:#64748b;font-size:12px}@media print{button{display:none}}</style></head><body><h1>${esc(current.title)}</h1>${svg}<p>${esc(platform.name)} — ${esc(platform.credit)}. Example by Mightora / Ian Tweedie. <a href="${platform.site}">Project home</a></p></body></html>`;
async function doExport(format,button){button.disabled=true;error('');try{
 const name=current.id;
 if(['plain','dot_json','xdot','eps'].includes(format)){const output=await graphvizExport($('source').value,format);download(output,`${name}.${{plain:'txt',dot_json:'graph.json',xdot:'xdot',eps:'eps'}[format]}`,'text/plain');return;}
 if(format==='source'){download($('source').value,`${name}.${platform.ext}`,'text/plain');return;}
 if(format==='json'){download(JSON.stringify(project(),null,2),`${name}.architecture.json`,'application/json');return;}
 // Open the print window synchronously to avoid popup blockers during asynchronous rendering.
 const printWindow=format==='pdf'?window.open('about:blank','_blank'):null;if(format==='pdf'&&!printWindow)throw new Error('Allow the print window to open, then try again.');
 let svg;try{svg=await preparedSVG();}catch(e){printWindow?.close();throw e;}
 if(format==='svg'){download(svg,`${name}.svg`,'image/svg+xml');return;}
 if(format==='html'){download(htmlDoc(svg),`${name}.html`,'text/html');return;}
 if(format==='pdf'){printWindow.document.open();printWindow.document.write(htmlDoc(svg));printWindow.document.close();let printed=false;const printOnce=()=>{if(!printed&&!printWindow.closed){printed=true;printWindow.print();}};printWindow.addEventListener('load',printOnce,{once:true});setTimeout(printOnce,500);return;}
 if(format==='png'){const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),root=doc.documentElement,v=root.getAttribute('viewBox').split(/[ ,]+/).map(Number),ratio=Number($('resolution').value),w=Math.ceil(v[2]*ratio),h=Math.ceil(v[3]*ratio);if(w*h>40000000)throw new Error('The PNG is too large. Choose a lower resolution.');const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('The browser could not rasterise this SVG. Try downloading SVG instead.'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle=$('background').value;ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG creation failed.');download(blob,`${name}.png`,'image/png');}finally{URL.revokeObjectURL(url);}return;}
 const model=await svgToModel(svg),meta={title:current.title,purpose:current.purpose,platform:platform.name,credit:platform.credit,site:platform.site};if(format==='pptx')download(powerpoint(model,meta),`${name}.pptx`,'application/vnd.openxmlformats-officedocument.presentationml.presentation');else download(word(model,meta,$('source').value),`${name}.docx`,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');notice(`Exported ${model.shapes.length} editable shapes and text boxes.`);
 }catch(e){error(e.message||String(e));}finally{button.disabled=false;}}
$('archimate').addEventListener('click',e=>{const button=e.target.closest('[data-example]');if(button)selectExample(button.dataset.example,true);});
$('example-grid').addEventListener('click',e=>{const button=e.target.closest('[data-example]');if(button)selectExample(button.dataset.example,true);});$('platform-grid').addEventListener('click',e=>{const b=e.target.closest('[data-platform]');if(b)selectExample(examples.find(e=>e.platform===b.dataset.platform).id,true);});
['search','scenario-filter','platform-filter','type-filter'].forEach(id=>$(id).addEventListener('input',listExamples));
$('scenario-cards').addEventListener('click',e=>{const b=e.target.closest('[data-scenario]');if(b){chooseScenario(b.dataset.scenario);$('scenario-story').scrollIntoView({behavior:'smooth',block:'start'});}});
$('scenario-story').addEventListener('click',e=>{const b=e.target.closest('[data-example]');if(b)selectExample(b.dataset.example,true);});
document.querySelectorAll('[data-browse]').forEach(b=>b.addEventListener('click',()=>setBrowseMode(b.dataset.browse)));
$('play-platform').addEventListener('change',()=>selectExample(examples.find(e=>e.platform===$('play-platform').value).id));$('play-example').addEventListener('change',()=>selectExample($('play-example').value));$('reset').addEventListener('click',()=>selectExample(current.id));$('render').addEventListener('click',runRender);
$('source').addEventListener('input',()=>{updateCount();$('render-status').textContent='Source changed · render to update';if($('auto-render').checked){clearTimeout(timer);timer=setTimeout(runRender,800);}});$('auto-render').addEventListener('change',()=>{if($('auto-render').checked)runRender();});
$('source').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.target,s=t.selectionStart;t.setRangeText('  ',s,t.selectionEnd,'end');t.dispatchEvent(new Event('input'));}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runRender();}});
$('font').addEventListener('change',()=>{if($('font').value){applyFont();previewFit.update();}else runRender();});
$('copy-source').addEventListener('click',async()=>{try{await copy($('source').value);notice('Source copied.');}catch{error('Your browser blocked clipboard access. Select the source to copy it.');}});
$('share').addEventListener('click',async()=>{try{const data=deflateSync(strToU8(JSON.stringify(project()))),encoded=btoa(String.fromCharCode(...data)).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''),url=location.origin+location.pathname+'#project='+encoded;if(url.length>28000)throw new Error('This diagram is too large for a reliable share link. Export Project JSON instead.');await copy(url);notice('Share link copied. Anyone with the link can read the diagram source.');}catch(e){error(e.message);}});
$('save-local').addEventListener('click',()=>{try{localStorage.setItem('mightora-architecture-project',JSON.stringify(project()));notice('Saved on this device.');}catch{error('Your browser could not save this project. Download Project JSON instead.');}});$('load-local').addEventListener('click',()=>{try{const data=localStorage.getItem('mightora-architecture-project');if(!data)throw new Error('No saved project on this device yet.');restore(JSON.parse(data));notice('Saved project restored.');}catch(e){error(e.message);}});
$('import-file').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>300000)throw new Error('Please import a file smaller than 300 KB.');const source=await f.text();if(f.name.endsWith('.architecture.json'))restore(JSON.parse(source));else{const ext=f.name.split('.').pop().toLowerCase(),id={puml:'plantuml',plantuml:'plantuml',mmd:'mermaid',dot:'graphviz',d2:'d2',bpmn:'bpmn',drawio:'drawio'}[ext];if(id)selectExample(examples.find(e=>e.platform===id).id);$('source').value=source;updateCount();runRender();}notice('File imported.');}catch(e){error(e.message);}finally{e.target.value='';}});
$('zoom-in').addEventListener('click',()=>previewFit.zoomBy(.2));$('zoom-out').addEventListener('click',()=>previewFit.zoomBy(-.2));$('zoom-reset').addEventListener('click',()=>{previewFit.fit();});
document.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>doExport(b.dataset.export,b)));
$('scenario-filter').value='Christmas dinner';
const sharedScenario=scenarios.find(s=>s.id===new URLSearchParams(location.search).get('scenario'));if(sharedScenario){$('scenario-filter').value=sharedScenario.name;current=examples.find(e=>e.id===sharedScenario.start);}
listExamples();selectExample(current.id);
if(location.hash.startsWith('#project=')){try{let data=location.hash.slice(9).replaceAll('-','+').replaceAll('_','/');data+='='.repeat((4-data.length%4)%4);const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));restore(JSON.parse(strFromU8(inflateSync(bytes))));$('playground').scrollIntoView();}catch(e){error('Could not open the shared project: '+e.message);}}

initMarkdownTool();
