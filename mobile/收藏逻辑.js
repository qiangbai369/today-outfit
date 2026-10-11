(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OutfitFavorites=factory();})(globalThis,function(){
  'use strict';
  const idOf = record => typeof record === 'string' ? record : record?.id;
  function read(raw){const records=raw===null?[]:JSON.parse(raw);if(!Array.isArray(records))throw new Error('收藏记录无法读取');return records;}
  function orderedIds(records,looks,character){
    const valid=new Set(looks.filter(look=>look.character===character).map(look=>look.id));
    return [...new Set([...records].reverse().map(idOf).filter(id=>valid.has(id)))];
  }
  function remove(records,id){
    const removed=[];
    const remaining=records.filter((record,index)=>{if(idOf(record)!==id)return true;removed.push({index,record});return false;});
    return {remaining,removed};
  }
  function restore(records,batches){
    const result=[...records];
    for(const batch of [...batches].reverse()){
      const restoredCounts=new Map();
      for(const entry of batch){
        const key=JSON.stringify(entry.record), wanted=(restoredCounts.get(key)||0)+1;
        restoredCounts.set(key,wanted);
        if(result.filter(record=>JSON.stringify(record)===key).length>=wanted)continue;
        result.splice(Math.min(entry.index,result.length),0,entry.record);
      }
    }
    return result;
  }
  return {read,idOf,orderedIds,remove,restore};
});
