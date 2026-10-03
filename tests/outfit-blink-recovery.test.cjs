const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const R=require('../renderer-v2'),C=require('../catalog-v2');
const root=path.resolve(__dirname,'..');
test('a failed optional blink load can retry on the same prepared outfit without recomposing garments',async()=>{
 let attempts=0,garments=0;
 const renderer=R.createRenderer({createCanvas,loadImage:async f=>{if(f.endsWith('/blink-detail.png')){attempts++;if(attempts===1)throw Error('simulated connection failure');}else garments++;return loadImage(path.join(root,f));}});
 const p=await renderer.compose({character:'sweet',outfit:C.defaultOutfit('sweet')}),figure=p.figure,outfit={...p.outfit},loaded=garments;
 assert.equal(p.blink,null);assert.equal(attempts,1);
 await renderer.ensureBlink(p);
 assert.ok(p.blink);assert.equal(attempts,2);assert.equal(garments,loaded);assert.equal(p.figure,figure);assert.deepEqual(p.outfit,outfit);
});
test('four different sweet outfits use the same head registration and change only two eye patches',async()=>{
 const renderer=R.createRenderer({createCanvas,loadImage:f=>loadImage(path.join(root,f))}),base=C.defaultOutfit('sweet');
 const outfits=[base,{...base,top:'shared-top-04',bottom:'shared-bottom-01',shoes:'shared-shoes-04',bag:'shared-bag-02'},{...base,outer:'sweet-outer-01',shoes:'sweet-shoes-02',bag:'sweet-bag-01'},{...base,top:null,bottom:null,dress:'sweet-dress-01',outer:null,shoes:'shared-shoes-03',bag:null}];
 let head;for(const outfit of outfits){
  const p=await renderer.compose({character:'sweet',outfit}),a=createCanvas(1024,1536),b=createCanvas(1024,1536);renderer.draw(a,p);renderer.draw(b,p,{blink:true});
  const before=a.getContext('2d').getImageData(0,0,1024,1536).data,after=b.getContext('2d').getImageData(0,0,1024,1536).data;
  const current=Buffer.from(before.slice(0,1024*470*4));if(head)assert.deepEqual(current,head);head=current;
  let changed=0;for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){const k=(y*1024+x)*4;if(before.slice(k,k+4).some((v,i)=>v!==after[k+i])){changed++;assert.ok([[438,293,58,40],[562,293,60,40]].some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1.01),`change outside eyes at ${x},${y}`);}}
  assert.ok(changed>1000);
 }
});
