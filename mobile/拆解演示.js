'use strict';
(async function () {
  const $ = id => document.getElementById(id);
  const G = window.OutfitGestures;
  const stage = $('stage'), figure = $('figure'), image = $('look-image'), items = $('items'), collapse = $('collapse'), heart = $('heart');
  const allLooks = window.CompleteLookData.LOOKS;
  const characters = window.CompleteLookData.CHARACTERS;
  let character = 'sweet', looks = allLooks.filter(look => look.character === character), ids = looks.map(look => look.id);
  let view = 'picker', favoritesReturn = 'picker', favoriteCharacter = 'sweet';
  const sessions = {};
  const FAVORITES_KEY = 'today-outfit-complete-preview-favorites-v1';
  const SESSION_KEY = 'today-outfit-mobile-demo-sessions-v1';
  const LEGACY_SESSION_KEY = 'today-outfit-breakdown-demo-session-v2';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  let index = 0, finished = false, ready = false, busy = false, noticeTimer, start = null, wheel = 0, wheelTime = 0, wheelLock = 0;
  let order = newRound('sweet-summer-a');
  const images = new Map();
  let breakdowns = {};
  const itemFragments = new Map();

  function newRound(first) {
    const pool = ids.filter(id => id !== first);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return first ? [first, ...pool] : pool;
  }
  function selected() { return looks.find(look => look.id === order[index]); }
  function announce(text, visible = false) {
    $('status').textContent = text;
    clearTimeout(noticeTimer);
    $('notice').hidden = !visible;
    $('notice').textContent = visible ? text : '';
    if (visible) noticeTimer = setTimeout(() => { $('notice').hidden = true; }, 1800);
  }
  function validSession(session, ids) {
    return session && Array.isArray(session.order) && session.order.length === ids.length &&
      new Set(session.order).size === ids.length && session.order.every(id => ids.includes(id)) &&
      Number.isInteger(session.index) && session.index >= 0 && session.index < ids.length;
  }
  function persist() {
    sessions[character] = {order:[...order],index,finished};
    try { storage.setItem(SESSION_KEY, JSON.stringify(sessions)); } catch { }
  }
  try {
    const saved = JSON.parse(storage.getItem(SESSION_KEY));
    for (const person of characters) {
      const personIds = allLooks.filter(look => look.character === person.id).map(look => look.id);
      if (validSession(saved?.[person.id], personIds)) sessions[person.id] = saved[person.id];
    }
    if (!sessions.sweet) {
      const old = JSON.parse(storage.getItem(LEGACY_SESSION_KEY));
      if (validSession(old, ids)) sessions.sweet = old;
    }
  } catch { }
  function switchView(nextView) {
    taps.reset(); start = null; wheel = 0;
    view = nextView;
    $('picker').hidden = view !== 'picker';
    $('favorites').hidden = view !== 'favorites';
    stage.hidden = view !== 'stage';
  }
  async function enterCharacter(id, favoriteId) {
    if (!ready || busy) return;
    const oldCharacter = character, oldLooks = looks, oldIds = ids, oldOrder = order, oldIndex = index, oldFinished = finished;
    if (view === 'stage') persist();
    character = id; looks = allLooks.filter(look => look.character === id); ids = looks.map(look => look.id);
    const session = sessions[id];
    if (validSession(session,ids) && (!session.finished || favoriteId)) {
      order = [...session.order]; index = session.index; finished = !!session.finished;
    } else {
      order = newRound(id === 'sweet' && !session ? 'sweet-summer-a' : undefined); index = 0; finished = false;
    }
    if (favoriteId) { index = order.indexOf(favoriteId); finished = false; }
    const ok = await show(index);
    if (ok) {
      $('character-name').textContent = characters.find(person => person.id === id).name;
      switchView('stage'); $('character-back').focus({preventScroll:true});
    } else {
      character = oldCharacter; looks = oldLooks; ids = oldIds; order = oldOrder; index = oldIndex; finished = oldFinished;
    }
  }
  function openPicker() {
    if (busy) return;
    persist(); setExpanded(false,false); switchView('picker');
  }
  function renderFavorites() {
    for (const button of $('favorite-tabs').children) button.setAttribute('aria-selected',String(button.dataset.character === favoriteCharacter));
    const grid = $('favorite-photos'); grid.replaceChildren();
    let records;
    try { records = JSON.parse(storage.getItem(FAVORITES_KEY) || '[]'); if (!Array.isArray(records)) throw new Error(); }
    catch { $('favorite-empty').textContent = '收藏暂时无法读取'; $('favorite-empty').hidden = false; return; }
    const savedIds = new Set(records.map(record => typeof record === 'string' ? record : record?.id));
    const savedLooks = allLooks.filter(look => look.character === favoriteCharacter && savedIds.has(look.id));
    for (const look of savedLooks) {
      const button = document.createElement('button'); button.className = 'favorite-photo'; button.setAttribute('aria-label', look.name); button.dataset.look = look.id;
      const photo = document.createElement('img'); photo.src = '../previews/complete-looks/' + (look.display || look.image); photo.alt = look.name; photo.loading = 'lazy';
      button.append(photo); button.addEventListener('click', () => enterCharacter(look.character,look.id)); grid.append(button);
    }
    $('favorite-empty').textContent = '暂无收藏'; $('favorite-empty').hidden = savedLooks.length > 0;
  }
  function openFavorites() {
    if (busy) return;
    favoritesReturn = view; favoriteCharacter = character; switchView('favorites'); renderFavorites();
  }
  const portraitFiles = {sweet:'assets/sweet-summer-a.png',cool:'assets/cutouts/cool-summer-a.png',literary:'assets/literary-spring-a.png'};
  for (const person of characters) {
    const card = document.createElement('button'); card.className = 'character-choice'; card.dataset.character = person.id; card.setAttribute('aria-label',person.name);
    const name = document.createElement('span'); name.textContent = person.name;
    const portrait = document.createElement('div'); portrait.className = 'character-portrait';
    const photo = document.createElement('img'); photo.src = '../previews/complete-looks/' + portraitFiles[person.id]; photo.alt = ''; portrait.append(photo); card.append(name,portrait);
    card.addEventListener('click',()=>enterCharacter(person.id)); $('character-choices').append(card);
    const tab = document.createElement('button'); tab.textContent = person.name; tab.dataset.character = person.id; tab.setAttribute('role','tab');
    tab.addEventListener('click',()=>{favoriteCharacter = person.id;renderFavorites();}); $('favorite-tabs').append(tab);
  }
  $('favorite-tabs').setAttribute('role','tablist');
  $('picker-favorites').addEventListener('click',openFavorites);
  $('stage-favorites').addEventListener('click',openFavorites);
  $('character-back').addEventListener('click',openPicker);
  $('favorites-back').addEventListener('click',()=>switchView(favoritesReturn));
  window.addEventListener('storage',event=>{if(event.key === FAVORITES_KEY){if(view === 'favorites')renderFavorites();else if(view === 'stage')renderFavorite();}});

  function setExpanded(open, focus = true) {
    if (open && (!ready || !breakdowns[selected().id])) return;
    stage.classList.toggle('expanded', open);
    stage.dataset.expanded = String(open);
    items.inert = !open;
    items.setAttribute('aria-hidden', String(!open));
    figure.inert = open;
    figure.setAttribute('aria-expanded', String(open));
    collapse.hidden = !open;
    if (focus) (open ? collapse : figure).focus({preventScroll:true});
  }
  function isFavorite(id) {
    try {
      const records = JSON.parse(storage.getItem(FAVORITES_KEY));
      return Array.isArray(records) && records.some(record => (typeof record === 'string' ? record : record?.id) === id);
    } catch { return false; }
  }
  function renderFavorite() {
    const saved = isFavorite(selected().id);
    stage.dataset.favorited = String(saved);
    figure.setAttribute('aria-pressed', String(saved));
  }
  function like(point) {
    if (!ready || busy || view !== 'stage') return;
    try {
      if (!storage) throw new Error('Storage unavailable');
      const raw = storage.getItem(FAVORITES_KEY);
      const records = G.addFavorite(raw, selected().id);
      if (raw === null || records.length > JSON.parse(raw).length) storage.setItem(FAVORITES_KEY, JSON.stringify(records));
      renderFavorite();
      announce('已收藏这套穿搭');
      const box = stage.getBoundingClientRect();
      heart.style.left = Math.max(50, Math.min(box.width - 50, point.x - box.left)) + 'px';
      heart.style.top = Math.max(80, Math.min(box.height - 60, point.y - box.top)) + 'px';
      heart.classList.remove('playing');
      void heart.getBoundingClientRect();
      heart.classList.add('playing');
    } catch { announce('暂时无法保存收藏', true); }
  }
  const taps = G.createTapController({
    single: point => { if (point.onFigure && ready && !busy) setExpanded(true); },
    double: like
  });
  heart.addEventListener('animationend', () => heart.classList.remove('playing'));
  function load(look) {
    if (!images.has(look.id)) {
      const photo = new Image();
      photo.src = '../previews/complete-looks/' + (look.display || look.image);
      const pending = photo.decode().then(() => photo).catch(error => { images.delete(look.id); throw error; });
      images.set(look.id, pending);
    }
    return images.get(look.id);
  }
  async function show(nextIndex, animate = false) {
    if (busy) return;
    taps.reset(); busy = true; stage.setAttribute('aria-busy', 'true');
    try {
      const look = looks.find(entry => entry.id === order[nextIndex]);
      const photo = await load(look);
      const itemNodes = await buildItems(look.id);
      if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stage.classList.add('switching');
        await new Promise(resolve => setTimeout(resolve, 140));
      }
      setExpanded(false, false);
      heart.classList.remove('playing');
      items.replaceChildren(...itemNodes); items.dataset.count = String(itemNodes.length); items.setAttribute('aria-label', itemNodes.length + '件穿搭单品');
      index = nextIndex;
      image.src = photo.src;
      image.alt = characters.find(person => person.id === character).name + ' · ' + look.name + '，完整穿搭';
      stage.dataset.look = look.id;
      stage.dataset.index = String(index);
      figure.setAttribute('aria-label', breakdowns[look.id] ? '查看' + look.name + '穿搭拆解' : characters.find(person => person.id === character).name + ' · ' + look.name);
      stage.setAttribute('aria-label', characters.find(person => person.id === character).name + ' · ' + look.name);
      figure.disabled = false;
      renderFavorite(); persist();
      void image.getBoundingClientRect();
      stage.classList.remove('switching');
      const next = looks.find(entry => entry.id === order[index + 1]);
      if (next) load(next).catch(() => {});
      return true;
    } catch { announce('图片暂时没有加载好，请再试一次', true); }
    finally { busy = false; stage.setAttribute('aria-busy', 'false'); }
  }
  async function next() {
    if (!ready || busy || view !== 'stage') return;
    taps.reset();
    if (finished) {
      order = newRound(); finished = false;
      await show(0, true);
    } else if (index === order.length - 1) {
      finished = true; persist(); announce('这轮看完了', true);
    } else {
      await show(index + 1, true);
    }
  }
  async function previous() {
    if (!ready || busy || view !== 'stage') return;
    taps.reset();
    if (index === 0) { announce('已经是第一套', true); return; }
    finished = false;
    await show(index - 1, true);
  }
  const point = event => ({x:event.clientX,y:event.clientY,time:performance.now()});
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('#collapse, #character-back, #stage-favorites') || !ready || busy) return;
    if (!event.isPrimary) { start = null; taps.reset(); return; }
    start = {...point(event),id:event.pointerId,onFigure:!!event.target.closest('#figure')};
    taps.secondPress(start);
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (start && start.id === event.pointerId && Math.hypot(event.clientX-start.x,event.clientY-start.y)>14) taps.reset();
  });
  stage.addEventListener('pointerup', event => {
    if (!start || start.id !== event.pointerId) return;
    const origin = start; start = null;
    const end = point(event);
    const gesture = G.classifyGesture(origin, end);
    if (gesture === 'next') { taps.reset(); next(); }
    else if (gesture === 'previous') { taps.reset(); previous(); }
    else if (gesture === 'tap') taps.tap({...end,onFigure:origin.onFigure});
    else taps.reset();
  });
  stage.addEventListener('pointercancel', () => { start = null; taps.reset(); });
  stage.addEventListener('contextmenu', event => event.preventDefault());
  stage.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    taps.reset();
    if (event.deltaY === 0 || now < wheelLock) { wheel = 0; return; }
    if (now-wheelTime>180 || Math.sign(wheel) !== Math.sign(event.deltaY)) wheel = 0;
    wheel += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    wheelTime = now;
    if (Math.abs(wheel) > 45) { const forward = wheel > 0; wheel = 0; wheelLock = now + 650; forward ? next() : previous(); }
  },{passive:false});
  figure.addEventListener('click', event => { if (event.detail === 0) setExpanded(true); });
  collapse.addEventListener('click', () => { taps.reset(); setExpanded(false); });
  document.addEventListener('keydown', event => {
    if (view !== 'stage') return;
    if (event.key === 'Escape') { taps.reset(); setExpanded(false); }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') { event.preventDefault(); previous(); }
    if (event.key === 'ArrowDown' || event.key === 'PageDown') { event.preventDefault(); next(); }
  });
  async function buildItems(id) {
    if (!breakdowns[id]) return [];
    if (!itemFragments.has(id)) {
      const pending = Promise.all(breakdowns[id].items.map(async (item, index) => {
        const wrapper = document.createElement('div'); wrapper.className = 'item';
        const photo = document.createElement('img'); photo.src = item.image; photo.alt = item.name; photo.draggable = false;
        const photoBox = document.createElement('div'); photoBox.className = 'item-photo';
        await photo.decode();
        if (item.cell) {
          const ns = 'http://www.w3.org/2000/svg';
          const art = document.createElementNS(ns,'svg');
          const [column,row,rows] = item.cell;
          const width = photo.naturalWidth, height = photo.naturalHeight;
          const inset = 3;
          const [left,top,right,bottom] = item.bounds || [column*width/2,row*height/rows,(column+1)*width/2,(row+1)*height/rows];
          art.setAttribute('viewBox',`${left+inset} ${top+inset} ${right-left-inset*2} ${bottom-top-inset*2}`);
          art.setAttribute('role','img'); art.setAttribute('aria-label',item.name);
          art.classList.add('item-art');
          const atlas = document.createElementNS(ns,'image');
          atlas.setAttribute('href',photo.src);atlas.setAttribute('width',width);atlas.setAttribute('height',height);
          const clip = document.createElementNS(ns,'clipPath');
          clip.id = `cell-${id}-${index}`;clip.setAttribute('clipPathUnits','userSpaceOnUse');
          const rect = document.createElementNS(ns,'rect');
          rect.setAttribute('x',left+inset);rect.setAttribute('y',top+inset);
          rect.setAttribute('width',right-left-inset*2);rect.setAttribute('height',bottom-top-inset*2);
          clip.append(rect);atlas.setAttribute('clip-path',`url(#${clip.id})`);
          art.append(clip,atlas);photoBox.append(art);
        } else photoBox.append(photo);
        const caption = document.createElement('div'); caption.className = 'item-caption';
        const number = document.createElement('p'); number.className = 'item-number'; number.textContent = String(index + 1).padStart(2,'0');
        const name = document.createElement('p'); name.className = 'item-name'; name.textContent = item.name;
        const description = document.createElement('p'); description.className = 'item-description'; description.textContent = item.description;
        caption.append(number,name,description);wrapper.append(photoBox,caption);
        return wrapper;
      })).catch(error=>{itemFragments.delete(id);throw error;});
      itemFragments.set(id,pending);
    }
    return itemFragments.get(id);
  }
  try {
    const response = await fetch('拆解小样信息.json');
    if (!response.ok) throw new Error('单品信息读取失败');
    breakdowns = await response.json();
    ready = true; switchView('picker');
    const sample = new URLSearchParams(location.search).get('sample');
    const look = allLooks.find(look=>look.id === sample);
    if (look && breakdowns[look.id]) await enterCharacter(look.character,look.id);
  } catch { announce('图片暂时没有加载好，请刷新再试',true); }
}());
