const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../mobile/收藏逻辑.js'),G=require('../mobile/手势逻辑.js');
const looks=[{id:'a',character:'sweet'},{id:'b',character:'sweet'},{id:'c',character:'cool'}];
test('recent-first favorites deduplicate variants, filter role, and never change raw records',()=>{
 const records=[{id:'a',light:'natural',extra:'keep'},'unknown',{id:'c'},{id:'b'},{id:'a',light:'warm'}],before=JSON.stringify(records);
 assert.deepEqual(F.orderedIds(records,looks,'sweet'),['a','b']);assert.equal(JSON.stringify(records),before);
});
test('cancel one outfit and undo preserve every variant and unknown field',()=>{
 const records=[{id:'a',light:'natural',custom:{keep:true}},'unknown',{id:'b',motion:'wave'},{id:'a',light:'warm'}];
 const {remaining,removed}=F.remove(records,'a');assert.deepEqual(remaining,['unknown',{id:'b',motion:'wave'}]);assert.deepEqual(F.restore(remaining,[removed]),records);
});
test('undo keeps favorites added after cancellation and restores consecutive cancellations',()=>{
 const records=[{id:'a'},'unknown',{id:'b'}],first=F.remove(records,'a'),second=F.remove(first.remaining,'b');
 assert.deepEqual(F.restore([...second.remaining,{id:'c'}],[first.removed,second.removed]),[...records,{id:'c'}]);
});
test('undo retains duplicate original records and does not duplicate an exact concurrent re-add',()=>{
 const records=['a','a','unknown'],removed=F.remove(records,'a');assert.deepEqual(F.restore(removed.remaining,[removed.removed]),records);
 assert.deepEqual(F.restore(['a','unknown'],[F.remove(['a','unknown'],'a').removed]),['a','unknown']);
});
test('corrupt favorites are rejected and duplicate double-tap keeps existing raw fields',()=>{
 assert.throws(()=>F.read('{broken'));assert.throws(()=>F.read('{}'));
 const records=[{id:'a',light:'warm',extra:42},'unknown'];assert.deepEqual(G.addFavorite(JSON.stringify(records),'a'),records);
});
