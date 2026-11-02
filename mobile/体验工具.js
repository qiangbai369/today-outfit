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
  let config,dialog,body,status,title,revision=0;
  const $=id=>document.getElementById(id);
  function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
  function open(name){revision++;title.textContent=name;body.replaceChildren();status.textContent='';if(!dialog.open)dialog.showModal();return revision;}
  function action(parent,text,handler){const b=element('button',text);b.type='button';b.addEventListener('click',handler);parent.append(b);return b;}
  function download(blob,name){const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function readRecords(){return window.OutfitFavorites.read(config.storage?.getItem(config.favoritesKey)??null);}
  function mount(options){
    config=options;dialog=$('detail-dialog');body=$('detail-body');status=$('detail-status');title=$('detail-title');
    if ('ResizeObserver' in window) new ResizeObserver(entries=>{const height=entries[0].target.getBoundingClientRect().height;if(height)document.documentElement.style.setProperty('--feedback-height',height+'px');}).observe($('feedback'));
    $('detail-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{revision++;});
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
