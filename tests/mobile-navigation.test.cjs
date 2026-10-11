const test=require('node:test'),assert=require('node:assert/strict');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
const arrow=key=>({key,preventDefault(){}});
test('current look updates the share URL without adding a history entry for every swipe',async()=>{
 const app=boot({historyEnabled:true});await flush();const depth=app.history.state.outfitMobile.depth;
 app.document.handlers.keydown(arrow('ArrowDown'));await flush();
 assert.equal(new URL(app.location.href).searchParams.get('sample'),app.elements.get('stage').dataset.look);
 assert.equal(app.history.state.outfitMobile.depth,depth);
 app.history.back();await flush();assert.equal(app.elements.get('picker').hidden,false);
 app.history.forward();await flush();assert.equal(app.elements.get('stage').hidden,false);
});
test('browser back from collection restores the prior expanded outfit and forward restores the collection',async()=>{
 const app=boot({historyEnabled:true,favorites:['sweet-summer-a']});await flush();app.elements.get('figure').handlers.click({detail:0});await flush();
 app.elements.get('stage-favorites').handlers.click();assert.equal(new URL(app.location.href).searchParams.get('view'),'favorites');
 app.history.back();await flush();assert.equal(app.elements.get('stage').hidden,false);assert.equal(app.elements.get('stage').classList.contains('expanded'),true);
 app.history.forward();await flush();assert.equal(app.elements.get('favorites').hidden,false);
});
test('a new round avoids repeating the last look and downward browsing returns to the prior round',async()=>{
 const app=boot();await flush();
 for(let n=0;n<7;n++){app.document.handlers.keydown(arrow('ArrowDown'));await flush();}
 const last=app.elements.get('stage').dataset.look;
 app.document.handlers.keydown(arrow('ArrowDown'));await flush();
 assert.notEqual(app.elements.get('stage').dataset.look,last);
 app.document.handlers.keydown(arrow('ArrowUp'));await flush();assert.equal(app.elements.get('stage').dataset.look,last);
});
