(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OutfitGestures=factory();})(globalThis,function(){
  'use strict';
  function addFavorite(raw,id){
    const records=raw===null?[]:JSON.parse(raw);
    if(!Array.isArray(records))throw new Error('收藏记录无法读取');
    if(records.some(record=>(typeof record==='string'?record:record?.id)===id))return records;
    return [...records,{id,light:'natural'}];
  }
  function classifyGesture(start,end){
    const dx=end.x-start.x,dy=end.y-start.y;
    if(dy < -50 && Math.abs(dy)>Math.abs(dx)*1.25)return 'next';
    if(dy > 50 && Math.abs(dy)>Math.abs(dx)*1.25)return 'previous';
    return Math.hypot(dx,dy)<=14 && end.time-start.time<500?'tap':'ignore';
  }
  function createTapController({single,double,schedule=setTimeout,cancel=clearTimeout}){
    let last=null,timer=null,second=false;
    const nearby=point=>last&&point.time-last.time<=300&&Math.hypot(point.x-last.x,point.y-last.y)<=35;
    function reset(){if(timer!==null)cancel(timer);timer=null;last=null;second=false;}
    function secondPress(point){
      if(nearby(point)){second=true;if(timer!==null)cancel(timer);timer=null;}
    }
    function tap(point){
      if(second||nearby(point)){reset();double(point);return;}
      reset();last=point;
      timer=schedule(()=>{timer=null;last=null;single(point);},320);
    }
    return {tap,secondPress,reset};
  }
  return {addFavorite,classifyGesture,createTapController};
});
