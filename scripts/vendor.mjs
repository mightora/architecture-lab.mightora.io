import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
for(const file of ['plantuml.js','viz-global.js','emoji.js','openiconic.js','themes.js','LICENSE'])copy(`node_modules/@plantuml/core/${file}`,`public/vendor/plantuml/${file}`);
copy('node_modules/@d2lang/d2/dist/browser/index.js','public/vendor/d2/index.js');
copy('node_modules/wavedrom/wavedrom.min.js','public/vendor/wavedrom/wavedrom.min.js');
copy('node_modules/wavedrom/skins/default.js','public/vendor/wavedrom/default.js');
const packages=['@plantuml/core','@d2lang/d2','@viz-js/viz','mermaid','vega','vega-lite','vega-embed','wavedrom','bpmn-js','fflate','svg-pathdata','dompurify'];
let notices='Mightora Architecture Lab — third-party notices\n\n';
const versions={};
for(const name of packages){let dir=`node_modules/${name}`;const pkg=JSON.parse(fs.readFileSync(`${dir}/package.json`));versions[name]=pkg.version;notices+=`\n===== ${name} ${pkg.version} =====\nSource: ${typeof pkg.repository==='string'?pkg.repository:pkg.repository?.url||pkg.homepage||''}\n`;
 for(const file of fs.readdirSync(dir).filter(f=>/^(licen[cs]e|notice|third_party)/i.test(f))) {if(fs.statSync(`${dir}/${file}`).isFile())notices+=fs.readFileSync(`${dir}/${file}`,'utf8')+'\n';}
}
notices+='\nGraphviz 16.1.0 corresponding source: https://gitlab.com/api/v4/projects/4207231/packages/generic/graphviz-releases/16.1.0/graphviz-16.1.0.tar.gz\nExpat corresponding source: https://github.com/libexpat/libexpat/releases/download/R_2_8_5/expat-2.8.5.tar.gz\nD2 corresponding source: https://github.com/d2lang/d2/tree/6a7b4837838a3907604a1d9eec57ee98b6f3cd01 (package revision in SOURCE-VERSIONS.json)\n';
for(const dir of ['public/vendor','public/vendor/drawio'])for(const file of fs.readdirSync(dir).filter(f=>/licen[cs]e|notice|readme/i.test(f))){if(fs.statSync(`${dir}/${file}`).isFile())notices+=`\n===== ${dir}/${file} =====\n`+fs.readFileSync(`${dir}/${file}`,'utf8')+'\n';}
function collect(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(!item.isDirectory()||item.name.startsWith('.'))continue;const child=path.join(dir,item.name);if(item.name.startsWith('@')){collect(child);continue;}const manifest=path.join(child,'package.json');if(!fs.existsSync(manifest))continue;const pkg=JSON.parse(fs.readFileSync(manifest,'utf8'));if(packages.includes(pkg.name))continue;notices+=`\n===== Dependency ${pkg.name} ${pkg.version} (${pkg.license||'see notices'}) =====\n`;for(const file of fs.readdirSync(child).filter(f=>/^(licen[cs]e|notice|third_party)/i.test(f)))if(fs.statSync(path.join(child,file)).isFile())notices+=fs.readFileSync(path.join(child,file),'utf8')+'\n';}}
collect('node_modules');
fs.writeFileSync('public/THIRD-PARTY-NOTICES.txt',notices);
fs.writeFileSync('src/versions.json',JSON.stringify(versions,null,2));
