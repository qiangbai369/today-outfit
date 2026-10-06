const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),C=require('../catalog-v2.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime-manifest.json')));
for(const [file,expected] of Object.entries(manifest)){const bytes=fs.readFileSync(path.join(root,file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const entry of ['index.html','legacy/index.html','previews/complete-looks/index.html']){
 const page=fs.readFileSync(path.join(root,entry),'utf8'),url=new URL(entry,'https://local.invalid/');
 const base=new URL(page.match(/<base href="([^"]+)"/)?.[1]||'./',url);
 for(const m of page.replace(/<base[^>]+>/g,'').matchAll(/(?:src|href)="([^"#]+)"/g)){
  const target=new URL(m[1],base);if(target.origin!==url.origin)continue;
  assert.ok(fs.existsSync(path.join(root,decodeURIComponent(target.pathname))),entry+':'+m[1]);
 }
}
assert.match(html,/<title>穿搭照相馆/);assert.ok(!html.includes('preview-tag'));
require('./check-complete-looks.cjs');
assert.equal(C.ITEMS.length,83);let fits=0;
for(const role of C.CHARACTERS){assert.equal(C.itemsFor(role.id).length,role.id==='cool'?35:30);for(const item of C.itemsFor(role.id)){for(const file of [C.fit(role.id,item.id).file,`assets/v2/${role.id}/thumbs/${item.id}.webp`])assert.ok(fs.existsSync(path.join(root,file)),file);fits++;}for(const file of [`assets/v2/${role.id}/master.webp`,`assets/v2/${role.id}/blink.png`,`assets/v2/${role.id}/blink-detail.png`,`assets/v2/${role.id}/blink-half.png`,`assets/characters/${role.id}/original.png`])assert.ok(fs.existsSync(path.join(root,file)),file);}
assert.ok(!html.includes('完整衣橱预览'));assert.ok(!html.includes('早期流程预览'));
for(const [role,actions]of Object.entries({cool:['brow','smirk'],literary:['focus','knowing']}))for(const id of actions)assert.ok(fs.existsSync(path.join(root,`assets/v2/${role}/personality-${id}.png`)));
for(const file of fs.readdirSync(root).filter(f=>/\.(?:js|html)$/.test(f))){const content=fs.readFileSync(path.join(root,file),'utf8');assert.ok(!content.includes('../wardrobe-planner/'),file);assert.ok(!content.includes('../fit-wardrobe/'),file);}
console.log(`Checked ${Object.keys(manifest).length} runtime files, ${C.ITEMS.length} designs and ${fits} fitted garments.`);
