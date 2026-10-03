(function(root,factory){const api=factory(typeof module==='object'?require('./catalog-v2.js'):root.OutfitCatalogV2,typeof module==='object'?require('./rules-v2.js'):root.OutfitRulesV2,typeof module==='object'?require('./data/needs.js'):root.PlannerNeeds);if(typeof module==='object')module.exports=api;else root.OutfitModelV2=api;})(globalThis,function(C,R,N){
 'use strict';
 const signature=R.signature;
 function createState(){return {character:'sweet',need:null,roles:Object.fromEntries(C.CHARACTERS.map(c=>[c.id,C.createRole(c.id)])),owned:[],excluded:[],strictOwned:false,adopted:[],tried:[],background:'studio',light:'neutral',trip:null};}
 const validate=(c,o,n,p={})=>R.validate(o,n,{...p,characterId:c});
 function adopt(state,character,outfit,time=Date.now()){const s=structuredClone(state);if(!C.visualValidate(character,outfit).valid)throw Error('不能采用无效搭配');s.adopted=[...(s.adopted||[]),{character,signature:signature(outfit),time}].slice(-60);return s;}
 function tryOn(state,character,outfit,time=Date.now()){const s=structuredClone(state);if(!C.visualValidate(character,outfit).valid)throw Error('不能试穿无效搭配');s.tried=[...(s.tried||[]),{character,signature:signature(outfit),time}].slice(-60);return s;}
 function validNeed(n){if(n===null)return true;const a=n&&N.ACTIVITIES.find(x=>x.id===n.activity);return !!a&&a.details.some(d=>d.id===n.detail)&&N.SEASONS.some(s=>s.id===n.season)&&N.WARMTH.some(w=>w.id===n.warmth)&&['few','normal','many'].includes(n.walking)&&N.STYLES.some(s=>s.id===n.style)&&!N.normalizeNeed(n).errors.length;}
 function isMap(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
 function draftLocks(character,locks){return isMap(locks)&&Object.entries(locks).every(([slot,id])=>{if(!C.SLOTS.includes(slot))return false;if(id===null)return true;try{C.fit(character,id);return C.item(id).slot===slot;}catch(e){return false;}});}
 function validLocks(character,outfit,locks){return isMap(outfit)&&C.visualValidate(character,outfit).valid&&draftLocks(character,locks)&&Object.entries(locks).every(([s,id])=>id===outfit[s]);}
 function record(state,{id,name,now=Date.now()}){return {schemaVersion:2,assetVersion:C.VERSION,kind:'outfit',id,name:name||'自由搭配',character:state.character,need:state.need?N.normalizeNeed(state.need):null,outfit:{...state.roles[state.character].outfit},locks:{...state.roles[state.character].locks},lastSplit:{...state.roles[state.character].lastSplit},createdAt:now,updatedAt:now,background:'studio',light:state.light};}
 function recordTrip(state,trip,meta){const r=record(state,meta);r.kind='trip';r.trip=structuredClone(trip);delete r.outfit;delete r.locks;delete r.lastSplit;return r;}
 function validateRecord(r){const fail=error=>({valid:false,record:r,error});if(!r||r.schemaVersion!==2||r.assetVersion!==C.VERSION||!['outfit','trip'].includes(r.kind)||!C.CHARACTERS.some(c=>c.id===r.character)||typeof r.id!=='string'||!r.id||typeof r.name!=='string')return fail('暂不支持该版本，原记录保留');if(!validNeed(r.need))return fail('出门条件无效');
  if(r.kind==='outfit'){if(!validLocks(r.character,r.outfit,r.locks))return fail('单品或锁定与角色不匹配');if(r.lastSplit&&(!C.item(r.lastSplit.top)||!C.item(r.lastSplit.bottom)||!C.visualValidate(r.character,{...C.defaultOutfit(r.character),...r.lastSplit}).valid))return fail('分体装恢复记录无效');}
  else{const t=r.trip;if(!isMap(t)||t.character!==r.character||!Array.isArray(t.days)||t.days.length<1||t.days.length>7||!validNeed(t.baseNeed))return fail('旅行需要1—7天');
   if(!draftLocks(r.character,t.sharedLocks)||!Array.isArray(t.noReuseItems)||!isMap(t.quantities))return fail('旅行复用或行李记录无效');
   for(const [index,d]of t.days.entries()){if(!isMap(d)||d.day!==index+1||!validNeed(d.need)||d.need===null||!draftLocks(r.character,d.locks))return fail('旅行条件无效');if(d.outfit?!validLocks(r.character,d.outfit,d.locks):typeof d.reason!=='string')return fail('旅行搭配无效');if(d.outfit&&Object.entries(t.sharedLocks).some(([slot,id])=>d.outfit[slot]!==id))return fail('旅行全程复用项不一致');}
   if(t.noReuseItems.some(id=>{try{C.fit(r.character,id);return false;}catch(e){return true;}}))return fail('不复用项无效');
   if(t.noReuseItems.some(id=>t.days.filter(d=>Object.values(d.outfit||{}).includes(id)).length>1))return fail('不复用项重复穿着');
   if(Object.entries(t.quantities).some(([id,n])=>{try{C.fit(r.character,id);}catch(e){return true;}return !Number.isInteger(n)||n<1||n>20;}))return fail('行李数量无效');
  }
  return {valid:true,record:r};
 }
 function restore(state,r){const v=validateRecord(r);if(!v.valid)throw Error(v.error);const s=structuredClone(state);s.character=r.character;s.need=r.need?N.normalizeNeed(r.need):null;s.background='studio';s.light=['neutral','warm','cool'].includes(r.light)?r.light:'neutral';if(r.kind==='trip'){s.trip=structuredClone(r.trip);const first=s.trip.days[0],reference=first.outfit||s.trip.days.find(d=>d.outfit)?.outfit||C.defaultOutfit(r.character);s.roles[r.character]={...C.createRole(r.character),outfit:{...reference},locks:{...first.locks}};}else{s.trip=null;s.roles[r.character]={outfit:{...r.outfit},locks:{...r.locks},lastSplit:r.lastSplit||{top:C.defaultOutfit(r.character).top,bottom:C.defaultOutfit(r.character).bottom},seen:[]};}return s;}
 const checklist=r=>C.checklist(r.character,r.outfit);
 return {...C,createState,signature,validate,recommend:R.recommend,explain:R.explain,alternatives:R.alternatives,adopt,tryOn,record,recordTrip,validateRecord,restore,checklist,validNeed,validLocks};
});
