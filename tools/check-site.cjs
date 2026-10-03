const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),C=require('../catalog-v2.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime-manifest.json')));
for(const [file,expected] of Object.entries(manifest)){const bytes=fs.readFileSync(path.join(root,file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|\.\/)/.test(m[1]))continue;assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);}
assert.equal(C.ITEMS.length,50);let fits=0;
for(const role of C.CHARACTERS){assert.equal(C.itemsFor(role.id).length,30);for(const item of C.itemsFor(role.id)){for(const file of [C.fit(role.id,item.id).file,`assets/v2/${role.id}/thumbs/${item.id}.webp`])assert.ok(fs.existsSync(path.join(root,file)),file);fits++;}for(const file of [`assets/v2/${role.id}/master.webp`,`assets/v2/${role.id}/blink.png`,`assets/characters/${role.id}/original.png`])assert.ok(fs.existsSync(path.join(root,file)),file);}
assert.ok(!html.includes('完整衣橱预览'));assert.ok(!html.includes('早期流程预览'));
for(const file of fs.readdirSync(root).filter(f=>/\.(?:js|html)$/.test(f))){const content=fs.readFileSync(path.join(root,file),'utf8');assert.ok(!content.includes('../wardrobe-planner/'),file);assert.ok(!content.includes('../fit-wardrobe/'),file);}
console.log(`Checked ${Object.keys(manifest).length} runtime files, 50 designs and ${fits} fitted garments.`);
