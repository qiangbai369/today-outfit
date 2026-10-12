const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const meta=require('../mobile/拆解小样信息.json'),audit=require('../mobile/figure-audit.json');
test('all 24 reviewed figures use one framing standard, clean transparency and matching card assets',async()=>{
 assert.equal(Object.keys(audit.figures).length,24);
 for(const [id,entry]of Object.entries(audit.figures)){
  assert.equal(meta[id].figure,entry.figure);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mobile/'+entry.figure)).digest('hex'),entry.sha256,id);
  const img=await loadImage('mobile/'+entry.figure);assert.equal(img.width,1024,id);assert.equal(img.height,1536,id);
  const c=createCanvas(1024,1536),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,1024,1536).data;
  let top=1536,bottom=0,left=1024,right=0,headL=1024,headR=0;
  for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){let a=data[(y*1024+x)*4+3];if(a<128)continue;top=Math.min(top,y);bottom=Math.max(bottom,y+1);left=Math.min(left,x);right=Math.max(right,x+1);if(y<365){headL=Math.min(headL,x);headR=Math.max(headR,x+1);}}
  assert(Math.abs(top-48)<=2,id+' head top');assert(Math.abs(bottom-1488)<=2,id+' sole baseline');assert(Math.abs((headL+headR)/2-512)<=3,id+' head center');assert(left>16&&right<1008,id+' whole figure fits');
  for(const [x,y]of [[0,0],[1023,0],[0,1535],[1023,1535]])assert.equal(data[(y*1024+x)*4+3],0,id+' transparent corner');
  const card=await loadImage('mobile/thumbnails/'+id+'.webp');assert.equal(card.width,420);assert.equal(card.height,630);
  assert.equal(entry.canonical,{sweet:'sweet-summer-a',cool:'cool-summer-a',literary:'literary-spring-a'}[id.split('-')[0]]);
 }
});
test('identity correction preserves all 108 existing item images and descriptions',()=>{
 let n=0;for(const entry of Object.values(meta)){for(const item of entry.items){assert(!item.image.includes('/unified/'));assert(fs.existsSync('mobile/'+item.image));assert(item.name&&item.description);n++;}}assert.equal(n,108);
});
