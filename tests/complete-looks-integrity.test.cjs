const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../previews/complete-looks/gallery.js');
const root=path.resolve(__dirname,'../previews/complete-looks');
test('every approved complete look has all three public actions backed by an existing whole figure',()=>{
 assert.equal(G.LOOKS.length,24);
 let actions=0;
 for(const look of G.LOOKS){
  assert.ok(fs.existsSync(path.join(root,look.cartoon)),look.id);
  const publicActions=G.actionsFor(look.id);assert.equal(publicActions.length,3);
  for(const action of publicActions){assert.ok(action.supported,look.id+':'+action.id);const asset=look.poses[action.id];assert.ok(fs.existsSync(path.join(root,typeof asset==='string'?asset:asset.image)));actions++;}
 }
 assert.equal(actions,72);
});
