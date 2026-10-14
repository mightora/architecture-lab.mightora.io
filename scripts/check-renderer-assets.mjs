import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rendererAssetUrl} from '../src/renderer-assets.js';
// Reproduce deployment: the document is at the site root, but application code
// lives in /assets/index-HASH.js. Both module URLs must bypass /assets/.
for(const page of ['https://example.test/','https://example.test/lab/']){
 const chunk=new URL('assets/index-HASH.js',page);
 for(const path of ['vendor/plantuml/plantuml.js','vendor/d2/index.js']){
  const url=rendererAssetUrl(path,'./',page);
  assert.equal(new URL(url,chunk).href,new URL(path,page).href);
  assert(!new URL(url).pathname.includes('/assets/vendor/'));
  assert(fs.statSync('public/'+path).size>1000);
 }
}
assert.equal(rendererAssetUrl('vendor/d2/index.js','/lab/','https://example.test/other/'),'https://example.test/lab/vendor/d2/index.js');
console.log('Renderer import URL regression: root deployment and nested static hosting passed.');
