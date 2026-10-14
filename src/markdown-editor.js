import DOMPurify from 'dompurify';
import {marked} from 'marked';
import {createPreviewFullscreen} from './preview-fullscreen.js';
export async function loadVisualEditor(){
 const [{default:Editor}]=await Promise.all([import('@toast-ui/editor'),import('@toast-ui/editor/dist/toastui-editor.css')]);return Editor;
}
export function assertVisualContent(source){let unsupported=false;marked.walkTokens(marked.lexer(source),token=>{if(['image','html'].includes(token.type))unsupported=true;});if(unsupported)throw new Error('Images and raw HTML stay in Markdown mode to prevent embedded resources loading in the visual editor. Diagram code blocks are supported.');}
export function createMarkdownEditor({source,host,markdownButton,visualButton,fullscreenButton,pane,onChange,status,loadEditor=loadVisualEditor}){
 let editor,mode='markdown',raw='',baseline='',switching=false,loading=false,locked=false;
 const sanitize=html=>DOMPurify.sanitize(html,{FORBID_TAGS:['img','iframe','script','style','object','embed','audio','video','form','input'],FORBID_ATTR:['srcset']});
 function sync(){if(mode==='visual'&&editor){const markdown=editor.getMarkdown();source.value=markdown===baseline?raw:markdown;}}
 function refresh(){if(mode==='visual'&&editor){try{assertVisualContent(source.value);}catch(e){mode='markdown';controls();status(e.message);return;}raw=source.value;switching=true;try{editor.setMarkdown(raw,false);baseline=editor.getMarkdown();}finally{switching=false;}}}
 function resize(){editor?.setHeight(Math.max(300,host.clientHeight||560)+'px');}
 function controls(){markdownButton.disabled=locked||loading;visualButton.disabled=locked||loading;host.inert=locked;markdownButton.setAttribute('aria-selected',String(mode==='markdown'));visualButton.setAttribute('aria-selected',String(mode==='visual'));source.hidden=mode==='visual';host.hidden=mode!=='visual';}
 async function setMode(next){if(locked||loading||next===mode)return;if(next==='markdown'){sync();mode=next;controls();source.focus();return;}
  try{assertVisualContent(source.value);}catch(e){status(e.message);return;}
  loading=true;controls();status('Loading visual editor on this device…');try{
   if(!editor){const Editor=await loadEditor();switching=true;try{editor=new Editor({el:host,height:'560px',initialEditType:'wysiwyg',hideModeSwitch:true,usageStatistics:false,autofocus:false,hooks:{addImageBlobHook:()=>false},initialValue:'',customHTMLSanitizer:sanitize,toolbarItems:[['heading','bold','italic','strike'],['hr','quote'],['ul','ol','task'],['table','link'],['code','codeblock']],events:{change:()=>{if(!switching&&mode==='visual'){sync();onChange();}}}});}finally{switching=false;}}
   mode='visual';refresh();status('Visual editor ready. Diagram fences remain editable code blocks. Use Markdown for exact source editing.');
  }catch(e){mode='markdown';status('Could not load the visual editor: '+e.message+'. Markdown editing is still available.');}finally{loading=false;controls();resize();}
 }
 markdownButton.addEventListener('click',()=>setMode('markdown'));visualButton.addEventListener('click',()=>setMode('visual'));
 const fullscreen=createPreviewFullscreen(pane,fullscreenButton,resize,{label:'Full-screen Markdown document editor'});
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(host);
 controls();return {sync,refresh,setMode,mode:()=>mode,setLocked(value){locked=value;controls();},dispose(){observer?.disconnect();fullscreen.dispose();editor?.destroy();}};
}
