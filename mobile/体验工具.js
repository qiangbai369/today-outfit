(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.OutfitExtras=api;
})(globalThis,function(){
  'use strict';
  const FORMAT='outfit-favorites', VERSION=1;
  const idOf=r=>typeof r==='string'?r:r?.id;
  function backup(records,looks){
    if(!Array.isArray(records))throw new Error('收藏记录无法读取');
    const valid=new Set(looks.map(l=>l.id));
    return {format:FORMAT,version:VERSION,records:records.filter(r=>valid.has(idOf(r)))};
  }
  function mergeBackup(text,current,looks){
    if(text.length>1024*1024)throw new Error('备份文件过大');
    const data=JSON.parse(text),valid=new Set(looks.map(l=>l.id));
    if(data?.format!==FORMAT||data.version!==VERSION||!Array.isArray(data.records)||data.records.length>1000||!Array.isArray(current))throw new Error('不是有效的穿搭收藏备份');
    if(!data.records.every(r=>valid.has(idOf(r))&&(typeof r==='string'||(r&&typeof r==='object'&&!Array.isArray(r)))))throw new Error('备份包含无法识别的穿搭');
    const result=[...current],seen=new Set(current.map(idOf));
    for(const r of data.records)if(!seen.has(idOf(r))){seen.add(idOf(r));result.push(r);}
    return result;
  }
  let config,dialog,body,status,title,revision=0,cleanup=()=>{};
  const $=id=>document.getElementById(id);
  function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
  function open(name){cleanup();cleanup=()=>{};revision++;title.textContent=name;body.replaceChildren();status.textContent='';if(!dialog.open)dialog.showModal();return revision;}
  function action(parent,text,handler){const b=element('button',text);b.type='button';b.addEventListener('click',handler);parent.append(b);return b;}
  function download(blob,name){const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function readRecords(){return window.OutfitFavorites.read(config.storage?.getItem(config.favoritesKey)??null);}
  function mount(options){
    config=options;dialog=$('detail-dialog');body=$('detail-body');status=$('detail-status');title=$('detail-title');
    if ('ResizeObserver' in window) new ResizeObserver(entries=>{const height=entries[0].target.getBoundingClientRect().height;if(height)document.documentElement.style.setProperty('--feedback-height',height+'px');}).observe($('feedback'));
    $('detail-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{cleanup();cleanup=()=>{};revision++;});
    $('compare-favorites').addEventListener('click',openCompare);
    $('collection-tools').addEventListener('click',()=>{
      open('收藏备份');body.append(element('p','备份保存到文件；恢复时合并收藏，不覆盖已有记录。'));
      const actions=element('div',null,'detail-actions');body.append(actions);
      action(actions,'导出收藏',()=>{try{const data=backup(readRecords(),config.allLooks);download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'穿搭照相馆-收藏.json');status.textContent='已导出 '+data.records.length+' 条收藏';}catch{status.textContent='暂时无法导出，原收藏未改动';}});
      const input=element('input');input.type='file';input.accept='.json,application/json';input.hidden=true;body.append(input);
      const importButton=action(actions,'恢复收藏',()=>input.click());
      input.addEventListener('change',async()=>{
        const file=input.files[0],rev=revision;if(!file)return;
        importButton.disabled=true;
        try{
          if(file.size>1024*1024)throw new Error('备份文件过大');
          const text=await file.text();
          if(rev!==revision||!dialog.open)return;
          const current=readRecords(),merged=mergeBackup(text,current,config.allLooks);
          config.storage.setItem(config.favoritesKey,JSON.stringify(merged));config.render();
          status.textContent='已恢复 '+(merged.length-current.length)+' 条新收藏';
        }catch{if(rev===revision)status.textContent='恢复失败，请选择有效备份；原收藏未改动';}
        finally{input.value='';importButton.disabled=false;}
      });
    });
  }
  function openItem(item,source){
    open(item.name);const art=element('div',null,'detail-art');
    for(const child of source.children)art.append(child.cloneNode(true));
    // A cloned atlas needs its own clip identifier, independent of the item grid.
    for(const clip of art.querySelectorAll('clipPath')){const old=clip.id;clip.id='detail-'+old;for(const img of art.querySelectorAll('image'))if(img.getAttribute('clip-path')===`url(#${old})`)img.setAttribute('clip-path',`url(#${clip.id})`);}
    body.append(art,element('p',item.description));
    enableZoom(art);
  }

  function enableZoom(art){
    const frame=element('div',null,'zoom-frame');while(art.firstChild)frame.append(art.firstChild);art.append(frame);art.classList.add('zoom-art');
    let scale=1,x=0,y=0,baseline=null;const points=new Map();
    const controls=element('div',null,'zoom-controls');body.append(controls);
    const label=element('output','100%');label.setAttribute('aria-live','polite');
    const minus=action(controls,'−',()=>change(scale/1.5));minus.setAttribute('aria-label','缩小单品');
    controls.append(label);
    const plus=action(controls,'＋',()=>change(scale*1.5));plus.setAttribute('aria-label','放大单品');
    const reset=action(controls,'复位',()=>{x=0;y=0;change(1);});
    function render(){const box=art.getBoundingClientRect();x=Math.max(-box.width*(scale-1)/2,Math.min(box.width*(scale-1)/2,x));y=Math.max(-box.height*(scale-1)/2,Math.min(box.height*(scale-1)/2,y));frame.style.transform=`translate(${x}px,${y}px) scale(${scale})`;label.value=Math.round(scale*100)+'%';label.textContent=label.value;minus.disabled=scale<=1;plus.disabled=scale>=4;art.dataset.zoom=String(scale);}
    function change(value){scale=Math.min(4,Math.max(1,value));render();}
    function metrics(){const p=[...points.values()];return p.length>1?{cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,d:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)}:{cx:p[0]?.x||0,cy:p[0]?.y||0,d:0};}
    function begin(){baseline={...metrics(),scale,x,y};}
    art.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});art.setPointerCapture(e.pointerId);begin();});
    art.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const m=metrics(),box=art.getBoundingClientRect();if(points.size>1&&baseline.d>0){scale=Math.min(4,Math.max(1,baseline.scale*m.d/baseline.d));const ratio=scale/baseline.scale;x=m.cx-(box.left+box.width/2)-(baseline.cx-(box.left+box.width/2)-baseline.x)*ratio;y=m.cy-(box.top+box.height/2)-(baseline.cy-(box.top+box.height/2)-baseline.y)*ratio;}else{x=baseline.x+m.cx-baseline.cx;y=baseline.y+m.cy-baseline.cy;}render();});
    const end=e=>{points.delete(e.pointerId);begin();};art.addEventListener('pointerup',end);art.addEventListener('pointercancel',end);art.addEventListener('lostpointercapture',end);
    art.addEventListener('wheel',e=>{e.preventDefault();change(scale*(e.deltaY<0?1.15:1/1.15));},{passive:false});
    art.addEventListener('dblclick',()=>{x=0;y=0;change(scale>1?1:2);});
    const observer=new ResizeObserver(render);observer.observe(art);cleanup=()=>{observer.disconnect();points.clear();};render();
  }
  function openCompare(){
    open('选择两套');let ids;
    try{ids=window.OutfitFavorites.orderedIds(readRecords(),config.allLooks,'all');}catch{status.textContent='收藏暂时无法读取';return;}
    if(ids.length<2){body.append(element('p','收藏两套穿搭后即可对比'));return;}
    const selected=new Set(),grid=element('div',null,'compare-picker'),actions=element('div',null,'detail-actions');body.append(grid,actions);
    const go=action(actions,'查看对比',()=>showComparison([...selected]));go.disabled=true;
    for(const id of ids){const look=config.allLooks.find(l=>l.id===id),button=element('button',null,'compare-choice'),img=element('img');img.src='thumbnails/'+id+'.webp';img.alt='';img.loading='lazy';button.append(img,element('span',look.name));button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',look.name);button.addEventListener('click',()=>{if(selected.has(id))selected.delete(id);else if(selected.size<2)selected.add(id);else{status.textContent='已选两套，请先取消一套';return;}button.setAttribute('aria-pressed',String(selected.has(id)));go.disabled=selected.size!==2;status.textContent=selected.size+' / 2';});grid.append(button);}
  }
  function showComparison(ids){
    open('穿搭对比');const grid=element('div',null,'compare-view');body.append(grid);
    for(const id of ids){const look=config.allLooks.find(l=>l.id===id),card=element('figure'),img=element('img');img.src=config.figureOf(id);img.alt=look.name;card.append(img,element('figcaption',config.characters.find(p=>p.id===look.character).name+' · '+look.name));grid.append(card);}
    const actions=element('div',null,'detail-actions');body.append(actions);action(actions,'重新选择',openCompare);
  }
  function openLook(look,src){
    const rev=open(look.name),photo=element('img');photo.src=src;photo.alt=look.name;
    const art=element('div',null,'detail-art');art.append(photo);body.append(art);
    const actions=element('div',null,'detail-actions');body.append(actions);
    const url=new URL('index.html',location.href);url.search='';url.hash='';url.searchParams.set('sample',look.id);
    action(actions,'分享穿搭',async()=>{
      try{
        if(navigator.share)await navigator.share({title:look.name,url:url.href});
        else if(navigator.clipboard){await navigator.clipboard.writeText(url.href);if(rev===revision)status.textContent='链接已复制';}
        else throw new Error('No clipboard');
      }catch(error){if(rev!==revision||error.name==='AbortError')return;let input=body.querySelector('.share-link');if(!input){input=element('input',null,'share-link');input.readOnly=true;input.value=url.href;input.setAttribute('aria-label','穿搭链接');body.append(input);}input.focus();input.select();status.textContent='长按复制链接';}
    });
    const save=action(actions,'保存穿搭图',async()=>{
      save.disabled=true;
      try{
        await photo.decode();
        const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1620;const ctx=canvas.getContext('2d');
        ctx.fillStyle='#eeeae2';ctx.fillRect(0,0,1080,1620);
        const scale=Math.min(1000/photo.naturalWidth,1450/photo.naturalHeight),w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;
        ctx.drawImage(photo,(1080-w)/2,35,w,h);
        ctx.fillStyle='#566348';ctx.textAlign='center';ctx.font='28px sans-serif';ctx.fillText(config.characters.find(p=>p.id===look.character).name+' · '+look.name,540,1550);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image export failed');
        if(rev!==revision||!dialog.open)return;
        download(blob,look.name+'.png');status.textContent='图片已导出，可在下载文件中保存';
      }catch{if(rev===revision)status.textContent='图片暂时未能保存，请重试';}
      finally{save.disabled=false;}
    });
  }
  return {backup,mergeBackup,mount,openItem,openLook};
});
