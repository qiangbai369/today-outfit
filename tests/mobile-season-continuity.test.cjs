const test=require('node:test'),assert=require('node:assert/strict');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
const {LOOKS}=require('../previews/complete-looks/data.js');
const arrow=key=>({key,preventDefault(){}});
test('changing seasons discards the prior round from another browsing pool',async()=>{
 const app=boot();await flush();
 for(let n=0;n<8;n++){app.document.handlers.keydown(arrow('ArrowDown'));await flush();}
 app.elements.get('character-back').handlers.click();await flush();
 const filter=app.elements.get('season-filter');filter.value='winter';filter.handlers.change();
 app.elements.get('character-choices').children[0].handlers.click();await flush();
 const current=app.elements.get('stage').dataset.look;
 app.document.handlers.keydown(arrow('ArrowUp'));await flush();
 assert.equal(app.elements.get('stage').dataset.look,current);
 assert.equal(app.elements.get('feedback-text').textContent,'');
 assert.equal(app.elements.get('notice').textContent,'已经是第一套');
});
test('reloading collection from a filtered picker does not require a valid stage index',async()=>{
 const order=LOOKS.filter(l=>l.character==='sweet').map(l=>l.id);
 const route={view:'favorites',character:'sweet',favoriteCharacter:'sweet',browseMode:'all',favoritesReturn:'picker',season:'winter',order,index:7,finished:false,expanded:false,depth:1};
 const app=boot({historyEnabled:true,route,favorites:['sweet-summer-a'],sample:null});await flush();
 assert.equal(app.elements.get('favorites').hidden,false);
 assert.equal(app.elements.get('favorite-photos').children.length,1);
 assert.equal(app.elements.get('season-filter').value,'winter');
});
