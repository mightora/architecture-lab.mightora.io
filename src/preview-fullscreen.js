export function createPreviewFullscreen(pane,button,onResize){
 const doc=pane.ownerDocument;let expanded=false,previousFocus,previousOverflow,previousRole,previousLabel,previousModal;
 function sync(value){
  if(value===expanded)return;expanded=value;
  if(value){previousFocus=doc.activeElement;previousOverflow=doc.body.style.overflow;previousRole=pane.getAttribute('role');previousLabel=pane.getAttribute('aria-label');previousModal=pane.getAttribute('aria-modal');doc.body.style.overflow='hidden';pane.setAttribute('role','dialog');pane.setAttribute('aria-modal','true');pane.setAttribute('aria-label','Full-screen diagram preview');}
  else {doc.body.style.overflow=previousOverflow;for(const [name,value] of [['role',previousRole],['aria-label',previousLabel],['aria-modal',previousModal]])value===null?pane.removeAttribute(name):pane.setAttribute(name,value);}
  pane.classList.toggle('preview-expanded',value);button.textContent=value?'Exit full screen':'Full screen';button.setAttribute('aria-expanded',String(value));button.title=value?'Return to the playground (Escape)':'Expand the diagram preview';
  if(value)button.focus();else if(previousFocus?.isConnected)previousFocus.focus();
  onResize();doc.defaultView.requestAnimationFrame?.(()=>onResize());
 }
 async function close(){if(doc.fullscreenElement===pane&&doc.exitFullscreen){try{await doc.exitFullscreen();}catch{}}sync(false);}
 async function toggle(){if(expanded){await close();return;}sync(true);if(pane.requestFullscreen){try{await pane.requestFullscreen();}catch{/* The viewport overlay also works where native fullscreen is unavailable. */}}}
 function change(){sync(doc.fullscreenElement===pane);}
 function key(event){if(!expanded)return;if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Tab'){
  const controls=[...pane.querySelectorAll('button:not([disabled]),a[href],iframe,[tabindex="0"]')].filter(el=>!el.hidden);const first=controls[0],last=controls.at(-1);if(!first)return;
  if(event.shiftKey&&(doc.activeElement===first||!pane.contains(doc.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(doc.activeElement===last||!pane.contains(doc.activeElement))){event.preventDefault();first.focus();}
 }}
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',change);doc.addEventListener('keydown',key);
 return {close,isExpanded:()=>expanded,dispose(){sync(false);button.removeEventListener('click',toggle);doc.removeEventListener('fullscreenchange',change);doc.removeEventListener('keydown',key);}};
}
