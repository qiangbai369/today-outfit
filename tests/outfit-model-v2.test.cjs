const test=require('node:test'),assert=require('node:assert/strict'),M=require('../model-v2.js'),N=require('../data/needs.js');
test('all three characters have three default suggestions for each activity and thermal condition',()=>{
 for(const c of M.CHARACTERS)for(const a of N.ACTIVITIES)for(const w of N.WARMTH){const need=N.normalizeNeed({activity:a.id,season:'spring',warmth:w.id}),r=M.recommend(c.id,need);assert.equal(r.outfits.length,3,`${c.id}/${a.id}/${w.id}: ${r.reason}`);for(const o of r.outfits)assert.equal(M.validate(c.id,o,need).valid,true);}
});
test('strict owned and exclusions never silently relax or switch characters',()=>{
 const need=N.normalizeNeed({activity:'date',warmth:'hot'});assert.equal(M.recommend('cool',need,{strictOwned:true,owned:[]}).outfits.length,0);
 const r=M.recommend('sweet',need,{excluded:['skirt','dress']});assert.equal(r.outfits.length,3);for(const o of r.outfits)assert.equal(M.item(o.bottom).kind==='skirt'||!!o.dress,false);
});
test('locks retain every selected piece including when only shoes can change',()=>{
 const need=N.normalizeNeed({activity:'date',warmth:'mild'}),o=M.recommend('cool',need).outfits[0],locks=Object.fromEntries(M.SLOTS.filter(s=>s!=='shoes').map(s=>[s,o[s]]));
 const r=M.recommend('cool',need,{locks});assert.ok(r.outfits.length);for(const look of r.outfits)for(const [s,id]of Object.entries(locks))assert.equal(look[s],id);
 const impossible=M.recommend('cool',{...need,warmth:'cold'},{locks:{shoes:'cool-shoes-02'}});assert.equal(impossible.outfits.length,0);assert.match(impossible.reason,/锁定/);
});
test('seen exhaustion is honest and adoption changes only after explicit use',()=>{
 const n=N.normalizeNeed({activity:'class',warmth:'cold'}),first=M.recommend('literary',n,{limit:50}),seen=first.outfits.map(M.signature);let result=M.recommend('literary',n,{seen,limit:50});while(result.outfits.length){seen.push(...result.outfits.map(M.signature));result=M.recommend('literary',n,{seen,limit:50});}assert.equal(result.exhausted,true);
 let s=M.createState();assert.deepEqual(s.adopted,[]);s=M.adopt(s,'sweet',M.defaultOutfit('sweet'),123);assert.equal(s.adopted.length,1);assert.equal(s.adopted[0].time,123);
});
test('saved records retain actual items, dress restoration and independent role locks',()=>{
 let s=M.createState();s.roles.sweet=M.change('sweet',s.roles.sweet,'dress','sweet-dress-01');const r=M.record(s,{id:'x',name:'我的一身'});assert.equal(M.validateRecord(r).valid,true);const restored=M.restore(M.createState(),r);assert.equal(restored.roles.sweet.outfit.dress,'sweet-dress-01');assert.equal(restored.roles.cool.outfit.top,M.defaultOutfit('cool').top);assert.equal(M.validateRecord({...r,outfit:{...r.outfit,shoes:'cool-shoes-01'}}).valid,false);
 const split=M.change('sweet',restored.roles.sweet,'dress',null);assert.ok(split.outfit.top&&split.outfit.bottom);assert.equal(split.outfit.dress,null);
});
test('trying a suggestion remains separate from actually adopting it',()=>{
 const state=M.createState(),tried=M.tryOn(state,'sweet',M.defaultOutfit('sweet'),456);
 assert.equal(tried.tried.length,1);assert.deepEqual(tried.adopted,[]);
 const adopted=M.adopt(tried,'sweet',M.defaultOutfit('sweet'),789);
 assert.equal(adopted.adopted.length,1);assert.equal(adopted.tried.length,1);
});
test('legacy scene records reopen in the studio without changing outfits or locks',()=>{
 const T=require('../travel-v2'),s=M.createState();s.roles.sweet.locks={shoes:s.roles.sweet.outfit.shoes};s.light='warm';
 const single=M.record(s,{id:'legacy-outfit',name:'saved outfit'}),need=N.normalizeNeed({activity:'short-trip',days:2,warmth:'mild'}),trip=M.recordTrip(s,T.generate(T.create('sweet',need,2)),{id:'legacy-trip',name:'saved trip'});
 for(const record of [single,trip])for(const background of ['city','bookshop','walk']){
  const legacy={...record,background},original=structuredClone(legacy),restored=M.restore(s,legacy);
  assert.equal(restored.background,'studio');assert.equal(restored.light,'warm');assert.deepEqual(legacy,original);
  if(record.kind==='outfit'){assert.deepEqual(restored.roles.sweet.outfit,record.outfit);assert.deepEqual(restored.roles.sweet.locks,record.locks);}else assert.deepEqual(restored.trip,record.trip);
 }
 assert.equal(M.record({...s,background:'city'},{id:'new',name:'new'}).background,'studio');
});
test('color exclusions retain a bounded category-specific recommendation search',()=>{
 const old=M.visualValidate,C=require('../catalog-v2.js');let calls=0;C.visualValidate=(...args)=>{calls++;return old(...args);};try{const r=M.recommend('cool',N.normalizeNeed({activity:'class',warmth:'mild'}),{excluded:['black']});assert.equal(r.outfits.length,3);assert.ok(calls<50000,`invalid cross-category pool created ${calls} candidates`);}finally{C.visualValidate=old;}
});
test('invalid stored rows remain exportable without throwing through the whole library',()=>{
 const T=require('../travel-v2'),s=M.createState(),need=N.normalizeNeed({activity:'short-trip',days:2,warmth:'mild'}),trip=T.generate(T.create('sweet',need,2)),r=M.recordTrip(s,trip,{id:'trip',name:'trip'});
 const badRows=[{...M.record(s,{id:'x',name:'x'}),outfit:undefined,locks:{top:'shared-top-01'}},{...r,trip:{...trip,days:[null]}},{...r,trip:{...trip,noReuseItems:{}}},{...r,trip:{...trip,days:'bad'}},{...r,trip:{...trip,sharedLocks:[]}}];
 for(const bad of badRows){assert.doesNotThrow(()=>M.validateRecord(bad));assert.equal(M.validateRecord(bad).valid,false);}
 const pending=structuredClone(r);pending.trip.days[0].outfit=null;pending.trip.days[0].reason='供给不足';pending.trip.days[1].locks={shoes:pending.trip.days[1].outfit.shoes};assert.deepEqual(M.restore(s,pending).roles.sweet.locks,{});
});
