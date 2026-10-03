const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../model-v2'),N=require('../data/needs'),R=require('../rules-v2');
test('purpose ranking distinguishes date, party, shopping and sightseeing within compatible clothes for all characters',()=>{
 for(const character of ['sweet','cool','literary'])for(const season of ['spring','summer','autumn','winter']){
  const signatures=[];
  for(const activity of ['date','party','shopping','sightseeing']){const n=N.normalizeNeed({activity,season}),result=M.recommend(character,n);assert.equal(result.outfits.length,3);for(const o of result.outfits){assert.ok(M.validate(character,o,n).valid);const why=M.explain(o,n);assert.ok(why.length<65);assert.match(why,/约会|聚会|逛街|打卡/);if(n.walking==='many')assert.match(why,/走路较多/);}signatures.push(M.signature(result.outfits[0]));}
  assert.ok(new Set(signatures).size>=3,`${character}/${season} should have at least three distinct leading purpose suggestions`);
 }
});
test('purpose weights never bypass locks, excluded pieces, owned-only choices or formal and walking requirements',()=>{
 for(const character of ['sweet','cool','literary']){const n=N.normalizeNeed({activity:'sightseeing',season:'spring'}),o=M.recommend(character,n).outfits[0],owned=Object.values(o).filter(Boolean),options={locks:{bottom:o.bottom},owned,strictOwned:true,excluded:['pink']};const r=M.recommend(character,n,options);assert.ok(r.outfits.length);for(const fit of r.outfits){assert.equal(fit.bottom,o.bottom);assert.ok(M.validate(character,fit,n,options).valid);}const formal=N.normalizeNeed({activity:'date',detail:'dinner',season:'spring'});for(const fit of M.recommend(character,formal).outfits)assert.ok(M.validate(character,fit,formal).valid);}
});
test('recommendation explanations reflect the current bag, shoes and weather rather than changed slots',()=>{
 const n=N.normalizeNeed({activity:'class',season:'spring'}),o=M.recommend('sweet',n).outfits[0];assert.match(R.explain(o,n),/大包.*学习用品.*上课/);assert.doesNotMatch(R.explain({...o,bag:'shared-bag-02'},n),/大包/);assert.match(R.explain(o,{activity:'shopping',season:'winter'}),/逛街/);assert.doesNotMatch(R.explain({...o,shoes:'literary-shoes-01'},{activity:'sightseeing',walking:'many'}),/鞋款适合走路较多/);
});
