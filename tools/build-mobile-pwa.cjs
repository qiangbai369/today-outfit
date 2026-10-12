const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),meta=require('../mobile/拆解小样信息.json'),looks=require('../previews/complete-looks/data.js').LOOKS;
const files=new Set(['index.html','拆解演示.css','拆解演示.js','手势逻辑.js','收藏逻辑.js','拆解小样信息.json','pwa.js','manifest.webmanifest','搭配.html','../previews/complete-looks/data.js','thumbnails/heart.webp','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png']);
for(const look of looks){files.add(meta[look.id].figure);files.add('thumbnails/'+look.id+'.webp');for(const item of meta[look.id].items)files.add(item.image);}
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const assets=[...files].sort().map(url=>({url,sha256:hash(fs.readFileSync(path.resolve(root,'mobile',url)))}));
const version=hash(JSON.stringify(assets)+hash(fs.readFileSync(path.join(root,'mobile/sw.js')))).slice(0,20);
fs.writeFileSync(path.join(root,'mobile/offline-assets.js'),'self.OUTFIT_OFFLINE = '+JSON.stringify({version,assets},null,2)+';\n');
console.log(`Offline release ${version}: ${assets.length} required resources.`);
