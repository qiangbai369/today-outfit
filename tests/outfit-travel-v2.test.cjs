const test=require('node:test'),assert=require('node:assert/strict'),T=require('../travel-v2.js'),M=require('../model-v2.js'),N=require('../data/needs.js');
const need=()=>N.normalizeNeed({activity:'short-trip',days:3,season:'spring',warmth:'mild'});
test('trip duration is bounded and each day can have its own purpose and locks',()=>{
 assert.throws(()=>T.create('cool',need(),0),/1—7/);assert.throws(()=>T.create('cool',need(),8),/1—7/);
 let trip=T.create('cool',need(),3);trip.days[1].need=N.normalizeNeed({activity:'date',warmth:'mild'});trip.days[0].locks={bottom:'cool-bottom-02'};trip=T.generate(trip);assert.equal(trip.days.length,3);assert.equal(trip.days[0].outfit.bottom,'cool-bottom-02');assert.equal(trip.days[1].need.activity,'date');assert.deepEqual(trip.days[1].locks,{});
 const old=structuredClone(trip.days[2]),changed={...trip.days[1].outfit,bag:'shared-bag-02'};trip=T.changeDay(trip,1,changed);assert.deepEqual(trip.days[2],old);
});
test('whole trip item reuse and item exclusion have explicit conflicts without silent relaxation',()=>{
 let trip=T.create('literary',need(),3);trip.sharedLocks={shoes:'shared-shoes-01'};trip=T.generate(trip);for(const day of trip.days)assert.equal(day.outfit.shoes,'shared-shoes-01');
 trip.noReuseItems=['shared-shoes-01'];trip=T.generate(trip);assert.ok(trip.days[0].outfit);assert.equal(trip.days[1].outfit,null);assert.match(trip.days[1].reason,/复用|锁定/);
});
test('packing deduplicates, credits the first worn set and preserves quantities when reopened',()=>{
 let trip=T.generate(T.create('sweet',need(),3));const first=trip.days[0].outfit;trip.days[1].outfit={...first};trip.days[2].outfit={...first};const id=first.top;trip.quantities[id]=3;const rows=T.packing(trip);assert.equal(rows.find(r=>r.itemId===id).count,3);assert.equal(rows.find(r=>r.itemId===id).packedCount,2);assert.equal(rows.find(r=>r.itemId===first.shoes).packedCount,0);assert.equal(new Set(rows.map(r=>r.itemId)).size,rows.length);
 let state=M.createState();const r=M.recordTrip(state,trip,{id:'trip',name:'周末'});assert.equal(M.validateRecord(r).valid,true);state=M.restore(state,r);assert.equal(state.trip.quantities[id],3);assert.equal(T.packing(state.trip).find(r=>r.itemId===id).packedCount,2);
});
test('resizing preserves existing days and does not accidentally share lock objects',()=>{
 let trip=T.create('cool',need(),2);trip.days[0].locks={top:'shared-top-01'};trip=T.resize(trip,7);trip.days[6].locks.top='shared-top-02';assert.equal(trip.days[0].locks.top,'shared-top-01');assert.deepEqual(trip.days[1].locks,{});trip=T.resize(trip,1);assert.equal(trip.days.length,1);
});
test('manual changes cannot reuse an explicitly non-reusable item on another day',()=>{
 let trip=T.generate(T.create('cool',need(),2));const id=trip.days[0].outfit.shoes;trip.noReuseItems=[id];const next={...trip.days[1].outfit,shoes:id};assert.throws(()=>T.changeDay(trip,1,next),/复用/);
});
test('travel generation reserves a later locked non-reusable item instead of manufacturing no solution',()=>{
 let trip=T.create('sweet',need(),2);trip.days[1].locks={shoes:'shared-shoes-01'};trip.noReuseItems=['shared-shoes-01'];trip=T.generate(trip);
 assert.ok(trip.days[0].outfit);assert.notEqual(trip.days[0].outfit.shoes,'shared-shoes-01');assert.equal(trip.days[1].outfit.shoes,'shared-shoes-01');
});
test('day suggestions honor other days non-reusable pieces and own independent locks',()=>{
 let trip=T.create('sweet',need(),2);trip.days[0].locks={shoes:'shared-shoes-01'};trip.noReuseItems=['shared-shoes-01'];trip=T.generate(trip);
 const r=T.recommendDay(trip,1);assert.ok(r.outfits.length);for(const o of r.outfits){assert.notEqual(o.shoes,'shared-shoes-01');assert.doesNotThrow(()=>T.changeDay(trip,1,o));}
});
