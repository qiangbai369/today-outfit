// Convert generated clothing layers and render their registered, in-app previews.
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),C=require('../catalog-v2'),R=require('../renderer-v2');
const out=path.join(root,'output/cool-capsule-integration'),sources=JSON.parse(fs.readFileSync(path.join(out,'source-map.json'))),sourceRoot=path.join(root,'source-art/cool/capsule');
fs.mkdirSync(sourceRoot,{recursive:true});fs.mkdirSync(path.join(root,'assets/v2/cool/looks'),{recursive:true});
const bounds=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=-1,b=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>16){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}if(r<0)throw Error('empty source');return [l,t,r-l+1,b-t+1];};
async function convert(){
 const data=require('../data/cool-capsule'),body=process.env.COOL_BODY_SOURCE;
 if(body){fs.copyFileSync(body,path.join(sourceRoot,'body.png'));const i=await loadImage(body),c=createCanvas(1024,1536);c.getContext('2d').drawImage(i,0,0);fs.writeFileSync(path.join(root,data.BODY),c.toBuffer('image/webp',94));}
 for(const s of sources){if(!s.path||!fs.existsSync(s.path))throw Error('missing '+s.id);const i=await loadImage(s.path),c=createCanvas(1024,1536);c.getContext('2d').drawImage(i,0,0);const item=data.ITEMS.find(i=>i.id===s.id);item.registration.source=bounds(c);fs.copyFileSync(s.path,path.join(sourceRoot,s.id+'.png'));fs.writeFileSync(path.join(root,item.asset),c.toBuffer('image/webp',94));const [x,y,w,h]=item.registration.source,thumb=createCanvas(240,250),t=thumb.getContext('2d'),scale=Math.min(208/w,220/h);t.drawImage(i,x,y,w,h,(240-w*scale)/2,(250-h*scale)/2,w*scale,h*scale);fs.writeFileSync(path.join(root,'assets/v2/cool/thumbs',s.id+'.webp'),thumb.toBuffer('image/webp',90));}
 fs.writeFileSync(path.join(root,'data/cool-capsule.js'),"(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CoolCapsule=api;})(globalThis,function(){\n 'use strict';\n return "+JSON.stringify(data,null,1)+";\n});\n");
}
async function render(){
 const renderer=R.createRenderer({createCanvas,loadImage:f=>loadImage(path.join(root,f))}),sheet=createCanvas(1440,1120),x=sheet.getContext('2d');x.fillStyle='#f6f3ed';x.fillRect(0,0,1440,1120);x.font='20px sans-serif';
 for(const [n,l]of C.looksFor('cool').entries()){const p=await renderer.compose({character:'cool',outfit:l.outfit});fs.writeFileSync(path.join(out,l.id+'.png'),p.figure.toBuffer('image/png'));const t=createCanvas(240,360);renderer.draw(t,p);fs.writeFileSync(path.join(root,'assets/v2/cool/looks',l.id+'.webp'),t.toBuffer('image/webp',90));const dx=(n%4)*360,dy=Math.floor(n/4)*560;x.drawImage(p.figure,dx+20,dy+10,320,480);x.fillStyle='#252820';x.fillText(l.name,dx+25,dy+520);}
 fs.writeFileSync(path.join(out,'eight-looks-in-app.png'),sheet.toBuffer('image/png'));
}
(async()=>{if(!process.argv.includes('--render-only'))await convert();await render();console.log('Built 33 independent garments and 8 registered looks.');})().catch(e=>{console.error(e);process.exitCode=1;});
