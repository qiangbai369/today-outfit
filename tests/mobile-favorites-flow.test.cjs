const test=require('node:test'),assert=require('node:assert/strict');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
const key='today-outfit-complete-preview-favorites-v1';
const arrow=direction=>({key:direction,preventDefault(){}});
test('favorites browsing stays within saved looks and never overwrites the full browsing session',async()=>{
 const app=boot({favorites:['sweet-summer-a','sweet-spring-a']});await flush();
 const normal=app.store.get('today-outfit-mobile-demo-sessions-v1');
 app.elements.get('stage-favorites').handlers.click();
 let cards=app.elements.get('favorite-photos').children;
 assert.deepEqual(cards.map(c=>c.children[0].dataset.look),['sweet-spring-a','sweet-summer-a']);
 cards[0].children[0].handlers.click();await flush();
 assert.equal(app.elements.get('stage').dataset.look,'sweet-spring-a');assert.equal(app.elements.get('stage').dataset.browse,'favorites');
 app.document.handlers.keydown(arrow('ArrowDown'));await flush();assert.equal(app.elements.get('stage').dataset.look,'sweet-summer-a');
 app.document.handlers.keydown(arrow('ArrowDown'));await flush();assert.equal(app.elements.get('stage').dataset.look,'sweet-summer-a');
 app.document.handlers.keydown(arrow('ArrowUp'));await flush();assert.equal(app.elements.get('stage').dataset.look,'sweet-spring-a');
 assert.equal(app.store.get('today-outfit-mobile-demo-sessions-v1'),normal);
 app.elements.get('character-back').handlers.click();assert.equal(app.elements.get('favorites').hidden,false);
});
test('editing cancellation is reversible and the saved indicator updates when returning',async()=>{
 const original=[{id:'sweet-summer-a',light:'warm',custom:'keep'},'unknown'];
 const app=boot({favorites:original});await flush();assert.equal(app.elements.get('favorite-indicator').hidden,false);
 app.elements.get('stage-favorites').handlers.click();app.elements.get('favorites-edit').handlers.click();
 app.elements.get('favorite-photos').children[0].children[1].handlers.click();assert.deepEqual(JSON.parse(app.store.get(key)),['unknown']);
 app.elements.get('undo-favorite').handlers.click();assert.deepEqual(JSON.parse(app.store.get(key)),original);
 app.elements.get('favorites-back').handlers.click();assert.equal(app.elements.get('favorite-indicator').hidden,false);
});
test('corrupt records cannot be erased by the collection editor',async()=>{
 const raw='{broken',app=boot({favorites:raw});await flush();app.elements.get('stage-favorites').handlers.click();assert.equal(app.elements.get('favorite-empty').textContent,'收藏暂时无法读取');assert.equal(app.store.get(key),raw);
});
