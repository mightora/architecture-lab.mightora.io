import DOMPurify from 'dompurify';
import {parseMarkdown,markdownWord,validateDiagramSource} from './markdown-docx.js';
import {createRenderer,cleanSVG} from './renderers.js';
import {svgToModel,styledSnapshot} from './svg-model.js';
import {platforms,examples} from './catalogue.js';
export const markdownSample=`# Christmas dinner plan

A shared plan for the **Host**, family and guests.

## What we need to agree

- Confirm who is coming.
- Check dietary needs.
- Share the cooking jobs.

| Job | Owner |
| --- | --- |
| Main meal | Host |
| Dessert | Guest |

## The preparation process

\`\`\`mermaid
flowchart TD
  A[Confirm guests] --> B[Agree the menu]
  B --> C[Shop for ingredients]
  C --> D[Prepare and serve]
\`\`\`

## Who helps?

\`\`\`dot
digraph dinner {
  rankdir=TB;
  Host -> Kitchen [label="prepares"];
  Guest -> Dessert [label="brings"];
  Kitchen -> Dinner;
  Dessert -> Dinner;
}
\`\`\`

> Use one view for each question. Change the story to suit your family.
`;
export function initMarkdownTool(){
 const $=id=>document.getElementById(id);if(!$('markdown-input'))return;
 const engine=createRenderer();let busy=false,url,prepared,results=new Map(),lastSource='',lastInclude;
 $('markdown-input').value=markdownSample;
 const status=text=>$('markdown-status').textContent=text;
 function invalidate(){prepared=null;$('markdown-download').hidden=true;if(url){URL.revokeObjectURL(url);url=null;}}
 function settingsLocked(value){busy=value;for(const id of ['markdown-preview-button','markdown-export','markdown-sample','markdown-file','markdown-add-diagram','markdown-language','markdown-input','markdown-source-option'])$(id).disabled=value;}
 function report(entries){const list=$('markdown-report');list.replaceChildren();for(const message of entries){const li=document.createElement('li');li.textContent=message;list.append(li);}}
 async function convert(){
  const source=$('markdown-input').value;if(!source.trim())throw new Error('Paste Markdown or load the example first.');
  invalidate();lastSource=source;lastInclude=$('markdown-source-option').checked;
  const parsed=parseMarkdown(source);$('markdown-preview').innerHTML=DOMPurify.sanitize(parsed.html,{FORBID_TAGS:['img','iframe','script','style','object','embed'],FORBID_ATTR:['style']});
  results=new Map();const notes=[];let converted=0;
  const mount=document.createElement('div');mount.className='markdown-render-stage';document.body.append(mount);
  try{
   for(const diagram of parsed.diagrams){
    status(`Rendering diagram ${diagram.id+1} of ${parsed.diagrams.length} (${diagram.language})…`);
    const slot=$('markdown-preview').querySelector(`[data-markdown-diagram="${diagram.id}"] .md-diagram-output`);
    try{
     validateDiagramSource(diagram);
     mount.replaceChildren();mount.classList.remove('visual-preview');
     let svg;
     if(diagram.platform==='svg')svg=cleanSVG(diagram.source);
     else {let source=diagram.source;if(diagram.platform==='plantuml'&&!/^\s*@start/m.test(source))source='@startuml\n'+source+'\n@enduml';await engine.render(diagram.platform,source,mount,()=>{});svg=await engine.exportSVG(mount);}
     // Resolve appearance before measuring native editable geometry.
     const snapshot=document.createElement('div');snapshot.innerHTML=cleanSVG(svg);mount.append(snapshot);const root=snapshot.querySelector('svg');if(!root)throw new Error('No SVG diagram was returned.');
     if(!root.getAttribute('viewBox'))root.setAttribute('viewBox',`0 0 ${parseFloat(root.getAttribute('width'))||800} ${parseFloat(root.getAttribute('height'))||500}`);
     root.style.width='100%';root.style.height='auto';
     const styled=new XMLSerializer().serializeToString(styledSnapshot(root));const model=await svgToModel(styled);
     const platform=platforms.find(p=>p.id===diagram.platform);const credit=platform?`${platform.name} · ${platform.credit} · ${platform.site}`:'SVG · supplied by the document author';
     results.set(diagram.id,{model,credit});slot.innerHTML=cleanSVG(styled);converted++;notes.push(`Diagram ${diagram.id+1}: ${diagram.language} converted to editable Word shapes and text.`);
    }catch(e){results.set(diagram.id,{error:e.message});slot.replaceChildren();const error=document.createElement('p');error.textContent=e.message;const pre=document.createElement('pre');pre.textContent=diagram.source;slot.append(error,pre);notes.push(`Diagram ${diagram.id+1}: ${e.message} Its source is retained in Word.`);}
   }
   if(/!\[/.test(source))notes.push('Markdown images are represented by editable alt-text placeholders; remote images are not fetched.');
   if(/<\/?[a-z][^>]*>/i.test(source))notes.push('Raw HTML is preserved as text; it is not executed.');
   prepared=markdownWord(parsed,results,{includeSource:lastInclude,title:parsed.tokens.find(t=>t.type==='heading')?.text||$('markdown-name').value||'Markdown document'});
   report(notes.length?notes:['Text document converted. No diagram fences were found.']);
   status(`Ready: ${converted} of ${parsed.diagrams.length} diagrams converted. ${parsed.diagrams.length-converted} retained as source. Text, tables and code remain editable.`);
  }finally{engine.dispose();mount.remove();}
 }
 async function run(download){if(busy)return;settingsLocked(true);try{if(!prepared||lastSource!==$('markdown-input').value||lastInclude!==$('markdown-source-option').checked)await convert();if(download){if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([prepared],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));const link=$('markdown-download');link.href=url;link.download=($('markdown-name').value||'document').replace(/[^a-z0-9 _-]/gi,'').trim().slice(0,80)+'.docx';link.hidden=false;link.click();}}catch(e){invalidate();status('Conversion failed: '+e.message);}finally{settingsLocked(false);}}
 $('markdown-preview-button').addEventListener('click',()=>run(false));$('markdown-export').addEventListener('click',()=>run(true));
 $('markdown-input').addEventListener('input',invalidate);$('markdown-source-option').addEventListener('change',invalidate);
 $('markdown-file').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>600000)throw new Error('Upload a Markdown file smaller than 600 KB.');$('markdown-input').value=await file.text();$('markdown-name').value=file.name.replace(/\.[^.]+$/,'');invalidate();status('File loaded on this device. Preview or export when ready.');}catch(e){status(e.message);}finally{event.target.value='';}});
 $('markdown-sample').addEventListener('click',()=>{$('markdown-input').value=markdownSample;invalidate();status('Christmas dinner example loaded.');});
 for(const platform of platforms){const o=document.createElement('option');o.value=platform.id;o.textContent=platform.name;$('markdown-language').append(o);}const o=document.createElement('option');o.value='svg';o.textContent='SVG';$('markdown-language').append(o);
 $('markdown-add-diagram').addEventListener('click',()=>{const id=$('markdown-language').value;const source=id==='svg'?'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect x="10" y="10" width="280" height="80" fill="#ecfdf5" stroke="#059669"/><text x="30" y="55" font-size="20">Your diagram</text></svg>':examples.find(e=>e.platform===id).source;const lang={graphviz:'dot',vega:'vega-lite'}[id]||id;$('markdown-input').value+='\n\n```'+lang+'\n'+source+'\n```\n';invalidate();status(lang+' diagram example added.');});
 window.addEventListener('pagehide',()=>{engine.dispose();if(url)URL.revokeObjectURL(url);});
}
