const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
test('Hu Po has three complete looks, 15 matching items and a self contained verified offline release',()=>{
 const c={window:{},self:{}};vm.runInNewContext(fs.readFileSync('hupo/data.js','utf8'),c);vm.runInNewContext(fs.readFileSync('hupo/offline-assets.js','utf8'),c);
 const data=c.window.CompleteLookData,meta=JSON.parse(fs.readFileSync('hupo/拆解小样信息.json'));assert.equal(data.LOOKS.length,3);assert.equal(Object.values(meta).flatMap(x=>x.items).length,15);
 const assets=new Set(c.self.OUTFIT_OFFLINE.assets.map(x=>x.url));
 for(const x of c.self.OUTFIT_OFFLINE.assets){assert(!x.url.includes('..'));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join('hupo',x.url))).digest('hex'),x.sha256,x.url);}
 for(const look of data.LOOKS){assert(look.id.startsWith('hupo-'));assert(assets.has(meta[look.id].figure));assert(assets.has('thumbnails/'+look.id+'.webp'));for(const item of meta[look.id].items){assert(assets.has(item.image));assert(item.name&&item.description);assert(item.bounds[2]>item.bounds[0]&&item.bounds[3]>item.bounds[1]);}}
 const js=fs.readFileSync('hupo/拆解演示.js','utf8');assert(js.includes("'hupo-outfit-favorites-v1'"));assert(!js.includes('today-outfit-complete-preview-favorites-v1'));
});
