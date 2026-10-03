const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),R=require('../renderer-v2.js');
const root=path.resolve(__dirname,'..');
const renderer=R.createRenderer({createCanvas,loadImage:f=>loadImage(path.join(root,f))});
test('changing a fitted top keeps the exact approved head and chosen trousers and shoes',async()=>{
 const outfit={top:'shared-top-01',bottom:'sweet-bottom-02',dress:null,shoes:'sweet-shoes-01',outer:null,bag:null,legwear:null};
 const a=await renderer.compose({character:'sweet',outfit}),b=await renderer.compose({character:'sweet',outfit:{...outfit,top:'shared-top-02'}});
 const pixels=(c,x,y,w,h)=>Buffer.from(c.getContext('2d').getImageData(x,y,w,h).data);
 assert.deepEqual(pixels(a.figure,0,0,1024,470),pixels(b.figure,0,0,1024,470));
 assert.deepEqual(pixels(a.figure,405,980,255,300),pixels(b.figure,405,980,255,300));
 assert.deepEqual(pixels(a.figure,250,1390,520,130),pixels(b.figure,250,1390,520,130));
 assert.notDeepEqual(pixels(a.figure,450,500,150,160),pixels(b.figure,450,500,150,160));
 const approved=await loadImage(path.resolve(root,'assets/characters/sweet/original.png')),master=createCanvas(1024,1536);master.getContext('2d').drawImage(approved,0,0);
 assert.deepEqual(pixels(a.figure,0,0,1024,470),pixels(master,0,0,1024,470));
});
test('a failed garment load rejects preparation instead of exposing a partial outfit',async()=>{
 const broken=R.createRenderer({createCanvas,loadImage:async f=>{if(f.includes('shared-top-04'))throw Error('missing garment');return loadImage(path.join(root,f));}});
 await assert.rejects(broken.compose({character:'sweet',outfit:{top:'shared-top-04',bottom:'sweet-bottom-02',dress:null,shoes:'sweet-shoes-01',outer:null,bag:null,legwear:null}}),/missing garment/);
});
test('shorts and a shoe swap cannot bring the original long skirt back',async()=>{
 const outfit={top:'shared-top-01',bottom:'shared-bottom-04',dress:null,shoes:'shared-shoes-02',outer:null,bag:null,legwear:null};
 const a=await renderer.compose({character:'sweet',outfit});
 const x=a.figure.getContext('2d');
 assert.equal(x.getImageData(300,1230,1,1).data[3],0,'outside the shorts and legs must remain transparent');
 const b=await renderer.compose({character:'sweet',outfit:{...outfit,shoes:'shared-shoes-03'}});
 assert.deepEqual(Buffer.from(x.getImageData(0,0,1024,1335).data),Buffer.from(b.figure.getContext('2d').getImageData(0,0,1024,1335).data));
});
test('long trousers preserve their complete native hem rather than being cut at the ankle',async()=>{
 const a=await renderer.compose({character:'sweet',outfit:{top:'shared-top-01',bottom:'shared-bottom-01',dress:null,shoes:'shared-shoes-02',outer:null,bag:null,legwear:null}});
 const p=a.figure.getContext('2d').getImageData(450,1355,1,1).data;
 assert.ok(p[3]>200&&p[2]>p[0],'blue trouser fabric must continue to its native hem');
});
test('pinafore inner changes retain the navy bib and remove blue horizontal fragments',async()=>{
 const a=await renderer.compose({character:'literary',outfit:{top:'shared-top-04',bottom:null,dress:'literary-dress-01',shoes:'shared-shoes-01',outer:null,bag:null,legwear:null}});
 const x=a.figure.getContext('2d'),p=x.getImageData(495,625,1,1).data,q=x.getImageData(330,631,1,1).data;
 assert.ok(p[2]>p[0]&&p[0]<110,'the navy bib survives the inner shirt');
 assert.ok(q[0]>=q[2]-5,'white shirt sleeve must not retain an old blue band');
});
test('cool tights cover both complete legs without importing their source shorts',async()=>{
 const a=await renderer.compose({character:'cool',outfit:{...require('../catalog-v2').defaultOutfit('cool'),legwear:'shared-legwear-01'}}),x=a.figure.getContext('2d');
 const leg=x.getImageData(375,1200,1,1).data,hem=x.getImageData(410,955,1,1).data;
 assert.ok(Math.max(...leg.slice(0,3))<150&&leg[3]>200,'left leg must not retain a stripe of bare skin');
 assert.ok(hem[2]>hem[0],'selected blue denim shorts must remain blue');
});
test('a cool untucked tee retains its curved native hem below the waist',async()=>{
 const a=await renderer.compose({character:'cool',outfit:require('../catalog-v2').defaultOutfit('cool')}),p=a.figure.getContext('2d').getImageData(386,790,1,1).data;
 assert.ok(p[0]>p[2]&&p[1]>p[2]&&p[0]<160,'olive native hem must cover the former black master hem');
});
test('blinking changes only the eyes while preserving every worn garment',async()=>{
 const p=await renderer.compose({character:'sweet',outfit:{...require('../catalog-v2').defaultOutfit('sweet'),outer:'sweet-outer-01'}}),a=createCanvas(1024,1536),b=createCanvas(1024,1536);renderer.draw(a,p);renderer.draw(b,p,{blink:true});
 const pixels=(c,y,h)=>Buffer.from(c.getContext('2d').getImageData(0,y,1024,h).data);
 assert.deepEqual(pixels(a,470,1066),pixels(b,470,1066));assert.notDeepEqual(pixels(a,250,90),pixels(b,250,90));
});
test('boots worn under long trousers cannot paint shaft rectangles over the trouser legs',async()=>{
 const C=require('../catalog-v2'),outfit={...C.defaultOutfit('cool'),top:'shared-top-04',bottom:'shared-bottom-01'};
 const a=await renderer.compose({character:'cool',outfit:{...outfit,shoes:'shared-shoes-01'}}),b=await renderer.compose({character:'cool',outfit:{...outfit,shoes:'shared-shoes-04'}});
 assert.deepEqual(Buffer.from(a.figure.getContext('2d').getImageData(350,1285,390,85).data),Buffer.from(b.figure.getContext('2d').getImageData(350,1285,390,85).data));
});
test('long coat native contour excludes the original cream skirt below both hems',async()=>{
 const a=await renderer.compose({character:'sweet',outfit:{...require('../catalog-v2').defaultOutfit('sweet'),outer:'sweet-outer-01'}}),x=a.figure.getContext('2d');
 assert.equal(x.getImageData(332,1175,1,1).data[3],0);assert.equal(x.getImageData(710,1180,1,1).data[3],0);
});
test('light cardigan fabric highlights stay intact rather than becoming transparent holes',async()=>{
 const a=await renderer.compose({character:'literary',outfit:{...require('../catalog-v2').defaultOutfit('literary'),outer:'literary-outer-01'}}),p=a.figure.getContext('2d').getImageData(615,800,1,1).data;
 assert.ok(p[0]>190&&Math.max(...p.slice(0,3))-Math.min(...p.slice(0,3))<15,'native grey highlight must remain grey');
});
test('native wide trouser hems are not clipped by the narrow ankle repair region',async()=>{
 const C=require('../catalog-v2'),a=await renderer.compose({character:'cool',outfit:{...C.defaultOutfit('cool'),bottom:'cool-bottom-01',shoes:'shared-shoes-04'}}),source=await loadImage(path.join(root,C.fit('cool','cool-bottom-01').file)),c=createCanvas(1024,1536),x=c.getContext('2d');x.drawImage(source,0,0);
 const native=x.getImageData(340,1378,1,1).data,actual=a.figure.getContext('2d').getImageData(340,1378,1,1).data;assert.ok(native[3]>200);assert.ok(actual[3]>200,'outer trouser seam must survive the shoe change');
});
test('approved hair overlay cannot carry original sleeve or skin fragments over a new outer sleeve',async()=>{
 const C=require('../catalog-v2');
 for(const outer of ['sweet-outer-01','shared-outer-01','shared-outer-02','shared-outer-03']){
  const p=await renderer.compose({character:'sweet',outfit:{...C.defaultOutfit('sweet'),outer}}),source=await loadImage(path.join(root,C.fit('sweet',outer).file)),c=createCanvas(1024,1536),x=c.getContext('2d');x.drawImage(source,0,0);
  const native=x.getImageData(360,675,1,1).data,actual=p.figure.getContext('2d').getImageData(360,675,1,1).data;
  assert.ok(Math.max(...[0,1,2].map(k=>Math.abs(native[k]-actual[k])))<=3,`${outer} must show its own continuous sleeve fabric`);
 }
});
test('short outer sleeves preserve the chosen skirt beside both hands without cream skirt fragments or holes',async()=>{
 const C=require('../catalog-v2'),base=C.defaultOutfit('sweet'),a=await renderer.compose({character:'sweet',outfit:base});
 for(const outer of ['shared-outer-01','shared-outer-03']){
  const p=await renderer.compose({character:'sweet',outfit:{...base,outer}});
  for(const [x,y] of [[674,831],[335,975],[368,977]]){
   const expected=a.figure.getContext('2d').getImageData(x,y,1,1).data,actual=p.figure.getContext('2d').getImageData(x,y,1,1).data;
   assert.ok(actual[3]>200&&Math.max(...[0,1,2].map(k=>Math.abs(expected[k]-actual[k])))<4,`${outer} must preserve the selected skirt beside the hand`);
  }
 }
});
