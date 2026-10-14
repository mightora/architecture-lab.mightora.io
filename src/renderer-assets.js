// Dynamic import specifiers are resolved relative to the importing JS chunk.
// Resolve public assets against the document first, so Vite's /assets/ chunks
// cannot accidentally send a renderer import to /assets/vendor/.
export function rendererAssetUrl(path,baseUrl,pageUrl){
 return new URL(path,new URL(baseUrl,pageUrl)).href;
}
