const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
function launch(source,permission){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'panel.html'),'utf8'),{url:'https://example.test/',runScripts:'outside-only'});let requests=0;const saved={skills:[]};
 source.handle.queryPermission=async()=>permission;source.handle.requestPermission=()=>{requests++;return Promise.resolve('granted')};
 const db={transaction(){const tx={objectStore(){return {getAll(){return {result:[source]}},put(){return {}},delete(){return {}}}}};setTimeout(()=>tx.oncomplete?.(),0);return tx}};
 Object.defineProperty(dom.window,'indexedDB',{value:{open(){const request={result:db};setTimeout(()=>request.onsuccess?.(),0);return request}}});
 dom.window.showDirectoryPicker=async()=>source.handle;dom.window.chrome={storage:{local:{get:async()=>saved,set:async value=>Object.assign(saved,value)}}};
 for(const f of ['core.js','directory-sync.js','panel.js'])dom.window.eval(fs.readFileSync(path.join(root,f),'utf8'));
 return {dom,saved,getRequests:()=>requests};
}
const pause=()=>new Promise(r=>setTimeout(r,80));
function source(){return {id:'source1',name:'skills',excludedPaths:[],handle:{async *values(){yield {kind:'file',name:'SKILL.md',async getFile(){return {size:24,async text(){return '---\nname: demo\n---'}}}}}}}}
test('opening the panel scans only remembered directories with existing read permission',async()=>{const a=launch(source(),'granted');try{await pause();assert.equal(a.saved.skills.length,1);assert.equal(a.saved.skills[0].name,'demo');assert.equal(a.getRequests(),0);assert.match(a.dom.window.document.querySelector('#source-status').textContent,/已识别/)}finally{a.dom.window.close()}});
test('expired directory permission is requested only after the user clicks rescan',async()=>{const a=launch(source(),'prompt');try{await pause();assert.equal(a.saved.skills.length,0);assert.equal(a.getRequests(),0);a.dom.window.document.querySelector('[data-sync]').click();await pause();assert.equal(a.getRequests(),1);assert.equal(a.saved.skills.length,1)}finally{a.dom.window.close()}});
