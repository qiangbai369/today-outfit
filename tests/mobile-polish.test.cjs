const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../mobile/体验工具.js'),F=require('../mobile/收藏逻辑.js'),{LOOKS}=require('../previews/complete-looks/data.js');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
test('backup merges without deleting existing metadata or unknown legacy entries, repeated imports deduplicate',()=>{
 const original=[{id:'sweet-summer-a',light:'warm'},'legacy-unknown'];
 const text=JSON.stringify(E.backup(['sweet-summer-a','cool-summer-a'],LOOKS));
 const result=E.mergeBackup(text,original,LOOKS);
 assert.deepEqual(result,[...original,'cool-summer-a']);assert.deepEqual(E.mergeBackup(text,result,LOOKS),result);
 for(const text of ['{}','broken',JSON.stringify({format:'outfit-favorites',version:1,records:['unknown']})])assert.throws(()=>E.mergeBackup(text,original,LOOKS));
 assert.deepEqual(original,[{id:'sweet-summer-a',light:'warm'},'legacy-unknown']);
});
test('all collection displays valid saved looks across characters newest first',()=>{
 assert.deepEqual(F.orderedIds(['sweet-summer-a','cool-summer-a','unknown'],LOOKS,'all'),['cool-summer-a','sweet-summer-a']);
});
test('season browsing stays inside requested season, restored route and full browsing session survive',async()=>{
 const app=boot({historyEnabled:true,sample:''});await flush();
 const select=app.elements.get('season-filter');select.value='winter';select.handlers.change();
 app.elements.get('character-choices').children[0].handlers.click();await flush();
 for(let n=0;n<5;n++) {assert.match(app.elements.get('stage').dataset.look,/winter/);app.document.handlers.keydown({key:'ArrowDown',preventDefault(){}});await flush();}
 assert.equal(app.history.state.outfitMobile.season,'winter');
 assert.equal(app.store.has('today-outfit-mobile-demo-sessions-v1'),false);
 app.history.back();await flush();assert.equal(app.elements.get('picker').hidden,false);assert.equal(select.value,'winter');
});
