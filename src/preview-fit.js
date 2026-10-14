export function diagramFit(width,height,viewportWidth,viewportHeight,zoom=1,padding=24){
 if(![width,height,viewportWidth,viewportHeight].every(n=>Number.isFinite(n)&&n>0))return null;
 const availableWidth=Math.max(1,viewportWidth-2*padding),availableHeight=Math.max(1,viewportHeight-2*padding);
 const scale=Math.min(1,availableWidth/width,availableHeight/height)*zoom;
 return {width:width*scale,height:height*scale,stageWidth:Math.max(viewportWidth,width*scale+2*padding),stageHeight:Math.max(viewportHeight,height*scale+2*padding),scale};
}
export function createPreviewFit(viewport,target,{fitVisual=()=>{},zoomVisual=()=>{}}={}){
 let zoom=1;
 function update(){
  // Embedded editors manage their own canvas, controls and viewbox.
  if(target.classList.contains('visual-preview')){target.style.width='';target.style.height='';fitVisual();return;}
  const svg=target.querySelector('svg');if(!svg)return;
  const numbers=(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  const width=numbers[2]||parseFloat(svg.getAttribute('width')),height=numbers[3]||parseFloat(svg.getAttribute('height'));
  const fit=diagramFit(width,height,viewport.clientWidth,viewport.clientHeight,zoom);if(!fit)return;
  svg.style.setProperty('width',fit.width+'px');svg.style.setProperty('height',fit.height+'px');svg.style.setProperty('max-width','none');svg.style.setProperty('max-height','none');svg.style.flexShrink='0';
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');target.style.width=fit.stageWidth+'px';target.style.height=fit.stageHeight+'px';target.style.transform='';
 }
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;observer?.observe(viewport);
 window.addEventListener('resize',update);
 return {update,fit(){zoom=1;update();viewport.scrollTop=0;viewport.scrollLeft=0;},zoomBy(delta){if(target.classList.contains('visual-preview')){zoomVisual(delta);return;}zoom=Math.max(.1,Math.min(4,zoom+delta));update();},dispose(){observer?.disconnect();window.removeEventListener('resize',update);}};
}
