(function(root,factory){const api=factory(typeof module==='object'?require('./catalog-v2.js'):root.OutfitCatalogV2);if(typeof module==='object')module.exports=api;else root.OutfitRendererV2=api;})(globalThis,function(C){
 'use strict';
 const W=1024,H=1536;
 const geometry={
  sweet:{head:470,waist:718,feet:1335,shortHem:1060,left:[[285,650],[411,650],[395,760],[376,848],[389,920],[384,979],[301,979],[291,887],[302,787]],right:[[635,650],[747,650],[719,778],[681,842],[654,839],[649,804],[632,752]],hairEnd:790},
  cool:{head:435,waist:742,feet:1370,shortHem:995,left:[[220,620],[367,620],[368,740],[346,850],[341,946],[352,986],[326,1055],[270,1055],[249,980],[250,896],[279,766]],right:[[672,620],[800,620],[805,916],[794,1025],[766,1060],[690,1055],[682,970],[697,919],[681,830]],hairEnd:510},
  literary:{head:470,waist:768,feet:1330,shortHem:1025,left:[[252,650],[395,650],[392,790],[368,875],[340,958],[345,1010],[342,1058],[275,1065],[256,1006],[258,893],[275,781]],right:[[635,650],[773,650],[778,845],[764,985],[757,1065],[685,1065],[676,1005],[679,923],[655,814]],hairEnd:610}
 };
 function createRenderer(options={}){
  const make=options.createCanvas||((w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}));
  const read=options.loadImage||(f=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('这件衣服暂时未加载，请重试'));i.src=f;}));
  const cache=new Map();function image(file){if(cache.has(file)){const p=cache.get(file);cache.delete(file);cache.set(file,p);return p;}const p=Promise.resolve().then(()=>read(file)).catch(e=>{cache.delete(file);throw e;});cache.set(file,p);while(cache.size>12)cache.delete(cache.keys().next().value);return p;}
  function poly(x,points){x.beginPath();points.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();}
  const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  function replace(ctx,source,points){ctx.save();poly(ctx,points);ctx.clip();ctx.clearRect(0,0,W,H);ctx.drawImage(source,0,0);ctx.restore();}
  function foot(ctx,source,g,tights){replace(ctx,source,rect(0,g.feet+45,W,H-g.feet-45));const c=make(W,H),x=c.getContext('2d');x.drawImage(source,0,0);x.globalCompositeOperation='destination-in';const grad=x.createLinearGradient(0,g.feet,0,g.feet+45);grad.addColorStop(0,'#0000');grad.addColorStop(1,'#000');x.fillStyle=grad;x.fillRect(0,g.feet,W,45);x.clearRect(0,0,W,g.feet);x.clearRect(0,g.feet+45,W,H-g.feet-45);if(tights){const p=x.getImageData(0,g.feet,W,45),d=p.data;for(let k=0;k<d.length;k+=4)if(d[k]>190&&d[k]>d[k+1]*1.13&&d[k+1]>d[k+2]*1.12)d[k+3]=0;x.putImageData(p,0,g.feet);}ctx.drawImage(c,0,0);}
  function patch(source,regions,filter){const c=make(W,H),x=c.getContext('2d');for(const region of regions){x.save();poly(x,region);x.clip();x.drawImage(source,0,0);x.restore();}if(filter){const pixels=x.getImageData(0,0,W,H),d=pixels.data;for(let y=0;y<H;y++)for(let p=0;p<W;p++){const k=(y*W+p)*4;if(d[k+3]&&!filter(d[k],d[k+1],d[k+2],p,y))d[k+3]=0;}x.putImageData(pixels,0,0);}return c;}
  function hair(source,id){const g=geometry[id];return patch(source,[rect(0,g.head,W,g.hairEnd-g.head)],(r,b,c,x)=> (x<427||x>626)&&r<195&&r>b*1.13&&b>c*1.06);}
  function outer(source,id,item){const g=geometry[id],long=item.length==='long',end=long?1230:Math.max(g.waist+175,970);
   if(item.id==='sweet-outer-01')return patch(source,[[[210,470],[430,470],[461,510],[489,692],[490,755],[471,845],[445,1000],[423,1175],[350,1160],[292,1130],[210,1130]],[[580,470],[835,470],[835,1140],[796,1128],[715,1160],[657,1175],[640,1080],[620,940],[610,830],[590,734],[580,600]]]);
   if(item.id==='literary-outer-01')return patch(source,[[[210,470],[427,470],[440,580],[462,730],[460,792],[432,941],[338,920],[210,970]],[[592,470],[835,470],[835,970],[682,950],[613,948],[585,845],[574,735],[576,650],[598,537]]]);
   if(item.id==='shared-outer-02'){const panels={sweet:[[[200,470],[460,470],[475,545],[500,630],[486,720],[464,831],[200,831]],[[575,470],[835,470],[835,825],[616,825],[576,715],[575,650],[645,552]]],cool:[[[200,435],[463,435],[440,536],[483,603],[453,703],[437,790],[416,846],[200,846]],[[585,435],[835,435],[835,848],[638,848],[609,777],[582,650],[568,598],[600,550]]],literary:[[[200,470],[468,470],[460,560],[484,642],[466,730],[441,855],[200,855]],[[585,470],[835,470],[835,855],[617,855],[584,747],[565,632],[592,550]]]}[id];return patch(source,panels);}
   const regions=[[[210,g.head+12],[460,g.head+12],[470,545],[474,650],[453,775],[420,930],[425,end],[210,end]],[[578,g.head+12],[835,g.head+12],[838,end],[630,end],[619,940],[601,810],[578,680],[570,558]]];
   const keep=(r,b,c)=>item.colorFamily==='gray'?Math.max(r,b,c)<218&&Math.max(r,b,c)-Math.min(r,b,c)<28:item.colorFamily==='black'?Math.max(r,b,c)<135&&c<r*1.06:item.colorFamily==='blue'?c>r*1.05:item.colorFamily==='brown'?r>b*1.06&&b>c*1.08:r>110&&r<237&&r>b*1.035&&b>c*1.08;
   return patch(source,regions,keep);
  }
  function bag(source,id,item){const c=make(W,H),x=c.getContext('2d');x.drawImage(source,0,0);const d=x.getImageData(0,0,W,H).data;let l=W,r=0,t=H,b=0,sx=0,n=0;for(let y=0;y<H;y++)for(let p=0;p<W;p++)if(d[(y*W+p)*4+3]>32){l=Math.min(l,p);r=Math.max(r,p);t=Math.min(t,y);b=Math.max(b,y);}if(l>r)return c;for(let y=t;y<t+20;y++)for(let p=l;p<=r;p++)if(d[(y*W+p)*4+3]>32){sx+=p;n++;}x.clearRect(0,0,W,H);
   if(item.id==='shared-bag-01'||item.id==='sweet-bag-01'){const hand={sweet:[344,940],cool:[278,1008],literary:[304,1010]}[id],h=item.id==='sweet-bag-01'?270:330,scale=h/(b-t);x.drawImage(source,l,t,r-l+1,b-t+1,hand[0]-(r-l)*scale*.52,hand[1]-65,(r-l+1)*scale,(b-t+1)*scale);}
   else{const shoulder={sweet:[382,525],cool:[354,495],literary:[339,530]}[id];const scale=.91;x.drawImage(source,(shoulder[0]-(sx/n)*scale),(shoulder[1]-t*scale),W*scale,H*scale);}return c;
  }
  async function compose({character,outfit}){
   const v=C.visualValidate(character,outfit);if(!v.valid)throw Error(v.reasons.join('；'));const g=geometry[character];
   const ids=C.SLOTS.filter(s=>outfit[s]),files=[`assets/v2/${character}/master.webp`,`assets/characters/${character}/original.png`,`assets/v2/${character}/shared-bottom-04.webp`,...ids.map(s=>C.fit(character,outfit[s]).file)];
   // Load all layers before creating a frame; no half-dressed commits.
   const [loaded,blink]=await Promise.all([Promise.all(files.map(image)),image(`assets/v2/${character}/blink.png`).catch(()=>null)]),master=loaded[0],approved=loaded[1],bare=loaded[2],sources=Object.fromEntries(ids.map((s,i)=>[s,loaded[i+3]]));
   const figure=make(W,H),ctx=figure.getContext('2d');ctx.drawImage(master,0,0);
   const lower=C.item(outfit.bottom),dress=C.item(outfit.dress),long=lower?.length==='long';
   if(dress){replace(ctx,sources.dress,rect(0,g.head,W,g.feet+45-g.head));if(dress.requiresTop){replace(ctx,sources.top,rect(0,g.head,W,g.waist-g.head));for(const points of [g.left,g.right])replace(ctx,sources.top,points);ctx.drawImage(patch(sources.dress,[rect(350,g.head,365,g.waist-g.head)],(r,b,c)=>r<110&&c>r*1.06),0,0);}}
   else{
    replace(ctx,sources.bottom,rect(0,g.waist,W,g.feet+45-g.waist));
    replace(ctx,sources.top,rect(0,g.head,W,g.waist-g.head));
    if(C.item(outfit.top).length==='long')for(const points of [g.left,g.right])replace(ctx,sources.top,points);
    // The cool pose has a curved half-tucked hem below the waist registration.
    // Keep its native garment pixels, excluding the source's blue denim and skin.
    if(character==='cool'){
     if(outfit.top==='shared-top-03')ctx.drawImage(patch(sources.top,[[[378,742],[442,742],[420,775],[389,775]],[[570,742],[669,742],[668,795],[644,780],[609,756]]]),0,0);
     else ctx.drawImage(patch(sources.top,[rect(350,g.waist,350,110)],(r,b,c)=>!(c>r*1.08&&c>b*1.03)&&!(r>180&&r>b*1.13&&b>c*1.08)),0,0);
    }
   }
   const hem=dress?(dress.id==='sweet-dress-02'||dress.id==='literary-dress-01'?1150:1065):g.shortHem;
   if(dress?.id==='sweet-dress-02')replace(ctx,bare,rect(385,hem,315,g.feet+45-hem));
   if(outfit.legwear){const legs=patch(sources.legwear,[rect(330,hem,415,g.feet+45-hem)],(r,b,c)=>Math.max(r,b,c)<150);replace(ctx,legs,rect(330,hem,415,g.feet+45-hem));}
   foot(ctx,sources.shoes,g,!!outfit.legwear);
   const boot=['shared-shoes-04','sweet-shoes-02','literary-shoes-02'].includes(outfit.shoes);if(boot){replace(ctx,sources.shoes,rect(0,g.feet,W,H-g.feet));if(!long)ctx.drawImage(patch(sources.shoes,[rect(315,g.feet-85,425,85)],(r,b,c)=>Math.max(r,b,c)<155),0,0);}
   if(long){const end={sweet:1378,cool:1410,literary:1405}[character];ctx.drawImage(patch(sources.bottom,[rect(0,g.feet,W,end-g.feet)]),0,0);}
   if(outfit.outer){for(const region of [g.left,g.right]){
    if(character==='sweet')ctx.drawImage(patch(sources.outer,[region],(r,b,c,x,y)=>{
     if(y>893&&x<410)return r>150&&r>b*1.14&&b>c*1.1;
     return !(y>780&&r>230&&b>220&&c>205&&r-c<30);
    }),0,0);
    else replace(ctx,sources.outer,region);
   }ctx.drawImage(outer(sources.outer,character,C.item(outfit.outer)),0,0);}
   if(outfit.bag){ctx.drawImage(bag(sources.bag,character,C.item(outfit.bag)),0,0);const hand=character==='sweet'?[[306,893],[388,893],[388,973],[306,973]]:character==='cool'?[[252,970],[318,970],[318,1064],[252,1064]]:[[275,992],[342,992],[342,1065],[275,1065]];ctx.drawImage(patch(outfit.outer?sources.outer:sources.top||sources.dress,[hand],(r,b,c)=>r>150&&r>b*1.14&&b>c*1.1),0,0);}
   // The active sweet garment source already preserves her approved long waves.
   // Reusing the old puff-sleeve source here also imports hair-colored skin shadows.
   const hairSource=character==='sweet'?(sources.outer||sources.top||sources.dress):approved;
   ctx.drawImage(hair(hairSource,character),0,0);
   ctx.clearRect(0,0,W,g.head);ctx.drawImage(approved,0,0,W,g.head,0,0,W,g.head);
   return {figure,blink,character,outfit:{...outfit}};
  }
  async function ensureBlink(prepared){
   if(prepared.blink)return prepared.blink;
   try{prepared.blink=await image(`assets/v2/${prepared.character}/blink.png`);return prepared.blink;}
   catch(e){throw Error('眨眼眼部素材加载失败，点击眨眼可重试');}
  }
  function draw(canvas,prepared,{blink=false}={}){const x=canvas.getContext('2d'),s=Math.min(canvas.width/W,canvas.height/H),dx=(canvas.width-W*s)/2,dy=(canvas.height-H*s)/2;x.clearRect(0,0,canvas.width,canvas.height);x.drawImage(prepared.figure,dx,dy,W*s,H*s);if(blink&&prepared.blink)x.drawImage(prepared.blink,dx,dy,W*s,H*s);}
  return {compose,ensureBlink,draw,clear:()=>cache.clear()};
 }
 return {W,H,geometry,createRenderer};
});
