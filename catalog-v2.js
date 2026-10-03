(function(root,factory){const api=factory(typeof module==='object'?require('./data/catalog.js'):root.PlannerCatalog,typeof module==='object'?require('./data/cool-capsule.js'):root.CoolCapsule);if(typeof module==='object')module.exports=api;else root.OutfitCatalogV2=api;})(globalThis,function(Source,Capsule){
 'use strict';
 const VERSION='native-2',SLOTS=['top','bottom','dress','outer','shoes','bag','legwear'];
 const CHARACTERS=[{id:'sweet',name:'吴心媛',tone:'柔和 · 轻盈'},{id:'cool',name:'陈墨白',tone:'利落 · 随性'},{id:'literary',name:'顾书宁',tone:'清新 · 整洁'}];
 const ITEMS=[...Source.ITEMS,...Capsule.ITEMS].map(i=>Object.freeze({...i,slot:i.category,warmth:i.conditions.map(x=>({'热':'hot','温暖':'mild','凉':'cool','冷':'cold'}[x])),detail:i.designNote}));
 const item=id=>ITEMS.find(i=>i.id===id),itemsFor=character=>ITEMS.filter(i=>character==='cool'?(i.nativeLayer||['shared-bag-01','shared-bag-02'].includes(i.id)):(i.character==='all'||i.character===character));
 const looksFor=character=>character==='cool'?Capsule.LOOKS:[];
 function fit(character,id){const i=item(id);if(!CHARACTERS.some(c=>c.id===character)||!i||!(i.character==='all'||i.character===character))throw Error('单品与人物不匹配');return {character,itemId:id,version:VERSION,file:`assets/v2/${character}/${id}.webp`};}
 const defaults={sweet:['sweet-top-02','sweet-bottom-01','sweet-shoes-01'],cool:['cool-top-01','cool-bottom-02','cool-shoes-02'],literary:['literary-top-01','literary-bottom-01','shared-shoes-01']};
 function defaultOutfit(character){if(!defaults[character])throw Error('请选择人物');if(character==='cool')return {...Capsule.LOOKS[0].outfit};const [top,bottom,shoes]=defaults[character];return {top,bottom,shoes,dress:null,outer:null,bag:null,legwear:null};}
 const innerTops=['shared-top-03','shared-top-04','literary-top-02'];
 function visualValidate(character,outfit){
  const reasons=[];if(!outfit||typeof outfit!=='object')return {valid:false,reasons:['缺少搭配']};
  for(const slot of SLOTS){const id=outfit[slot];if(!id)continue;try{fit(character,id);}catch(e){reasons.push(e.message);}if(item(id)?.slot!==slot)reasons.push('单品分类错误');}
  const d=item(outfit.dress);if(d){if(outfit.bottom)reasons.push('连衣裙不叠加下装');if(d.requiresTop){if(!innerTops.includes(outfit.top))reasons.push('背带裙需要已适配的衬衫内搭');}else if(outfit.top)reasons.push('普通连衣裙不叠加上衣');}
  else if(!outfit.top||!outfit.bottom)reasons.push('分体装需要上衣和下装');
  if(!outfit.shoes)reasons.push('请选择鞋');
  if(outfit.legwear&&!d&&item(outfit.bottom)?.length==='long')reasons.push('长裤不叠加外露打底袜');
  return {valid:reasons.length===0,reasons:[...new Set(reasons)]};
 }
 function createRole(character){const outfit=defaultOutfit(character);return {outfit,locks:{},seen:[],lastSplit:{top:outfit.top,bottom:outfit.bottom}};}
 function change(character,role,slot,id){
  if(!SLOTS.includes(slot))throw Error('未知分类');if(id!==null){fit(character,id);if(item(id).slot!==slot)throw Error('单品分类不匹配');}
  const next=structuredClone(role),o=next.outfit;
  if(slot==='dress'){
   if(id){if(!o.dress)next.lastSplit={top:o.top,bottom:o.bottom};o.dress=id;o.bottom=null;o.top=item(id).requiresTop?(innerTops.includes(o.top)?o.top:'shared-top-04'):null;}
   else if(o.dress){o.dress=null;o.top=next.lastSplit?.top||defaultOutfit(character).top;o.bottom=next.lastSplit?.bottom||defaultOutfit(character).bottom;}
  }else{
   if((slot==='top'||slot==='bottom')&&o.dress&&!item(o.dress).requiresTop){o.dress=null;o.top=next.lastSplit?.top||defaultOutfit(character).top;o.bottom=next.lastSplit?.bottom||defaultOutfit(character).bottom;}
   if(slot==='bottom'&&o.dress){o.dress=null;o.top=next.lastSplit?.top||defaultOutfit(character).top;}
   o[slot]=id;if(slot==='bottom'&&item(id)?.length==='long')o.legwear=null;
  }
  if(item(o.bottom)?.length==='long')o.legwear=null;
  for(const [s,locked]of Object.entries(role.locks||{}))if(o[s]!==locked)throw Error('先解锁，再更换这件单品');
  const v=visualValidate(character,o);if(!v.valid)throw Error(v.reasons.join('；'));if(!o.dress)next.lastSplit={top:o.top,bottom:o.bottom};next.seen=[];return next;
 }
 const checklist=(character,outfit)=>{const v=visualValidate(character,outfit);if(!v.valid)throw Error(v.reasons.join('；'));return SLOTS.filter(s=>outfit[s]).map(s=>({...item(outfit[s]),slot:s}));};
 return {VERSION,SLOTS,CHARACTERS,ITEMS,item,itemsFor,fit,looksFor,capsuleBody:Capsule.BODY,defaultOutfit,createRole,visualValidate,change,checklist,innerTops};
});
