const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),scope='https://example.test/today-outfit/mobile/';
function release(){const c={self:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'mobile/offline-assets.js'),'utf8'),c);return JSON.parse(JSON.stringify(c.self.OUTFIT_OFFLINE));}
function worker({active=false,store=new Map(),offline=false,bad=false,version}={}){
 const handlers={},data=release();if(version)data.version=version;if(bad)data.assets[0].sha256='0'.repeat(64);let requests=0,skipped=0,claimed=0;
 const caches={async open(name){if(!store.has(name))store.set(name,new Map());const cache=store.get(name);return{async put(key,response){cache.set(String(key),response.clone());},async match(key){return cache.get(String(key))?.clone();}};},async keys(){return [...store.keys()];},async delete(key){return store.delete(key);}};
 const self={registration:{scope,active},clients:{claim:async()=>{claimed++;}},skipWaiting:async()=>{skipped++;},addEventListener:(name,handler)=>{handlers[name]=handler;},OUTFIT_OFFLINE:data};
 const fetch=async request=>{requests++;if(offline)throw new Error('Offline');const url=new URL(typeof request==='string'?request:request.url);return new Response(fs.readFileSync(path.join(root,decodeURIComponent(url.pathname).replace('/today-outfit/',''))));};
 vm.runInNewContext(fs.readFileSync(path.join(root,'mobile/sw.js'),'utf8'),{self,importScripts(){},URL,Request,Response,crypto:webcrypto,caches,fetch,Uint8Array,AbortController,setTimeout,clearTimeout});
 async function event(type,args={}){let promise,handled=false;handlers[type]({...args,waitUntil:p=>{promise=p;},respondWith:p=>{promise=p;handled=true;}});return{handled,result:await promise};}
 return{event,store,setOffline:value=>{offline=value;},stats:()=>({requests,skipped,claimed}),cache:'outfit-pwa:/today-outfit/mobile/:'+data.version,data};
}
test('manifest uses stable relative app identity and every required offline asset has the exact release hash',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'mobile/manifest.webmanifest')));assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 const r=release(),files=new Set(r.assets.map(x=>x.url)),meta=require('../mobile/拆解小样信息.json');assert.equal(files.size,100);for(const item of r.assets){assert.ok(!/output|source-art|tryons|搭配逻辑/.test(item.url));assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(root,'mobile',item.url))).digest('hex'),item.sha256,item.url);}
 for(const [id,look]of Object.entries(meta)){assert(files.has(look.figure));assert(files.has('thumbnails/'+id+'.webp'));for(const item of look.items)assert(files.has(item.image));}
 for(const icon of manifest.icons)assert(files.has(icon.src));assert(files.has('icons/apple-touch-icon.png'));
});
test('all 100 assets and query-bearing look links remain usable with network unavailable',async()=>{
 const w=worker();await w.event('install');await w.event('activate');assert.equal(w.store.get(w.cache).size,101);const count=w.stats().requests;w.setOffline(true);
 for(const asset of w.data.assets){const url=new URL(asset.url,scope);url.search='?v=old';const {handled,result}=await w.event('fetch',{request:{url:url.href,method:'GET',mode:'cors'}});assert(handled);assert.equal(result.status,200);assert.equal(createHash('sha256').update(Buffer.from(await result.arrayBuffer())).digest('hex'),asset.sha256);}
 const page=await w.event('fetch',{request:{url:scope+'?sample=cool-winter-b',method:'GET',mode:'navigate'}});assert.match(await page.result.text(),/id="picker"/);assert.equal(w.stats().requests,count);
 assert.equal((await w.event('fetch',{request:{url:'https://elsewhere.test/',method:'GET',mode:'navigate'}})).handled,false);
 assert.equal((await w.event('fetch',{request:{url:scope,method:'POST',mode:'cors'}})).handled,false);
});
test('a corrupt or interrupted new release cannot replace or delete the usable old release',async()=>{
 const store=new Map([['outfit-pwa:/today-outfit/mobile/:old',new Map([['saved',new Response('old')]])],['another-app',new Map()]]);
 const broken=worker({active:true,store,bad:true,version:'bad'});await assert.rejects(broken.event('install'),/Incomplete/);assert(!store.has(broken.cache));assert(store.has('outfit-pwa:/today-outfit/mobile/:old'));assert(store.has('another-app'));assert.equal(broken.stats().skipped,0);
 const interrupted=worker({active:true,store,offline:true,version:'network-fail'});await assert.rejects(interrupted.event('install'),/Incomplete/);assert(!store.has(interrupted.cache));assert(store.has('outfit-pwa:/today-outfit/mobile/:old'));
});
test('a complete update waits for explicit activation and cleans only its own obsolete release cache',async()=>{
 const store=new Map([['outfit-pwa:/today-outfit/mobile/:old',new Map()],['outfit-pwa:/another-project/mobile/:other',new Map()],['unrelated',new Map()]]),w=worker({active:true,store,version:'next'});
 await w.event('install');assert.equal(w.stats().skipped,0);assert(store.has('outfit-pwa:/today-outfit/mobile/:old'));await w.event('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(w.stats().skipped,1);await w.event('activate');assert.equal(w.stats().claimed,1);assert(!store.has('outfit-pwa:/today-outfit/mobile/:old'));assert(store.has('outfit-pwa:/another-project/mobile/:other'));assert(store.has('unrelated'));assert(store.has(w.cache));
});
const flush=async()=>{for(let n=0;n<20;n++)await Promise.resolve();};
function client(){const nodes={'pwa-action':{hidden:true,handlers:{},addEventListener(k,f){this.handlers[k]=f;}},'pwa-status':{textContent:''}},events={},worker={state:'activated'},reg={active:worker,waiting:null,installing:null,handlers:{},addEventListener(k,f){this.handlers[k]=f;},update:async()=>{}},sw={controller:null,handlers:{},addEventListener(k,f){this.handlers[k]=f;},register:async()=>reg,ready:Promise.resolve(reg)},doc={documentElement:{dataset:{}},readyState:'complete',getElementById:id=>nodes[id],addEventListener(){}};let reloads=0;vm.runInNewContext(fs.readFileSync(path.join(root,'mobile/pwa.js'),'utf8'),{document:doc,navigator:{serviceWorker:sw,onLine:true},window:{addEventListener:(k,f)=>{events[k]=f;}},location:{reload(){reloads++;}},Date});return{nodes,reg,sw,doc,reloads:()=>reloads};}
test('first install stays quiet and a later update reloads exactly once even in the first installation session',async()=>{
 const app=client();await flush();assert.equal(app.nodes['pwa-action'].hidden,true);assert.equal(app.doc.documentElement.dataset.offlineReady,'true');app.sw.controller=app.reg.active;app.sw.handlers.controllerchange();assert.equal(app.reloads(),0);
 let activated=0;const waiting={state:'installed',postMessage:message=>{assert.equal(message.type,'ACTIVATE_UPDATE');activated++;},addEventListener(k,f){this[k]=f;}};app.reg.waiting=waiting;app.reg.installing=waiting;app.reg.handlers.updatefound();waiting.statechange();assert.equal(app.nodes['pwa-action'].hidden,false);assert.equal(app.nodes['pwa-action'].textContent,'更新');await app.nodes['pwa-action'].handlers.click();assert.equal(activated,1);app.sw.handlers.controllerchange();app.sw.handlers.controllerchange();assert.equal(app.reloads(),1);
});
