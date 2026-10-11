const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {boot,flush}=require('./helpers/mobile-harness.cjs');
const data=require('../previews/complete-looks/data.js');
const meta=JSON.parse(fs.readFileSync('mobile/拆解小样信息.json'));
test('all 24 complete looks expand every corresponding item and collapse safely',async()=>{
 for(const look of data.LOOKS){
  const app=boot({sample:look.id});await flush();
  assert.equal(app.elements.get('stage').dataset.look,look.id);
  app.elements.get('figure').handlers.click({detail:0});await flush();
  assert.equal(app.elements.get('items').children.length,meta[look.id].items.length,look.id);
  assert.ok(app.elements.get('items').children.every(item=>item.dataset.failed!=='true'),look.id);
  app.elements.get('collapse').handlers.click();await flush();
  assert.equal(app.elements.get('stage').classList.contains('expanded'),false);
  assert.equal(app.elements.get('items').inert,true);
 }
});
test('refresh restores collection-only browsing and expanded state',async()=>{
 const route={view:'stage',character:'sweet',favoriteCharacter:'sweet',browseMode:'favorites',favoritesReturn:'picker',order:['sweet-spring-a','sweet-summer-a'],index:0,finished:false,expanded:true,depth:2};
 const app=boot({historyEnabled:true,route,favorites:[...route.order].reverse(),sample:'sweet-spring-a'});await flush();
 assert.equal(app.elements.get('stage').dataset.browse,'favorites');
 assert.equal(app.elements.get('stage').classList.contains('expanded'),true);
 assert.equal(app.elements.get('items').children.length,4);
 app.document.handlers.keydown({key:'ArrowDown',preventDefault(){}});await flush();
 assert.equal(app.elements.get('stage').dataset.look,'sweet-summer-a');
});
test('bad sample opens character picker and never displays an invalid figure',async()=>{
 const app=boot({sample:'does-not-exist'});await flush();assert.equal(app.elements.get('picker').hidden,false);assert.equal(app.elements.get('stage').hidden,true);
});
test('old dress-up bookmarks resolve only to an existing complete look',()=>{
 const html=fs.readFileSync('mobile/搭配.html','utf8'),script=html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
 for(const base of ['sweet-spring-a','not-a-look','https://example.com']){let result;vm.runInNewContext(script,{URL,URLSearchParams,window:{CompleteLookData:data},location:{search:'?base='+encodeURIComponent(base),href:'https://qiangbai369.github.io/today-outfit/mobile/搭配.html',replace:url=>{result=url;}}});const url=new URL(result);assert.equal(url.pathname,'/today-outfit/mobile/');assert.equal(url.searchParams.get('sample'),base==='sweet-spring-a'?base:null);}
});
