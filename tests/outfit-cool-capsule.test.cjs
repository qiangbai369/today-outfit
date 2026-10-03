const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),C=require('../catalog-v2'),M=require('../model-v2'),N=require('../data/needs'),R=require('../renderer-v2');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
const root=path.resolve(__dirname,'..'),renderer=R.createRenderer({createCanvas,loadImage:f=>loadImage(path.join(root,f))});
const pixels=(c,x,y,w,h)=>Buffer.from(c.getContext('2d').getImageData(x,y,w,h).data);
test('all eight approved looks preserve the identical approved face and can blink without changing clothes',async()=>{
 const approved=createCanvas(1024,1536);approved.getContext('2d').drawImage(await loadImage(path.join(root,'assets/characters/cool/original.png')),0,0);
 assert.equal(C.looksFor('cool').length,8);
 for(const l of C.looksFor('cool')){assert.ok(C.visualValidate('cool',l.outfit).valid);const p=await renderer.compose({character:'cool',outfit:l.outfit}),a=createCanvas(1024,1536),b=createCanvas(1024,1536);assert.equal(hash(pixels(p.figure,0,0,1024,385)),hash(pixels(approved,0,0,1024,385)));const original=pixels(approved,0,385,1024,50),actual=pixels(p.figure,0,385,1024,50);let differences=0;for(let k=0;k<original.length;k+=4)if(original[k+3]===255)for(let j=0;j<4;j++)if(actual[k+j]!==original[k+j])differences++;assert.equal(differences,0,'approved jaw and hair pixels cannot change');renderer.draw(a,p);renderer.draw(b,p,{blink:true});assert.deepEqual(pixels(a,0,435,1024,1101),pixels(b,0,435,1024,1101));assert.notDeepEqual(pixels(a,365,265,285,80),pixels(b,365,265,285,80));}
});
test('independent summer top and shoe changes preserve the selected trousers and face',async()=>{
 const o=C.looksFor('cool').find(l=>l.id==='cool-summer-b').outfit,a=await renderer.compose({character:'cool',outfit:o}),b=await renderer.compose({character:'cool',outfit:{...o,shoes:'cool-2026-spring-b-shoes'}}),d=await renderer.compose({character:'cool',outfit:{...o,top:'cool-2026-summer-a-top'}});
 for(const p of [b,d]){assert.deepEqual(pixels(a.figure,0,0,1024,435),pixels(p.figure,0,0,1024,435));assert.deepEqual(pixels(a.figure,345,835,350,460),pixels(p.figure,345,835,350,460));}
 assert.deepEqual(pixels(a.figure,310,1445,425,45),pixels(d.figure,310,1445,425,45));assert.notDeepEqual(pixels(a.figure,310,1445,425,45),pixels(b.figure,310,1445,425,45));
});
test('capsule locks and actual garment IDs survive save and restore',()=>{
 const s=M.createState();s.character='cool';s.roles.cool.outfit={...C.looksFor('cool')[7].outfit};s.roles.cool.lastSplit={top:s.roles.cool.outfit.top,bottom:s.roles.cool.outfit.bottom};s.roles.cool.locks={bottom:s.roles.cool.outfit.bottom};const r=M.record(s,{id:'capsule',name:'冬2'});assert.ok(M.validateRecord(r).valid);const restored=M.restore(M.createState(),r);assert.deepEqual(restored.roles.cool.outfit,s.roles.cool.outfit);assert.deepEqual(restored.roles.cool.locks,s.roles.cool.locks);assert.throws(()=>M.change('cool',restored.roles.cool,'bottom','cool-2026-spring-a-bottom'),/解锁/);
});
test('archived cool garments remain valid in saved outfits and travel records',()=>{
 const s=M.createState(),o={top:'cool-top-01',bottom:'cool-bottom-02',shoes:'cool-shoes-02',dress:null,outer:null,bag:null,legwear:null};s.character='cool';s.roles.cool={outfit:o,locks:{bottom:o.bottom},lastSplit:{top:o.top,bottom:o.bottom},seen:[]};const r=M.record(s,{id:'old',name:'旧搭配'});assert.ok(M.validateRecord(r).valid);assert.deepEqual(M.restore(M.createState(),r).roles.cool.outfit,o);const n=N.normalizeNeed({activity:'short-trip',days:2,walking:'normal',warmth:'mild'}),t={character:'cool',baseNeed:n,days:[1,2].map(day=>({day,need:n,outfit:{...o},locks:{},reason:null})),sharedLocks:{bottom:o.bottom},noReuseItems:[],quantities:{[o.bottom]:2},lightPacking:false};assert.ok(M.validateRecord(M.recordTrip(s,t,{id:'old-trip',name:'旧旅行'})).valid);
});
