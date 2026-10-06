const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'runtime-manifest.json');
const prior=JSON.parse(fs.readFileSync(file));
const gallery=JSON.parse(fs.readFileSync(path.join(root,'previews/complete-looks/runtime-manifest.json')));
const files=new Set([...Object.keys(prior),'legacy/index.html','previews/complete-looks/runtime-manifest.json',...Object.keys(gallery).map(f=>'previews/complete-looks/'+f)]);
const hashes=Object.fromEntries([...files].sort().map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
fs.writeFileSync(file,JSON.stringify(hashes,null,2)+'\n');
console.log('Recorded '+files.size+' reviewed runtime files.');
