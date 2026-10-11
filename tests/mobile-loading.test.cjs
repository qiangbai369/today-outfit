const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../previews/complete-looks/data.js');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
test('whole figure is displayed without fetching single-item images',async()=>{
 const app=boot();await flush();assert.equal(app.elements.get('stage').hidden,false);assert.equal(app.elements.get('stage').dataset.look,'sweet-summer-a');assert.equal(app.requests.length,2);assert.ok(app.requests.every(p=>p.startsWith('images/')));assert.equal(app.elements.get('items').children.length,0);
});
test('one failed item keeps other items visible and retry restores it',async()=>{
 const meta=JSON.parse(fs.readFileSync('mobile/拆解小样信息.json'));const broken=meta['sweet-summer-a'].items[0].image;
 const app=boot({failedImages:new Set([broken])});await flush();app.elements.get('figure').handlers.click({detail:0});await flush();
 const items=app.elements.get('items');assert.equal(items.children.length,4);assert.equal(items.children.filter(n=>n.dataset.failed==='true').length,1);assert.equal(app.elements.get('retry').hidden,false);assert.equal(app.elements.get('stage').hidden,false);
 app.failedImages.clear();app.elements.get('retry').handlers.click();await flush();assert.equal(items.children.filter(n=>n.dataset.failed==='true').length,0);assert.equal(app.elements.get('feedback').hidden,true);
});
test('metadata failure exposes retry outside the hidden stage',async()=>{
 const app=boot({metadataFails:true});await flush();assert.equal(app.elements.get('feedback').hidden,false);assert.equal(app.elements.get('retry').hidden,false);assert.ok(fs.readFileSync('mobile/index.html','utf8').indexOf('id="feedback"') > fs.readFileSync('mobile/index.html','utf8').indexOf('</main>'));
});
test('late item loading cannot replace content after collapse',async()=>{
 const app=boot();await flush();app.elements.get('figure').handlers.click({detail:0});app.elements.get('collapse').handlers.click();await flush();assert.equal(app.elements.get('stage').classList.contains('expanded'),false);assert.equal(app.elements.get('items').children.length,0);
});

test('failed figure offers retry and can enter after recovery',async()=>{
 const broken='images/sweet-summer-a.webp';
 const app=boot({failedImages:new Set([broken])});await flush();
 assert.equal(app.elements.get('feedback').hidden,false);assert.equal(app.elements.get('retry').hidden,false);
 app.failedImages.clear();app.elements.get('retry').handlers.click();await flush();
 assert.equal(app.elements.get('stage').hidden,false);assert.equal(app.elements.get('stage').dataset.look,'sweet-summer-a');
});
