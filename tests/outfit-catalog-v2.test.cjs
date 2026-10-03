const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../catalog-v2.js');
test('legacy designs and the approved capsule expose real fitted garments per character',()=>{
 assert.equal(C.ITEMS.length,83);
 for(const character of ['sweet','cool','literary']){
  const list=C.itemsFor(character);assert.equal(list.length,character==='cool'?35:30);assert.equal(new Set(list.map(i=>i.id)).size,list.length);
  for(const item of list){const fit=C.fit(character,item.id);assert.equal(fit.character,character);assert.equal(fit.itemId,item.id);assert.equal(fit.version,'native-2');assert.ok(fs.existsSync(path.resolve(__dirname,'..',fit.file)),character+':'+item.id);}
 }
 assert.throws(()=>C.fit('sweet','cool-outer-01'));
});
test('dress and split outfits preserve identity and restore the last valid separates',()=>{
 let role=C.createRole('sweet');const before={...role.outfit};role=C.change('sweet',role,'dress','sweet-dress-01');
 assert.equal(role.outfit.top,null);assert.equal(role.outfit.bottom,null);assert.equal(role.outfit.dress,'sweet-dress-01');
 role=C.change('sweet',role,'dress',null);assert.equal(role.outfit.top,before.top);assert.equal(role.outfit.bottom,before.bottom);
 assert.throws(()=>C.change('sweet',role,'shoes',null));
 role.locks.bottom=role.outfit.bottom;assert.throws(()=>C.change('sweet',role,'dress','sweet-dress-01'));
});
test('pinafore requires a reviewed inner shirt and keeps it in the actual checklist',()=>{
 const role=C.change('literary',C.createRole('literary'),'dress','literary-dress-01');
 assert.ok(['shared-top-04','literary-top-02','shared-top-03'].includes(role.outfit.top));assert.equal(role.outfit.bottom,null);
 assert.equal(C.checklist('literary',role.outfit).filter(i=>i.slot==='top').length,1);
 assert.throws(()=>C.change('literary',role,'top','shared-top-02'));
});
test('restoring long separates clears dress tights unless they were explicitly locked',()=>{
 for(const [character,dress]of [['sweet','sweet-dress-01'],['literary','literary-dress-01']]){
  let role=C.change(character,C.createRole(character),'bottom','shared-bottom-01');role=C.change(character,role,'dress',dress);role=C.change(character,role,'legwear','shared-legwear-01');
  const locked=structuredClone(role);locked.locks.legwear=locked.outfit.legwear;assert.throws(()=>C.change(character,locked,'dress',null),/解锁/);
  const restored=C.change(character,role,'dress',null);assert.equal(restored.outfit.bottom,'shared-bottom-01');assert.equal(restored.outfit.legwear,null);
 }
});
