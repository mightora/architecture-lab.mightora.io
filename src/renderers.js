import DOMPurify from 'dompurify';
import { rendererAssetUrl } from './renderer-assets.js';
const base=rendererAssetUrl('',import.meta.env.BASE_URL,document.baseURI);
const scripts=new Map();
const script=url=>{if(!scripts.has(url))scripts.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>{scripts.delete(url);s.remove();reject(new Error('Could not load the local renderer. Please reload.'));};document.head.append(s);}));return scripts.get(url);};
export function cleanSVG(source){return DOMPurify.sanitize(source,{USE_PROFILES:{svg:true,svgFilters:true},ADD_TAGS:['foreignObject','div','span','p','br'],ADD_ATTR:['xmlns','xmlns:xlink'],FORBID_TAGS:['script','iframe','audio','video'],FORBID_ATTR:['onload','onclick','onerror']});}
function localOnly(source){if(/!include|!import|https?:\/\/|file:\/\//i.test(source))throw new Error('Use self-contained diagram source here. Remote includes, links and images are disabled so diagram rendering stays local.');}
let plant, viz, d2, bpmn, vegaView, drawioFrame, drawioListener;
export async function render(platform,source,target,onSource){
 if(bpmn){bpmn.destroy();bpmn=null;}
 if(vegaView){vegaView.finalize();vegaView=null;}
 if(drawioListener){window.removeEventListener('message',drawioListener);drawioListener=null;drawioFrame=null;}
 target.replaceChildren();
 let svg='';
 if(platform==='plantuml'){
  localOnly(source);source=source.replace('@startuml','@startuml\nskinparam shadowing false');await script(base+'vendor/plantuml/viz-global.js');
  plant ||= await import(/* @vite-ignore */base+'vendor/plantuml/plantuml.js');
  svg=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('The PlantUML render took too long. Try a smaller diagram.')),25000);plant.renderToString(source.split('\n'),s=>{clearTimeout(timer);resolve(s);},error=>{clearTimeout(timer);reject(new Error(error));});});
 }else if(platform==='mermaid'){
  const {default:mermaid}=await import('mermaid');
  mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',themeVariables:{primaryColor:'#ecfdf5',primaryTextColor:'#111827',primaryBorderColor:'#059669',lineColor:'#64748b',fontFamily:'Arial'},flowchart:{htmlLabels:false},sequence:{useMaxWidth:false},suppressErrorRendering:true});
  svg=(await mermaid.render('m'+crypto.randomUUID().replaceAll('-',''),source)).svg;
 }else if(platform==='graphviz'){
  localOnly(source);viz ||= await (await import('@viz-js/viz')).instance();svg=viz.renderString(source,{format:'svg'});
 }else if(platform==='d2'){
  localOnly(source);const {D2}=await import(/* @vite-ignore */base+'vendor/d2/index.js');d2 ||= new D2();
  const result=await d2.compile(source);svg=await d2.render(result.diagram,{...result.renderOptions,pad:30});
 }else if(platform==='vega'){
  const spec=JSON.parse(source);const inspect=o=>{if(!o||typeof o!=='object')return;for(const [key,value]of Object.entries(o)){if(['url','href'].includes(key))throw new Error('Use embedded values rather than external URLs in this playground.');inspect(value);}};inspect(spec);
  const {default:embed}=await import('vega-embed');vegaView=await embed(target,spec,{renderer:'svg',actions:false,loader:{load:()=>Promise.reject(new Error('Remote data loading is disabled.'))}});return;
 }else if(platform==='wavedrom'){
  await script(base+'vendor/wavedrom/default.js');await script(base+'vendor/wavedrom/wavedrom.min.js');const spec=JSON.parse(source);
  const div=document.createElement('div');div.id='WaveDrom_Display_0';target.append(div);window.WaveDrom.RenderWaveForm(0,spec,'WaveDrom_Display_');return;
 }else if(platform==='bpmn'){
  const {default:Modeler}=await import('bpmn-js/lib/Modeler');await import('bpmn-js/dist/assets/diagram-js.css');await import('bpmn-js/dist/assets/bpmn-font/css/bpmn.css');
  target.classList.add('visual-preview');bpmn=new Modeler({container:target});await bpmn.importXML(source);bpmn.get('canvas').zoom('fit-viewport');
  bpmn.on('commandStack.changed',async()=>{const {xml}=await bpmn.saveXML({format:true});onSource(xml);});return;
 }else if(platform==='drawio'){
  target.classList.add('visual-preview');drawioFrame=document.createElement('iframe');drawioFrame.title='Self-hosted diagrams.net playground';drawioFrame.className='drawio-frame';
  const u=base+'vendor/drawio/index.html?embed=1&proto=json&offline=1&local=1&spin=1&ui=kennedy&libraries=0&saveAndExit=0&noSaveBtn=1&noExitBtn=1&lang=en';
  drawioFrame.src=u;drawioListener=event=>{if(event.origin!==location.origin||event.source!==drawioFrame?.contentWindow)return;let data;try{data=JSON.parse(event.data);}catch{return;}
   if(data.event==='init')drawioFrame.contentWindow.postMessage(JSON.stringify({action:'load',xml:source,autosave:1}),location.origin);
   if(data.event==='autosave'||data.event==='save')onSource(data.xml);
  };window.addEventListener('message',drawioListener);target.append(drawioFrame);return;
 }
 target.classList.remove('visual-preview');target.innerHTML=cleanSVG(svg);
 const root=target.querySelector('svg');if(!root)throw new Error('The renderer did not return an SVG diagram.');
 root.removeAttribute('style');if(!root.getAttribute('viewBox')){const w=parseFloat(root.getAttribute('width')),h=parseFloat(root.getAttribute('height'));if(w&&h)root.setAttribute('viewBox',`0 0 ${w} ${h}`);}
 root.style.maxWidth='100%';root.style.height='auto';
}
export async function exportSVG(target){
 if(bpmn){const {svg}=await bpmn.saveSVG();return cleanSVG(svg);}
 if(drawioFrame){return new Promise((resolve,reject)=>{const frame=drawioFrame;const timer=setTimeout(()=>{window.removeEventListener('message',handler);reject(new Error('The visual editor is still loading. Try again in a moment.'));},15000);const handler=e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;let d;try{d=JSON.parse(e.data);}catch{return;}if(d.event==='export'){clearTimeout(timer);window.removeEventListener('message',handler);const raw=d.data.split(',')[1];if(!raw)return reject(new Error('No diagram returned by the editor.'));resolve(cleanSVG(new TextDecoder().decode(Uint8Array.from(atob(raw),c=>c.charCodeAt(0)))));}};window.addEventListener('message',handler);frame.contentWindow.postMessage(JSON.stringify({action:'export',format:'svg',embedImages:false,transparent:false}),location.origin);});}
 const svg=target.querySelector('svg');if(!svg)throw new Error('Render a diagram before exporting.');return new XMLSerializer().serializeToString(svg);
}

export async function graphvizExport(source,format){localOnly(source);viz ||= await (await import('@viz-js/viz')).instance();return viz.renderString(source,{format});}
