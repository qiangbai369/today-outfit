const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/outfit-tabs-actions');
const {spawn}=require('node:child_process');
async function server(){const p=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1'],{cwd:root});const port=await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('server timeout')),10000);p.stdout.on('data',b=>{const m=String(b).match(/port (\d+)/);if(m){clearTimeout(timer);ok(m[1]);}});p.on('error',no);});return {p,url:`http://127.0.0.1:${port}/index.html`};}
const idle=p=>p.waitForFunction(()=>document.querySelector('#stage').getAttribute('aria-busy')==='false');
const session=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('today-outfit-session-v1')));
const thumbnail=p=>p.locator('#figure').evaluate(c=>{const t=document.createElement('canvas');t.width=240;t.height=360;t.getContext('2d').drawImage(c,0,0,240,360);return t.toDataURL('image/webp',.8);});
const pixels=p=>p.locator('#figure').evaluate(async c=>{const x=c.getContext('2d'),hash=async(y,h)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',x.getImageData(0,y,c.width,h).data))).join(',');return {head:await hash(0,470),body:await hash(470,c.height-470)};});
test('desktop has two persistent panels and one vertical scroller; mobile keeps everything reachable',async()=>{
 const s=await server(),url=s.url,b=await chromium.launch({headless:true});try{fs.mkdirSync(out,{recursive:true});
  for(const viewport of [{width:845,height:757},{width:1280,height:720},{width:1440,height:900},{width:390,height:844}]){
   const p=await b.newPage({viewport,reducedMotion:'reduce'});await p.goto(url);await idle(p);
   assert.equal(await p.locator('#tab-clothes').getAttribute('aria-selected'),'true');
   assert.equal(await p.locator('#panel-wearing').isVisible(),false);
   await p.locator('[data-owned]').first().check();const owned=(await session(p)).owned;
   await p.locator('#tab-wearing').click();await p.locator('[data-lock="bottom"]').click();
   const before=await session(p);await p.locator('#tab-clothes').click();assert.equal(await p.locator('[data-owned]').first().isChecked(),true);
   await p.locator('#tab-wearing').click();assert.equal(await p.locator('[data-lock="bottom"]').getAttribute('aria-pressed'),'true');
   await p.locator('#tab-clothes').click();assert.deepEqual(await session(p),before);assert.deepEqual(before.owned,owned);
   const geometry=await p.evaluate(()=>{const sel=s=>document.querySelector(s),box=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};};return {pageScroll:document.documentElement.scrollHeight-innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth,scrollers:[...sel('.controls').querySelectorAll('*'),sel('.controls')].filter(e=>e.getClientRects().length&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight).map(e=>e.id||e.className),row:[...sel('#items').children].slice(0,3).map(box),pane:box(sel('#control-content')),bar:box(sel('.action-bar'))};});
   assert.ok(geometry.horizontal<=1);if(viewport.width>760){assert.ok(geometry.pageScroll<=1);assert.deepEqual(geometry.scrollers,['wardrobe-body']);for(const card of geometry.row){assert.ok(card.top>=geometry.pane.top-1);assert.ok(card.bottom<=geometry.pane.bottom+1);}assert.ok(geometry.bar.bottom<=viewport.height);}
   else{assert.deepEqual(geometry.scrollers,[]);for(const character of ['cool','literary','sweet']){await p.locator(`[data-character="${character}"]`).click();await idle(p);assert.ok(await p.evaluate(()=>document.querySelector('#stage').getBoundingClientRect().bottom<=document.querySelector('.motion-controls').getBoundingClientRect().top),'actions must stay outside the character picture');}await p.locator('.preferences summary').click();await p.locator('#strict-owned').check();assert.ok((await session(p)).strictOwned);await p.locator('#tab-wearing').click();assert.ok(await p.locator('#save').isVisible());}
   await p.screenshot({path:path.join(out,`tabs-${viewport.width}.png`),fullPage:viewport.width<=760});await p.close();
  }
 }finally{await b.close();s.p.kill();}
});
test('change garments → real facial action → tabs → save keeps clothes and reopens matching thumbnails for all roles',async()=>{
 const s=await server(),url=s.url,b=await chromium.launch({headless:true});try{const p=await b.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await idle(p);
  for(const character of ['sweet','cool','literary']){
   await p.locator(`[data-character="${character}"]`).click();await idle(p);await p.locator('#tab-clothes').click();
   await p.locator('[data-category="top"]').click();await p.locator('[data-item="shared-top-04"]').click();await idle(p);
   await p.locator('[data-category="shoes"]').click();await p.locator('[data-item="shared-shoes-04"]').click();await idle(p);
   await p.locator('[data-category="outer"]').click();await p.locator('[data-item="shared-outer-01"]').click();await idle(p);await p.locator('[data-category="bag"]').click();await p.locator('[data-item="shared-bag-01"]').click();await idle(p);
   const before=await pixels(p),state=await session(p),actions=character==='sweet'?['smile','puff','blink']:['blink'];
   for(const action of actions){
    await p.locator(`button[data-motion="${action}"]`).click();await p.waitForFunction(id=>document.querySelector('#figure').dataset.motion===id,action);const after=await pixels(p);assert.equal(after.body,before.body,`${character}/${action} modified clothes, body or accessory`);assert.notEqual(after.head,before.head,`${action} must visibly change facial pixels`);
    await p.screenshot({path:path.join(out,`${character}-${action}.png`)});await p.locator('button[data-motion="neutral"]').click();
   }
   const legacy=character==='sweet'?['heart']:character==='cool'?['hat','arms','peace']:['glasses','wave','think'];
   for(const action of legacy){const button=p.locator(`button[data-motion="${action}"]`);assert.equal(await button.getAttribute('aria-disabled'),'true');assert.ok(await button.isDisabled());assert.match(await button.innerText(),/暂不可用/);assert.match(await p.locator('#motion-compatibility').innerText(),/不兼容/);}
   await p.locator(`button[data-motion="${character==='sweet'?'puff':'blink'}"]`).click();await p.waitForFunction(()=>document.querySelector('#figure').dataset.motion!=='neutral');
   await p.locator('#tab-wearing').click();await p.locator('[data-lock="top"]').click();await p.locator('#tab-clothes').click();assert.deepEqual((await session(p)).roles[character].outfit,state.roles[character].outfit);
   const expectedThumbnail=await thumbnail(p);await p.locator('#save').click();await p.locator('#plan-name').fill(`动作核对-${character}`);await p.locator('#confirm-save').click();await p.getByRole('heading',{name:'已保存',exact:true}).waitFor();await p.locator('#close-dialog').click();
   await p.locator('#library').click();const card=p.locator('.saved-card').filter({has:p.getByRole('heading',{name:`动作核对-${character}`,exact:true})});await card.waitFor();assert.equal(await card.locator('img').getAttribute('src'),expectedThumbnail,'saved thumbnail must be the displayed action and outfit');await p.screenshot({path:path.join(out,`${character}-saved.png`)});await card.locator('[data-reopen]').click();await idle(p);await p.waitForFunction(()=>document.querySelector('#figure').dataset.motion!=='neutral');
   assert.deepEqual((await session(p)).roles[character].outfit,state.roles[character].outfit);await p.locator('#tab-wearing').click();assert.equal(await p.locator('[data-lock="top"]').getAttribute('aria-pressed'),'true');await p.locator('[data-lock="top"]').click();await p.locator('button[data-motion="neutral"]').click();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({roles:['sweet','cool','literary'],sweetActions:['smile','puff','blink'],otherSupported:['blink'],clothesPixelsUnchanged:true,tabsKeepState:true,saveReopen:true,errors},null,2));
 }finally{await b.close();s.p.kill();}
});

test('late and failed facial assets cannot override a newer character or strand save controls',async()=>{
 const s=await server(),b=await chromium.launch({headless:true});let release;try{const p=await b.newPage({reducedMotion:'reduce'});await p.goto(s.url);await idle(p);
  await p.route('**/sweet-autumn-v1/smile.webp',r=>r.abort());await p.locator('button[data-motion="smile"]').click();await p.locator('#motion-note:not([hidden])').waitFor();await p.waitForFunction(()=>!document.querySelector('#save').disabled);assert.match(await p.locator('#motion-note').innerText(),/重试/);await p.unroute('**/sweet-autumn-v1/smile.webp');
  let notify;const requested=new Promise(ok=>notify=ok);await p.route('**/sweet-autumn-v1/smile.webp',async r=>{await new Promise(ok=>{release=ok;notify();});await r.continue();});await p.locator('button[data-motion="smile"]').click();await requested;await p.locator('[data-character="cool"]').click();await idle(p);const base=await pixels(p);release();await p.waitForTimeout(200);assert.deepEqual(await pixels(p),base);assert.equal(await p.locator('#figure').getAttribute('data-motion'),'neutral');assert.equal(await p.locator('#save').isEnabled(),true);
 }finally{release?.();await b.close();s.p.kill();}
});
