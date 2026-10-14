import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createMarkdownEditor,assertVisualContent} from '../src/markdown-editor.js';
const dom=new JSDOM('<div id="pane"><button id="md">Markdown</button><button id="visual">Visual</button><button id="full">Full screen</button><textarea id="source"></textarea><div id="host" hidden></div></div>');const d=dom.window.document;
const source=d.getElementById('source'),host=d.getElementById('host');let current,changes=0,message='';
class Editor{constructor(options){this.options=options;this.md='';current=this;}getMarkdown(){return this.md;}setMarkdown(md){this.md=md.replaceAll('\r\n','\n');this.options.events.change();}setHeight(){}destroy(){}}
const controller=createMarkdownEditor({source,host,markdownButton:d.getElementById('md'),visualButton:d.getElementById('visual'),fullscreenButton:d.getElementById('full'),pane:d.getElementById('pane'),onChange:()=>changes++,status:s=>message=s,loadEditor:async()=>Editor});
const original='# Title\r\n\r\n```mermaid\r\ngraph TD; A-->B\r\n```\r\n';source.value=original;const inputOriginal=source.value;await controller.setMode('visual');assert.equal(controller.mode(),'visual');assert.equal(host.hidden,false);assert.equal(source.hidden,true);assert.equal(current.options.usageStatistics,false);assert.equal(current.options.initialEditType,'wysiwyg');assert.equal(current.options.hooks.addImageBlobHook(),false);
await controller.setMode('markdown');assert.equal(source.value,inputOriginal,'Switching views without editing preserves the exact textarea source');
await controller.setMode('visual');current.md+='\n\n**Edited content**';current.options.events.change();assert(changes>0);assert(source.value.includes('Edited content'));await controller.setMode('markdown');assert(source.value.includes('```mermaid'));
controller.setLocked(true);await controller.setMode('visual');assert.equal(controller.mode(),'markdown');controller.setLocked(false);
source.value='![Private](https://example.test/file)';await controller.setMode('visual');assert.equal(controller.mode(),'markdown');assert(message.includes('Images and raw HTML'));assert.throws(()=>assertVisualContent('<img src="//example.test/private">'));
for(const language of ['mermaid','plantuml','d2','dot','vega-lite','wavedrom','bpmn','drawio','svg'])assertVisualContent('```'+language+'\n<xml xmlns="http://example.test">diagram</xml>\n```');
controller.dispose();dom.window.close();console.log('Visual editor controls: mode switching, exact unedited source, edited content synchronization, diagram fences, disabled telemetry, conversion locking and embedded-resource guard passed.');
