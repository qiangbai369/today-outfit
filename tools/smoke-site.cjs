const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=new URL(process.argv[2]||'http://127.0.0.1:8876/');
const out=path.resolve(process.argv[3]||path.join(root,'output/release-v2'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(file){const response=await fetch(new URL(file,base),{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,file);return Buffer.from(await response.arrayBuffer());}
(async()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'runtime-manifest.json')));
 const published=JSON.parse((await get('runtime-manifest.json')).toString());assert.deepEqual(published,expected);
 const files=Object.keys(expected).filter(f=>/\.(?:js|css|html|json)$/.test(f));
 for(let i=0;i<files.length;i+=4)await Promise.all(files.slice(i,i+4).map(async f=>assert.equal(sha(await get(f)),expected[f],f)));
 const assets=Object.keys(expected).filter(f=>f.startsWith('previews/complete-looks/')&&/\.(?:png|webp)$/.test(f));
 for(let i=0;i<assets.length;i+=6)await Promise.all(assets.slice(i,i+6).map(async f=>{const r=await fetch(new URL(f,base),{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,f);assert.equal(Number(r.headers.get('content-length')),fs.statSync(path.join(root,f)).size,f);}));
 // Representative neutral and all three character action families are checked byte-for-byte.
 for(const f of ['previews/complete-looks/assets/cartoon-v2/sweet-winter-a.png','previews/complete-looks/assets/actions-v2/sweet-spring-a-heart.png','previews/complete-looks/assets/actions-v2/cool-winter-b-peace.png','previews/complete-looks/assets/actions-v2/literary-winter-b-wave.png'])assert.equal(sha(await get(f)),expected[f],f);
 const result={url:base.href,runtimeManifest:true,codeAndMetadataHashes:files.length,completeLookAssetsAvailable:assets.length,representativeImageHashes:4};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'integrity-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
