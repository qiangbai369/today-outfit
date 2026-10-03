(function(root){'use strict';
const node=typeof module!=='undefined',C=node?require('./catalog-v2.js'):root.OutfitCatalogV2,N=node?require('./data/needs.js'):root.PlannerNeeds;
const warmthLabel={hot:'热',mild:'温暖',cool:'凉',cold:'冷'},walkRank={few:0,normal:1,many:2};
const PINAFORE_TOPS=['shared-top-03','shared-top-04','literary-top-02'];
const blank=()=>Object.fromEntries(C.SLOTS.map(s=>[s,null]));
const normalize=o=>Object.fromEntries(C.SLOTS.map(s=>[s,typeof o?.[s]==='string'?o[s]:null]));
const signature=o=>C.SLOTS.map(s=>o[s]||'-').join('|');
function visualValidate(input,characterId){return C.visualValidate(characterId,normalize(input));}
function validate(input,need,options={}){
 const o=normalize(input),n=N.normalizeNeed(need),reasons=[...visualValidate(o,options.characterId).reasons,...n.errors];
 const values=Object.values(o).filter(Boolean),owned=new Set(options.owned||[]),excluded=new Set(options.excluded||[]);
 for(const slot of C.SLOTS){if(Object.hasOwn(options.locks||{},slot)&&o[slot]!==options.locks[slot])reasons.push('保留已锁定单品');}
 for(const id of values){const i=C.item(id);if(!i)continue;if(excluded.has(id)||excluded.has(i.category)||excluded.has(i.kind)||excluded.has(i.colorFamily))reasons.push('已排除该单品或品类');if(options.strictOwned&&!owned.has(id))reasons.push('只用我有类似的单品');}
 const top=C.item(o.top),bottom=C.item(o.bottom),dress=C.item(o.dress),outer=C.item(o.outer),shoes=C.item(o.shoes),bag=C.item(o.bag),upper=dress&&!dress.requiresTop?dress:top;
 if(upper){const permitted=upper.conditions.includes(warmthLabel[n.warmth])||n.warmth==='cool'&&outer&&upper.conditions.includes('温暖');if(!permitted)reasons.push('上身不适合当前冷暖');}
 if(bottom){const permitted=bottom.conditions.includes(warmthLabel[n.warmth])||bottom.kind==='skirt'&&n.warmth==='cold'&&o.legwear&&outer;if(!permitted)reasons.push('下装不适合当前冷暖');}
 if(outer&&!outer.conditions.includes(warmthLabel[n.warmth]))reasons.push('外套不适合当前冷暖');
 if(dress?.requiresTop&&!dress.conditions.includes(warmthLabel[n.warmth]))reasons.push('背带裙不适合当前冷暖');
 if(n.warmth==='hot'&&(outer||o.legwear))reasons.push('热天不需要厚外层');
 if(n.warmth==='cold'&&!outer)reasons.push('冷天需要外层');
 if(['cool','cold'].includes(n.warmth)&&(dress||bottom?.kind==='skirt')&&!o.legwear)reasons.push('凉天裙装需要打底袜');
 if(shoes){if(!shoes.conditions.includes(warmthLabel[n.warmth]))reasons.push('鞋不适合当前冷暖');if(walkRank[shoes.walking]<walkRank[n.walking])reasons.push('这双鞋更适合短时间步行');}
 if(['class','work'].includes(n.activity)&&!bag)reasons.push('学习或上班需要一个包');
 if(n.activity==='class'&&bag&&bag.capacity!=='large')reasons.push('上课优先能放学习用品的包');
 if(n.formal&&((upper?.formal||0)<2||(bottom?.formal||dress?.formal||0)<2||(shoes?.formal||0)<2))reasons.push('该组合不够整洁正式');
 const accents=[upper,bottom||dress,outer].filter(Boolean).filter(i=>!['ivory','black','gray','sand','brown','blue'].includes(i.colorFamily));
 if(new Set(accents.map(i=>i.colorFamily)).size>1)reasons.push('先保留一种主色');
 return {valid:reasons.length===0,reasons:[...new Set(reasons)]};
}
function pool(characterId,slot,n,options){
 const owned=new Set(options.owned||[]),excluded=new Set(options.excluded||[]);
 const all=C.itemsFor(characterId).filter(i=>i.category===slot&&(!options.strictOwned||owned.has(i.id))&&!excluded.has(i.id)&&!excluded.has(i.category)&&!excluded.has(i.kind)&&!excluded.has(i.colorFamily)).filter(i=>{
  if(slot==='shoes')return i.conditions.includes(warmthLabel[n.warmth])&&walkRank[i.walking]>=walkRank[n.walking]&&(!n.formal||i.formal>=2);
  if(slot==='outer')return n.warmth!=='hot'&&i.conditions.includes(warmthLabel[n.warmth]);
  if(slot==='bag'&&n.activity==='class')return i.capacity==='large';
  if(['top','bottom','dress'].includes(slot)&&n.formal&&i.formal<2)return false;
  return true;
 });
 if(Object.hasOwn(options.locks||{},slot))return options.locks[slot]===null?[null]:all.filter(i=>i.id===options.locks[slot]).map(i=>i.id);
 const ids=all.map(i=>i.id);return ['outer','bag','legwear'].includes(slot)?slot==='outer'&&n.warmth==='cold'?ids:[null,...ids]:ids;
}
function recommend(characterId,need,options={}){
 const n=N.normalizeNeed(need),limit=Math.max(1,Math.min(50,options.limit||3)),seen=new Set(options.seen||[]),owned=new Set(options.owned||[]);
 if(!C.CHARACTERS.some(c=>c.id===characterId)||n.errors.length)return {outfits:[],reason:n.errors[0]||'请选择人物',exhausted:false};
 const p=Object.fromEntries(C.SLOTS.map(s=>[s,pool(characterId,s,n,options)]));
 const desired=options.style&&options.style!=='character'?options.style:n.style!=='character'?n.style:({sweet:'soft',cool:'street',literary:'neat'}[characterId]);
 const candidates=[],failures=new Map();
 const add=o=>{const v=validate(o,n,{...options,characterId});if(!v.valid){for(const reason of v.reasons)failures.set(reason,(failures.get(reason)||0)+1);return;}
  const items=Object.values(o).filter(Boolean).map(C.item);
  const score=items.reduce((s,i)=>s+(i.style===desired?8:0)+(i.character===characterId?4:0)+(owned.has(i.id)?10:0),0)+(n.warmth==='cool'&&o.outer?4:0)+(n.activity==='concert'&&items.some(i=>i.style==='street')?8:0);
  candidates.push({o,score:score-(options.adopted||[]).filter(a=>a.character===characterId&&a.signature===signature(o)).length*12,key:signature(o)});
 };
 // Editorial templates: separates, ordinary dress, pinafore. Never stack two bottoms.
 const bodies=[];
 if(!options.locks?.dress){for(const top of p.top)for(const bottom of p.bottom)bodies.push({...blank(),top,bottom});}
 if(!options.locks?.bottom){for(const dress of p.dress){const d=C.item(dress);if(!d)continue;if(d.requiresTop){for(const top of p.top.filter(id=>PINAFORE_TOPS.includes(id)))bodies.push({...blank(),top,dress});}else if(!options.locks?.top)bodies.push({...blank(),dress});}}
 for(const body of bodies)for(const outer of p.outer)for(const shoes of p.shoes)for(const bag of p.bag){
  const skirt=body.dress||C.item(body.bottom)?.kind==='skirt';
  const socks=skirt?(['cool','cold'].includes(n.warmth)?p.legwear.filter(Boolean):p.legwear):Object.hasOwn(options.locks||{},'legwear')?p.legwear:[null];
  for(const legwear of socks)add({...body,outer,shoes,bag,legwear});
 }
 const unique=new Map();for(const c of candidates)if(!unique.has(c.key))unique.set(c.key,c);
 const available=[...unique.values()].filter(c=>!seen.has(c.key)).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 const chosen=[];let remaining=available;
 while(remaining.length&&chosen.length<limit){
  const diverse=remaining.find(c=>chosen.every(p=>['top','bottom','dress','outer','shoes'].filter(s=>p[s]!==c.o[s]).length>=2));
  const next=diverse||remaining[0];chosen.push(next.o);remaining=remaining.filter(c=>c.key!==next.key);
 }
 let reason='';if(!chosen.length)reason=unique.size?'这些条件下的搭配已看完':Object.keys(options.locks||{}).length?'已锁定单品与当前条件不匹配，可以换一件或调整条件':options.strictOwned?'目前标记的单品还搭不成一身，补充上衣、下装或鞋试试':[...failures].sort((a,b)=>b[1]-a[1])[0]?.[0]||'这些条件还没有合适搭配，可以手动逛衣橱';
 return {outfits:chosen,reason,exhausted:unique.size>0&&available.length===0,total:unique.size};
}
function alternatives(outfit,slot,options={}){
 if(!C.SLOTS.includes(slot))return [];
 return C.itemsFor(options.characterId).filter(i=>i.category===slot&&visualValidate({...outfit,[slot]:i.id},options.characterId).valid);
}
const api={blank,normalize,signature,visualValidate,validate,recommend,alternatives};if(node)module.exports=api;else root.OutfitRulesV2=api;
})(typeof globalThis!=='undefined'?globalThis:this);
