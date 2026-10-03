(function(root){
 'use strict';
 const legacy=root.StudioModel;
 const blocked='原动作素材带有固定服装，暂不兼容当前单件换装。';
 const files={smile:'assets/motion/sweet-autumn-v1/smile.webp',puff:'assets/motion/sweet-actions-v2/autumn-puff.webp',brow:'assets/v2/cool/personality-brow.png',smirk:'assets/v2/cool/personality-smirk.png',focus:'assets/v2/literary/personality-focus.png',knowing:'assets/v2/literary/personality-knowing.png'};
 const native={cool:[['brow','微挑眉'],['smirk','轻扬唇']],literary:[['focus','专注'],['knowing','会意笑']]};
 const loads=new Map(),frames=new WeakMap();
 const make=()=>Object.assign(document.createElement('canvas'),{width:1024,height:1536});
 function actions(character){const original=legacy.profileFor(character).actions.map(([id,label])=>({id,label,supported:character==='sweet'&&['smile','puff'].includes(id),reason:blocked}));return [{id:'neutral',label:'自然',supported:true},...original.filter(a=>a.supported),...(native[character]||[]).map(([id,label])=>({id,label,supported:true})),{id:'blink',label:'眨眼',supported:true},...original.filter(a=>!a.supported)];}
 function image(id){if(!loads.has(id)){const job=new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(Error('动作素材未加载，点击动作可重试'));i.src=files[id];});loads.set(id,job);job.catch(()=>loads.delete(id));}return loads.get(id);}
 async function frame(prepared,id,closure=1){
  const a=actions(prepared.character).find(a=>a.id===id);if(!a?.supported)throw Error(a?.reason||'这个动作暂不可用');
  if(id==='neutral'||id==='blink'&&closure<=0)return prepared;
  closure=Math.min(1,Math.max(0,Math.round(closure*2)/2));const key=id==='blink'?id+':'+closure:id;
  let cache=frames.get(prepared);if(!cache){cache=new Map();frames.set(prepared,cache);}if(cache.has(key))return cache.get(key);
  const c=make(),x=c.getContext('2d');x.drawImage(prepared.figure,0,0);
  if(id==='blink'){if(!prepared.blink)throw Error('眨眼素材尚未加载');const eyes=closure===1?prepared.blink:prepared.blinkHalf;if(!eyes)throw Error('半闭眼素材尚未加载');x.drawImage(eyes,0,0);}
  else if((native[prepared.character]||[]).some(([action])=>action===id))x.drawImage(await image(id),0,0);
  else{
   const donor=await image(id),mask=make(),m=mask.getContext('2d');
   // Original autumn registration and masks from js/studio-effects.js.
   // Use a single endpoint face, never dissolve eyelids/lips or import a sleeve.
   if(id==='puff'){
    const outline=make(),o=outline.getContext('2d');o.beginPath();[[365,270],[345,335],[358,385],[400,430],[448,449],[448,470],[552,470],[552,449],[605,430],[645,385],[660,335],[635,270]].forEach(([x,y],i)=>i?o.lineTo(x,y):o.moveTo(x,y));o.closePath();o.fillStyle='#fff';o.fill();m.filter='blur(4px)';m.drawImage(outline,0,0);m.filter='none';
    const fade=m.createLinearGradient(0,455,0,463);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');m.globalCompositeOperation='destination-in';m.fillStyle=fade;m.fillRect(0,0,1024,1536);
   }else{
    m.save();m.translate(495,339);m.scale(145,108);const g=m.createRadialGradient(0,0,.88,0,0,1);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');m.fillStyle=g;m.fillRect(-1,-1,2,2);m.restore();
    m.globalCompositeOperation='destination-out';m.save();m.translate(495,343);m.scale(39,24);const nose=m.createRadialGradient(0,0,.8,0,0,1);nose.addColorStop(0,'#fff');nose.addColorStop(1,'#fff0');m.fillStyle=nose;m.fillRect(-1,-1,2,2);m.restore();
   }
   // Native clothing begins at y470. Clamp the legacy neck mask to the head.
   m.clearRect(0,470,1024,1536-470);
   const layer=make(),l=layer.getContext('2d');l.drawImage(donor,0,0);l.globalCompositeOperation='destination-in';l.drawImage(mask,0,0);
   x.globalCompositeOperation='destination-out';x.drawImage(mask,0,0);x.globalCompositeOperation='lighter';x.drawImage(layer,0,0);
  }
  const result={...prepared,figure:c,motion:id,closure:id==='blink'?closure:undefined};cache.set(key,result);return result;
 }
 const blinkDuration=310;
 function blinkClosure(ms){if(ms>=blinkDuration)return 0;if(ms<100)return ms/100;if(ms<150)return 1;return 1-(ms-150)/160;}
 root.OutfitMotionsV2={actions,frame,blinkDuration,blinkClosure,duration:id=>(legacy.DURATIONS[id]||3)*1000};
})(window);
