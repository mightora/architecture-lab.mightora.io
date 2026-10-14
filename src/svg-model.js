import { SVGPathData } from 'svg-pathdata';
const NS='http://www.w3.org/2000/svg';
const DRAWING_ELEMENTS=new Set(['path','rect','circle','ellipse','line','polygon','polyline','text','foreignObject']);
export function styledSnapshot(svg){
 const copy=svg.cloneNode(true), a=[svg,...svg.querySelectorAll('*')],b=[copy,...copy.querySelectorAll('*')];
 const attrs=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','opacity','display','visibility','color'];
 a.forEach((el,i)=>{const s=getComputedStyle(el);attrs.forEach(k=>{const v=s.getPropertyValue(k);if(v)b[i].setAttribute(k,v);});});
 copy.setAttribute('xmlns',NS);return copy;
}
function expandUses(svg){
 for(let pass=0;pass<8;pass++){
  const uses=[...svg.querySelectorAll('use')].filter(e=>!e.closest('defs'));if(!uses.length)return;
  for(const el of uses){const href=el.getAttribute('href')||el.getAttribute('xlink:href');if(!href?.startsWith('#'))throw new Error('External SVG references cannot be exported as editable Office objects.');
   const ref=[...svg.querySelectorAll('[id]')].find(x=>x.id===href.slice(1));if(!ref)throw new Error('The SVG references a missing shape.');
   const g=document.createElementNS(NS,'g');for(const a of el.attributes)if(!['href','xlink:href','x','y','transform'].includes(a.name))g.setAttribute(a.name,a.value);
   g.setAttribute('transform',`${el.getAttribute('transform')||''} translate(${el.getAttribute('x')||0} ${el.getAttribute('y')||0})`);
   const child=ref.cloneNode(true);child.removeAttribute('id');g.append(child);el.replaceWith(g);
  }
 }
 if([...svg.querySelectorAll('use')].some(e=>!e.closest('defs')))throw new Error('Too many nested SVG references.');
}
const attr=(el,n,d=0)=>parseFloat(el.getAttribute(n)||d);
function geometry(el){
 const t=el.localName;
 if(t==='path')return el.getAttribute('d');
 if(t==='rect'){
  const x=attr(el,'x'),y=attr(el,'y'),w=attr(el,'width'),h=attr(el,'height'),r=Math.min(attr(el,'rx',attr(el,'ry')),w/2,h/2);
  return r?`M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`;
 }
 if(t==='circle'||t==='ellipse'){const x=attr(el,'cx'),y=attr(el,'cy'),rx=t==='circle'?attr(el,'r'):attr(el,'rx'),ry=t==='circle'?attr(el,'r'):attr(el,'ry');return `M${x-rx} ${y}A${rx} ${ry} 0 1 0 ${x+rx} ${y}A${rx} ${ry} 0 1 0 ${x-rx} ${y}Z`;}
 if(t==='line')return `M${attr(el,'x1')} ${attr(el,'y1')}L${attr(el,'x2')} ${attr(el,'y2')}`;
 if(t==='polygon'||t==='polyline'){const p=(el.getAttribute('points')||'').trim().split(/[ ,\s]+/).map(Number);if(p.length<2)return '';return p.reduce((s,n,i)=>i%2?s:s+`${i?'L':'M'}${n} ${p[i+1]}`,'')+(t==='polygon'?'Z':'');}
 return null;
}
function colour(v){if(!v||v==='none'||v==='transparent'||/rgba\([^)]*,\s*0(?:\.0+)?\s*\)/.test(v))return null;if(v.startsWith('url('))throw new Error('This diagram uses a gradient or pattern fill. Choose a flat colour before exporting editable Office objects.');const m=v.match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);if(m)return m.slice(1,4).map(n=>Number(n).toString(16).padStart(2,'0')).join('').toUpperCase();if(/^#[0-9a-f]{6}$/i.test(v))return v.slice(1).toUpperCase();if(/^#[0-9a-f]{3}$/i.test(v))return v.slice(1).split('').map(c=>c+c).join('').toUpperCase();return '111827';}
export function parsePath(d,m){
 return new SVGPathData(d).toAbs().normalizeHVZ(false,true,true).normalizeST().qtToC().aToC().commands.map(c=>{
  const out={...c};for(const [x,y]of [['x','y'],['x1','y1'],['x2','y2']])if(c[x]!==undefined){const p=new DOMPoint(c[x],c[y]).matrixTransform(m);out[x]=p.x;out[y]=p.y;}return out;
 });
}
function markerShapes(el,svg,m,paint){
 const result=[];if(!el.getTotalLength)return result;
 let length;try{length=el.getTotalLength();}catch{return result;}
 if(length<0.01)return result;
 for(const end of ['start','end']){
  const value=el.getAttribute('marker-'+end)||getComputedStyle(el).getPropertyValue('marker-'+end);const match=value?.match(/#([^)"]+)/);if(!match)continue;
  const marker=[...svg.querySelectorAll('marker')].find(e=>e.id===match[1]);if(!marker)continue;
  const at=end==='end'?length:0,p=el.getPointAtLength(at),q=el.getPointAtLength(end==='end'?Math.max(0,length-.1):Math.min(length,.1));
  let angle=Math.atan2(end==='end'?p.y-q.y:q.y-p.y,end==='end'?p.x-q.x:q.x-p.x)*180/Math.PI;
  const orient=marker.getAttribute('orient');if(orient==='auto-start-reverse'&&end==='start')angle+=180;else if(orient&&!orient.startsWith('auto'))angle=parseFloat(orient)||0;
  const scale=marker.getAttribute('markerUnits')==='userSpaceOnUse'?1:attr(el,'stroke-width',parseFloat(getComputedStyle(el).strokeWidth)||1);
  const vb=marker.viewBox.baseVal;let mm=m.translate(p.x,p.y).rotate(angle).scale(scale);
  if(vb.width&&vb.height)mm=mm.scale(attr(marker,'markerWidth',3)/vb.width,attr(marker,'markerHeight',3)/vb.height);
  mm=mm.translate(-attr(marker,'refX'),-attr(marker,'refY'));
  for(const child of marker.querySelectorAll('path,polygon,polyline,rect,circle,ellipse')){const d=geometry(child);if(d)result.push({kind:'path',commands:parsePath(d,mm),fill:child.getAttribute('fill')==='none'?null:paint.stroke||paint.fill||'111827',stroke:null,strokeWidth:0,opacity:1});}
 }
 return result;
}
// D2 uses simple rectangular masks to keep connector strokes clear of labels.
// Convert their visible stroke portions to editable polylines instead of discarding the mask.
function maskedCommands(el,svg,m,commands,fill){
 const value=el.getAttribute('mask');if(!value||value==='none')return commands;
 if(fill)throw new Error('Masked filled shapes cannot be exported as editable Office objects yet.');
 const id=value.match(/#([^)"]+)/)?.[1],mask=[...svg.querySelectorAll('mask')].find(x=>x.id===id);
 if(!mask||mask.getAttribute('maskUnits')!=='userSpaceOnUse'||[...mask.children].some(x=>x.localName!=='rect'))throw new Error('This SVG mask is not supported by editable Office export.');
 const rects=[...mask.children].filter(x=>x.getAttribute('fill')==='black').map(r=>{
  const a=new DOMPoint(attr(r,'x'),attr(r,'y')).matrixTransform(m),b=new DOMPoint(attr(r,'x')+attr(r,'width'),attr(r,'y')+attr(r,'height')).matrixTransform(m);return {x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),y0:Math.min(a.y,b.y),y1:Math.max(a.y,b.y)};
 });
 const inside=(p,r)=>p.x>=r.x0&&p.x<=r.x1&&p.y>=r.y0&&p.y<=r.y1;
 const split=(a,b)=>{
  const cuts=[0,1],dx=b.x-a.x,dy=b.y-a.y;
  for(const r of rects){if(dx)for(const x of [r.x0,r.x1]){const t=(x-a.x)/dx,y=a.y+t*dy;if(t>0&&t<1&&y>=r.y0&&y<=r.y1)cuts.push(t);}if(dy)for(const y of [r.y0,r.y1]){const t=(y-a.y)/dy,x=a.x+t*dx;if(t>0&&t<1&&x>=r.x0&&x<=r.x1)cuts.push(t);}}
  cuts.sort((a,b)=>a-b);const parts=[];for(let i=1;i<cuts.length;i++){const t=(cuts[i-1]+cuts[i])/2,p={x:a.x+dx*t,y:a.y+dy*t};if(!rects.some(r=>inside(p,r)))parts.push([{x:a.x+dx*cuts[i-1],y:a.y+dy*cuts[i-1]},{x:a.x+dx*cuts[i],y:a.y+dy*cuts[i]}]);}return parts;
 };
 const result=[];let prev,start;const line=(a,b)=>{for(const [p,q]of split(a,b))result.push({type:2,x:p.x,y:p.y},{type:16,x:q.x,y:q.y});};
 for(const c of commands){if(c.type===2){prev={x:c.x,y:c.y};start=prev;}else if(c.type===16){const next={x:c.x,y:c.y};line(prev,next);prev=next;}else if(c.type===32){const a=prev;let last=a;const count=Math.max(24,Math.ceil((Math.hypot(c.x1-a.x,c.y1-a.y)+Math.hypot(c.x2-c.x1,c.y2-c.y1)+Math.hypot(c.x-c.x2,c.y-c.y2))/8));for(let i=1;i<=count;i++){const t=i/count,u=1-t,next={x:u*u*u*a.x+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,y:u*u*u*a.y+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y};line(last,next);last=next;}prev={x:c.x,y:c.y};}else if(c.type===1){line(prev,start);prev=start;}}
 return result;
}
export async function svgToModel(source){
 const mount=document.createElement('div');mount.style.cssText='position:fixed;left:-20000px;top:0;width:1600px;visibility:hidden;pointer-events:none';mount.innerHTML=source;document.body.append(mount);
 try{
  const svg=mount.querySelector('svg');if(!svg)throw new Error('No SVG diagram to export.');
  if(svg.querySelector('image'))throw new Error('This diagram contains bitmap images. Remove them to export every element as an editable Office object. SVG and PNG exports remain available.');
  expandUses(svg);
  let vb=svg.viewBox.baseVal;let width=vb.width||parseFloat(svg.getAttribute('width'))||800,height=vb.height||parseFloat(svg.getAttribute('height'))||500;
  if(!vb.width)svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.setAttribute('width',width);svg.setAttribute('height',height);svg.style.cssText=`width:${width}px;height:${height}px;max-width:none`;
  await document.fonts.ready;
  const screenMatrix=svg.getScreenCTM();if(!screenMatrix)throw new Error('The browser could not measure the diagram. Render it again before exporting.');
  const origin=screenMatrix.inverse();const shapes=[];
  for(const el of svg.querySelectorAll('*')){
   // Metadata, styles and containers do not implement SVGGraphicsElement.
   // Only measure elements that can produce editable geometry or text.
   if(!DRAWING_ELEMENTS.has(el.localName)||el.closest('defs,clipPath,mask,marker,pattern'))continue;
   const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'&&el.getAttribute('visibility')==='hidden')continue;
   if(el.getAttribute('filter')&&!/none/.test(el.getAttribute('filter')))throw new Error('SVG filters cannot be reproduced as editable Office shapes. Remove the filter first.');
   const m=origin.multiply(el.getScreenCTM()||svg.getScreenCTM());
   const paint={fill:colour(s.fill),stroke:colour(s.stroke),strokeWidth:(parseFloat(s.strokeWidth)||0)*Math.hypot(m.a,m.b),opacity:Number.isFinite(parseFloat(s.opacity))?parseFloat(s.opacity):1,dash:s.strokeDasharray!=='none'};
   const d=geometry(el);
   if(d){const commands=maskedCommands(el,svg,m,parsePath(d,m),paint.fill);shapes.push({kind:'path',commands,...paint});shapes.push(...markerShapes(el,svg,m,paint));}
   else if(el.localName==='text'){
    const spans=[...el.querySelectorAll('tspan')].filter(x=>!x.querySelector('tspan'));const parts=spans.length?spans:[el];
    for(const part of parts){if(!part.textContent.trim())continue;const box=part.getBBox(),pm=origin.multiply(part.getScreenCTM());const p=new DOMPoint(box.x,box.y).matrixTransform(pm);const st=getComputedStyle(part),fontSize=(parseFloat(st.fontSize)||14)*Math.hypot(pm.c,pm.d);const angle=Math.atan2(pm.b,pm.a)*180/Math.PI;const width=Math.max(box.width*Math.hypot(pm.a,pm.b)+8,10),height=Math.max(box.height*Math.hypot(pm.c,pm.d)+4,fontSize*1.15),center=new DOMPoint(box.x+box.width/2,box.y+box.height/2).matrixTransform(pm);
     shapes.push({kind:'text',x:center.x-width/2,y:center.y-height/2,width,height,rotation:angle,text:part.textContent,fontSize,font:st.fontFamily.split(',')[0].replace(/["']/g,''),bold:Number(st.fontWeight)>=600||st.fontWeight==='bold',italic:st.fontStyle==='italic',fill:colour(st.fill)||'111827'});
    }
   }else if(el.localName==='foreignObject'){
    const div=el.querySelector('div');if(!div)continue;const r=div.getBoundingClientRect(),p=new DOMPoint(r.x,r.y).matrixTransform(origin),st=getComputedStyle(div);shapes.push({kind:'text',x:p.x,y:p.y,width:r.width*origin.a+8,height:r.height*origin.d+6,text:div.innerText,fontSize:parseFloat(st.fontSize)||14,font:st.fontFamily.split(',')[0].replace(/["']/g,''),bold:Number(st.fontWeight)>=600,fill:colour(st.color)||'111827'});
   }
  }
  if(!shapes.length)throw new Error('No editable shapes were found.');
  if(shapes.length>5000)throw new Error('This diagram is too large for editable Office export. Try a smaller view.');
  const viewBox=svg.viewBox.baseVal;for(const shape of shapes){if(shape.kind==='text'){shape.x-=viewBox.x;shape.y-=viewBox.y;}else for(const c of shape.commands)for(const [x,y]of [['x','y'],['x1','y1'],['x2','y2']])if(c[x]!==undefined){c[x]-=viewBox.x;c[y]-=viewBox.y;}}
  return {width,height,shapes};
 }finally{mount.remove();}
}
