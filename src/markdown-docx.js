import {marked,Renderer} from 'marked';
import {zipSync,strToU8} from 'fflate';
import {nativeWordDrawing} from './office.js';
export const diagramLanguages={mermaid:'mermaid',mmd:'mermaid',plantuml:'plantuml',puml:'plantuml',uml:'plantuml',d2:'d2',dot:'graphviz',graphviz:'graphviz',vega:'vega','vega-lite':'vega',vegalite:'vega',wavedrom:'wavedrom',bpmn:'bpmn',drawio:'drawio','diagrams.net':'drawio',svg:'svg'};
export const escapeXML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const xml=s=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+s;
export function validateDiagramSource(diagram){
 const inspect=diagram.source.replace(/\s(?:xmlns(?::[\w.-]+)?|targetNamespace)\s*=\s*["'][^"']*["']/gi,'').replace(/"\$schema"\s*:\s*"[^"']*"/gi,'');
 if(/https?:\/\/|file:\/\/|data:(?:image|font|text|application)[/;]|@import|!include|!import|<!DOCTYPE|<!ENTITY|<image\b|<img\b/i.test(inspect))throw new Error('External resources and bitmap images are disabled. Use self-contained source.');
 if(/\burl\s*\(\s*["']?\s*(?![#"'\s])|(?:href|src|image|icon)\s*[:=]\s*["']?\s*\/\//i.test(inspect))throw new Error('External resource URLs are disabled.');
 if(diagram.platform==='drawio'&&/<diagram\b/i.test(inspect)&&!/<mxGraphModel\b/i.test(inspect))throw new Error('Use uncompressed diagrams.net XML so external resources can be checked.');
}
export const MARKDOWN_LIMITS={characters:2000000,diagrams:200,diagramCharacters:100000};
export function parseMarkdown(source){
 if(source.length>MARKDOWN_LIMITS.characters)throw new Error('Use a Markdown document smaller than 2,000,000 characters.');
 const tokens=marked.lexer(source,{gfm:true}),diagrams=[];
 marked.walkTokens(tokens,t=>{if(t.type==='code'){const language=(t.lang||'').trim().split(/\s/)[0].toLowerCase(),platform=Object.hasOwn(diagramLanguages,language)?diagramLanguages[language]:undefined;if(platform){if(t.text.length>MARKDOWN_LIMITS.diagramCharacters)throw new Error('A diagram block exceeds 100,000 characters.');t.diagramId=diagrams.length;diagrams.push({id:t.diagramId,language,platform,source:t.text});}}});
 if(diagrams.length>MARKDOWN_LIMITS.diagrams)throw new Error('Convert up to 200 diagrams per document. Split larger documents into parts.');
 const renderer=new Renderer();renderer.code=t=>t.diagramId!==undefined?`<figure data-markdown-diagram="${t.diagramId}"><figcaption>${escapeXML(t.lang)} diagram</figcaption><div class="md-diagram-output">Waiting to render…</div></figure>`:`<pre><code>${escapeXML(t.text)}</code></pre>`;
 renderer.image=t=>`<span>[Image: ${escapeXML(t.text||'no description')} — images are not fetched]</span>`;
 renderer.html=t=>`<pre>${escapeXML(t.text)}</pre>`;
 return {tokens,diagrams,html:marked.parser(tokens,{renderer,gfm:true})};
}
export function markdownWord(parsed,results,{includeSource=false,title='Markdown document'}={}){
 const x=escapeXML,relationships=[],numberings=[];let nextRelationship=3,nextNumber=1;
 const run=(text,f={})=>`<w:r><w:rPr>${f.bold?'<w:b/>':''}${f.italic?'<w:i/>':''}${f.strike?'<w:strike/>':''}${f.code?'<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:shd w:fill="F1F5F9"/>':''}${f.link?'<w:color w:val="047857"/><w:u w:val="single"/>':''}</w:rPr><w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
 const inline=(ts=[],f={})=>ts.map(t=>{
  if(t.type==='strong'||t.type==='em'||t.type==='del')return inline(t.tokens,{...f,[{strong:'bold',em:'italic',del:'strike'}[t.type]]:true});
  if(t.type==='br')return '<w:r><w:br/></w:r>';
  if(t.type==='codespan')return run(t.text,{...f,code:true});
  if(t.type==='image')return run(`[Image: ${t.text||'no description'} — images are not fetched]`,f);
  if(t.type==='link'){if(!/^(https?:|mailto:)/i.test(t.href))return inline(t.tokens,f);const id='rId'+nextRelationship++;relationships.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${x(t.href)}" TargetMode="External"/>`);return `<w:hyperlink r:id="${id}">${inline(t.tokens,{...f,link:true})}</w:hyperlink>`;}
  return t.tokens?inline(t.tokens,f):run(t.text??t.raw??'',f);
 }).join('');
 const p=(content,properties='')=>`<w:p><w:pPr><w:spacing w:after="140"/>${properties}</w:pPr>${content||'<w:r><w:t/></w:r>'}</w:p>`;
 const code=text=>text.split('\n').map(line=>p(run(line,{code:true}),'<w:pStyle w:val="Code"/><w:spacing w:after="0"/>')).join('');
 const blocks=(ts,context={})=>ts.map(t=>{
  const indent=context.quote?`<w:ind w:left="${context.quote*360}"/><w:pBdr><w:left w:val="single" w:sz="12" w:space="8" w:color="059669"/></w:pBdr>`:'';
  if(t.type==='space')return '';
  if(t.type==='heading')return p(inline(t.tokens),`<w:pStyle w:val="Heading${t.depth}"/>${indent}`);
  if(t.type==='paragraph'||t.type==='text')return p(inline(t.tokens||[{type:'text',text:t.text}]),indent+(context.num?`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${context.num}"/></w:numPr>`:''));
  if(t.type==='blockquote')return blocks(t.tokens,{...context,quote:(context.quote||0)+1});
  if(t.type==='list'){const num=nextNumber++;numberings.push({id:num,ordered:t.ordered,start:Number(t.start)||1,depth:context.depth||0});return t.items.map(item=>{let first=true;return item.tokens.map(child=>{const out=blocks([child],{...context,depth:(context.depth||0)+1,num:first?num:undefined});if(child.type==='text'||child.type==='paragraph')first=false;return out;}).join('');}).join('');}
  if(t.type==='table'){const row=(cells,header)=>`<w:tr>${header?'<w:trPr><w:tblHeader/></w:trPr>':''}${cells.map(c=>`<w:tc><w:tcPr>${header?'<w:shd w:fill="ECFDF5"/>':''}</w:tcPr>${p(inline(c.tokens,{bold:header}),c.align?`<w:jc w:val="${c.align}"/>`:'')}</w:tc>`).join('')}</w:tr>`;return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(n=>`<w:${n} w:val="single" w:sz="4" w:color="CBD5E1"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${t.header.map(()=>'<w:gridCol/>').join('')}</w:tblGrid>${row(t.header,true)}${t.rows.map(r=>row(r,false)).join('')}</w:tbl>${p('')}`;}
  if(t.type==='code'){if(t.diagramId===undefined)return code(t.text);const result=results.get(t.diagramId);let out='';if(result?.model){out=nativeWordDrawing(result.model,{id:t.diagramId+1})+p(run(result.credit||t.lang),'<w:pStyle w:val="Caption"/>');}else out=p(run(`Diagram could not be converted: ${result?.error||'No renderer result'}`));if(includeSource||!result?.model)out+=p(run(`${t.lang} source`,{bold:true}))+code(t.text);return out;}
  if(t.type==='hr')return p('','<w:pBdr><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/></w:pBdr>');
  return code(t.raw||t.text||'');
 }).join('');
 const body=blocks(parsed.tokens);
 const document=xml(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="360" w:footer="360"/></w:sectPr></w:body></w:document>`);
 const styles=xml(`<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>${[1,2,3,4,5,6].map(n=>`<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${n-1}"/></w:pPr><w:rPr><w:b/><w:color w:val="047857"/><w:sz w:val="${[36,30,26,24,22,22][n-1]}"/></w:rPr></w:style>`).join('')}<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:pPr><w:shd w:fill="F1F5F9"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr></w:style></w:styles>`);
 const numbering=xml(`<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${numberings.map(n=>`<w:abstractNum w:abstractNumId="${n.id}"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="${n.start}"/><w:numFmt w:val="${n.ordered?'decimal':'bullet'}"/><w:lvlText w:val="${n.ordered?'%1.':'•'}"/><w:pPr><w:ind w:left="${720+n.depth*360}" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="${n.id}"><w:abstractNumId w:val="${n.id}"/></w:num>`).join('')}</w:numbering>`);
 const rels=xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${relationships.join('')}</Relationships>`);
 const types=xml(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[['word/document.xml','document'],['word/styles.xml','styles'],['word/numbering.xml','numbering']].map(([path,type])=>`<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${type==='document'?'document.main':type}+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
 const files={'[Content_Types].xml':types,'_rels/.rels':xml('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'),'word/document.xml':document,'word/styles.xml':styles,'word/numbering.xml':numbering,'word/_rels/document.xml.rels':rels,'docProps/core.xml':xml(`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x(title)}</dc:title><dc:creator>Mightora Architecture Lab</dc:creator></cp:coreProperties>`)};
 return zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,strToU8(v)])),{level:6});
}
