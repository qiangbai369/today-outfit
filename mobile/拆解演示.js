'use strict';
(async function () {
  const $ = id => document.getElementById(id);
  const G = window.OutfitGestures, F = window.OutfitFavorites;
  const stage = $('stage'), figure = $('figure'), image = $('look-image'), items = $('items'), collapse = $('collapse'), heart = $('heart');
  const allLooks = window.CompleteLookData.LOOKS;
  const characters = window.CompleteLookData.CHARACTERS;
  let character = 'sweet', looks = allLooks.filter(look => look.character === character), ids = looks.map(look => look.id);
  let view = 'picker', favoritesReturn = 'picker', favoriteCharacter = 'sweet', browseMode = 'all', editingFavorites = false;
  let undoBatches = [], undoTimer;
  const sessions = {}, priorRounds = {};
  const initialQuery = new URLSearchParams(location.search);
  const initialRoute = window.history?.state?.outfitMobile;
  let restoringRoute = false, pendingRoute = null;
  const FAVORITES_KEY = 'today-outfit-complete-preview-favorites-v1';
  const SESSION_KEY = 'today-outfit-mobile-demo-sessions-v1';
  const LEGACY_SESSION_KEY = 'today-outfit-breakdown-demo-session-v2';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  let index = 0, finished = false, ready = false, busy = false, noticeTimer, start = null, wheel = 0, wheelTime = 0, wheelLock = 0;
  let order = newRound('sweet-summer-a');
  const images = new Map();
  let breakdowns = {};
  let expansionVersion = 0, retryAction = null;
  const itemFragments = new Map();

  function newRound(first, avoid) {
    const pool = ids.filter(id => id !== first);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (!first && pool.length > 1 && pool[0] === avoid) [pool[0],pool[1]] = [pool[1],pool[0]];
    return first ? [first, ...pool] : pool;
  }
  function selected() { return looks.find(look => look.id === order[index]); }
  const feedback = $('feedback'), retryButton = $('retry');
  function feedbackState(text = '', retry = null) {
    feedback.hidden = !text;
    $('feedback-text').textContent = text;
    feedback.classList.toggle('loading', !!text && !retry);
    retryAction = retry;
    retryButton.hidden = !retry;
  }
  retryButton.addEventListener('click', () => { const action = retryAction; if (action) action(); });
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
    if (browseMode === 'favorites') return;
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
  function routeState() {
    return {view,character,favoriteCharacter,browseMode,favoritesReturn,order:[...order],index,finished,expanded:stage.classList.contains('expanded')};
  }
  function recordRoute(push = false) {
    if (restoringRoute || pendingRoute || !window.history) return;
    const url = new URL(location.href), current = window.history.state?.outfitMobile;
    url.searchParams.delete('sample'); url.searchParams.delete('view'); url.searchParams.delete('character');
    if (view === 'stage') url.searchParams.set('sample',selected().id);
    if (view === 'favorites') { url.searchParams.set('view','favorites'); url.searchParams.set('character',favoriteCharacter); }
    const depth = (current?.depth || 0) + (push ? 1 : 0);
    window.history[push ? 'pushState' : 'replaceState']({...window.history.state,outfitMobile:{...routeState(),depth}},'',url);
  }
  function goBack(fallback) {
    if (busy) return;
    if (window.history?.state?.outfitMobile?.depth > 0) window.history.back(); else fallback();
  }
  async function restoreRoute(route) {
    if (!ready) return;
    if (busy) { pendingRoute = {route}; return; }
    restoringRoute = true;
    try {
      if (!route || !characters.some(person=>person.id === route.character)) { openPicker(); return; }
      character = route.character; favoriteCharacter = route.favoriteCharacter;
      looks = allLooks.filter(look=>look.character === character); ids = looks.map(look=>look.id);
      browseMode = route.browseMode === 'favorites' ? 'favorites' : 'all'; favoritesReturn = route.favoritesReturn === 'stage' ? 'stage' : 'picker';
      order = Array.isArray(route.order) ? route.order.filter(id=>ids.includes(id)) : [];
      index = route.index; finished = !!route.finished;
      if (!order[index] || new Set(order).size !== order.length) { browseMode = 'all'; openPicker(); return; }
      if (browseMode === 'favorites') {
        const saved = F.orderedIds(F.read(storage.getItem(FAVORITES_KEY)),allLooks,character), current = order[index];
        if (!saved.includes(current)) { openFavorites(); return; }
        order = saved; index = order.indexOf(current);
      }
      if (route.view === 'stage' || (route.view === 'favorites' && favoritesReturn === 'stage')) {
        if (!await show(index)) return;
        $('character-name').textContent = characters.find(person=>person.id === character).name;
        $('character-back').setAttribute('aria-label',browseMode === 'favorites' ? '返回收藏' : '返回选角色');
        stage.dataset.browse = browseMode;
      }
      editingFavorites = false; switchView(['picker','favorites','stage'].includes(route.view) ? route.view : 'picker');
      if (view === 'favorites') renderFavorites();
      if (view === 'stage') { setExpanded(!!route.expanded,false); $('character-back').focus({preventScroll:true}); }
    } catch { feedbackState('页面暂时未能恢复',()=>restoreRoute(route)); }
    finally { restoringRoute = false; }
  }
  window.addEventListener('popstate',event=>restoreRoute(event.state?.outfitMobile));
  function switchView(nextView) {
    const changed = view !== nextView;
    taps.reset(); start = null; wheel = 0;
    expansionVersion++; feedbackState();
    view = nextView;
    $('picker').hidden = view !== 'picker';
    $('favorites').hidden = view !== 'favorites';
    stage.hidden = view !== 'stage';
    if (ready) recordRoute(changed);
  }
  async function enterCharacter(id, favoriteId, fromFavorites = false) {
    if (!ready || busy) return;
    const oldCharacter = character, oldLooks = looks, oldIds = ids, oldOrder = order, oldIndex = index, oldFinished = finished, oldBrowseMode = browseMode;
    if (view === 'stage') persist();
    character = id; looks = allLooks.filter(look => look.character === id); ids = looks.map(look => look.id);
    browseMode = fromFavorites ? 'favorites' : 'all';
    const session = sessions[id];
    if (fromFavorites) {
      try { order = F.orderedIds(F.read(storage.getItem(FAVORITES_KEY)),allLooks,id); } catch { order = []; }
      if (!order.includes(favoriteId)) { character = oldCharacter; looks = oldLooks; ids = oldIds; order = oldOrder; index = oldIndex; finished = oldFinished; browseMode = oldBrowseMode; renderFavorites(); return; }
      index = order.indexOf(favoriteId); finished = false;
    } else if (validSession(session,ids) && (!session.finished || favoriteId)) {
      order = [...session.order]; index = session.index; finished = !!session.finished;
    } else {
      order = newRound(id === 'sweet' && !session ? 'sweet-summer-a' : undefined); index = 0; finished = false;
    }
    if (favoriteId && !fromFavorites) { index = order.indexOf(favoriteId); finished = false; }
    const ok = await show(index);
    if (ok) {
      $('character-name').textContent = characters.find(person => person.id === id).name;
      $('character-back').setAttribute('aria-label',browseMode === 'favorites' ? '返回收藏' : '返回选角色');
      stage.dataset.browse = browseMode;
      switchView('stage'); $('character-back').focus({preventScroll:true});
    } else {
      character = oldCharacter; looks = oldLooks; ids = oldIds; order = oldOrder; index = oldIndex; finished = oldFinished; browseMode = oldBrowseMode;
    }
  }
  function openPicker() {
    if (busy) return;
    persist(); browseMode = 'all'; setExpanded(false,false); switchView('picker');
  }
  function renderFavorites() {
    for (const button of $('favorite-tabs').children) button.setAttribute('aria-selected',String(button.dataset.character === favoriteCharacter));
    const grid = $('favorite-photos'); grid.replaceChildren();
    let records;
    try { records = F.read(storage.getItem(FAVORITES_KEY)); }
    catch { $('favorites-edit').hidden = true; $('favorite-empty').textContent = '收藏暂时无法读取'; $('favorite-empty').hidden = false; return; }
    const savedLooks = F.orderedIds(records,allLooks,favoriteCharacter).map(id=>allLooks.find(look=>look.id===id));
    $('favorites-edit').hidden = !savedLooks.length;
    $('favorites-edit').textContent = editingFavorites ? '完成' : '编辑';
    $('favorites-edit').setAttribute('aria-pressed',String(editingFavorites));
    for (const look of savedLooks) {
      const button = document.createElement('button'); button.className = 'favorite-photo'; button.setAttribute('aria-label', look.name); button.dataset.look = look.id; button.disabled = editingFavorites;
      const photo = document.createElement('img'); photo.src = 'thumbnails/' + look.id + '.webp'; photo.alt = look.name; photo.loading = 'lazy'; photo.decoding = 'async';
      button.append(photo); button.addEventListener('click', () => { if (!editingFavorites) enterCharacter(look.character,look.id,true); });
      const card = document.createElement('div'); card.className = 'favorite-card'; card.append(button);
      const remove = document.createElement('button'); remove.className = 'favorite-remove'; remove.textContent = '×'; remove.hidden = !editingFavorites; remove.setAttribute('aria-label','取消收藏'+look.name);
      remove.addEventListener('click',()=>removeFavorite(look.id)); card.append(remove); grid.append(card);
    }
    $('favorite-empty').textContent = '暂无收藏'; $('favorite-empty').hidden = savedLooks.length > 0;
  }
  function openFavorites() {
    if (busy) return;
    if (view !== 'favorites') favoritesReturn = browseMode === 'favorites' ? 'picker' : view;
    favoriteCharacter = character; editingFavorites = false; switchView('favorites'); renderFavorites();
  }
  for (const person of characters) {
    const card = document.createElement('button'); card.className = 'character-choice'; card.dataset.character = person.id; card.setAttribute('aria-label',person.name);
    const name = document.createElement('span'); name.textContent = person.name;
    const portrait = document.createElement('div'); portrait.className = 'character-portrait';
    const photo = document.createElement('img'); photo.src = 'thumbnails/' + ({sweet:'sweet-summer-a',cool:'cool-summer-a',literary:'literary-spring-a'}[person.id]) + '.webp'; photo.alt = ''; photo.decoding = 'async'; portrait.append(photo); card.append(name,portrait);
    card.addEventListener('click',()=>enterCharacter(person.id)); $('character-choices').append(card);
    const tab = document.createElement('button'); tab.textContent = person.name; tab.dataset.character = person.id; tab.setAttribute('role','tab');
    tab.addEventListener('click',()=>{favoriteCharacter = person.id;renderFavorites();recordRoute();}); $('favorite-tabs').append(tab);
  }
  $('favorite-tabs').setAttribute('role','tablist');
  $('picker-favorites').addEventListener('click',openFavorites);
  $('stage-favorites').addEventListener('click',openFavorites);
  $('character-back').addEventListener('click',()=>goBack(()=>browseMode === 'favorites' ? openFavorites() : openPicker()));
  $('favorites-edit').addEventListener('click',()=>{editingFavorites = !editingFavorites;renderFavorites();});
  $('undo-favorite').addEventListener('click',undoFavorites);
  $('favorites-back').addEventListener('click',()=>goBack(()=>{switchView(favoritesReturn);if(view === 'stage')renderFavorite();}));
  window.addEventListener('storage',event=>{if(event.key === FAVORITES_KEY){if(view === 'favorites')renderFavorites();else if(view === 'stage')renderFavorite();}});

  function removeFavorite(id) {
    if (busy) return;
    try {
      const {remaining,removed} = F.remove(F.read(storage.getItem(FAVORITES_KEY)),id);
      if (!removed.length) return;
      storage.setItem(FAVORITES_KEY,JSON.stringify(remaining));
      feedbackState();
      undoBatches.push(removed); clearTimeout(undoTimer);
      $('favorite-toast').hidden = false;
      undoTimer = setTimeout(()=>{undoBatches = []; $('favorite-toast').hidden = true;},8000);
      renderFavorites();
    } catch { feedbackState('暂时无法取消收藏',()=>removeFavorite(id)); }
  }
  function undoFavorites() {
    try {
      const restored = F.restore(F.read(storage.getItem(FAVORITES_KEY)),undoBatches);
      storage.setItem(FAVORITES_KEY,JSON.stringify(restored));
      feedbackState();
      undoBatches = []; clearTimeout(undoTimer); $('favorite-toast').hidden = true;
      if (view === 'favorites') renderFavorites(); else if (view === 'stage') renderFavorite();
    } catch { feedbackState('暂时无法恢复收藏',undoFavorites); }
  }
  function setExpanded(open, focus = true) {
    if (open && (!ready || !breakdowns[selected().id])) return;
    expansionVersion++;
    stage.classList.toggle('expanded', open);
    stage.dataset.expanded = String(open);
    items.inert = !open;
    items.setAttribute('aria-hidden', String(!open));
    figure.inert = open;
    figure.setAttribute('aria-expanded', String(open));
    collapse.hidden = !open;
    if (focus) (open ? collapse : figure).focus({preventScroll:true});
    if (open) loadExpandedItems(); else feedbackState();
    updateItemScroll();
    if (view === 'stage') recordRoute();
  }
  function updateItemScroll() { stage.dataset.scrollItems = String(stage.classList.contains('expanded') && items.scrollHeight > items.clientHeight + 2); }
  window.addEventListener('resize',updateItemScroll);
  async function loadExpandedItems() {
    const id = selected().id, version = ++expansionVersion;
    feedbackState('加载单品…');
    let nodes;
    try { nodes = await buildItems(id); } catch {
      if (version === expansionVersion && view === 'stage' && stage.classList.contains('expanded')) feedbackState('单品未加载', loadExpandedItems);
      return;
    }
    if (version !== expansionVersion || view !== 'stage' || selected().id !== id || !stage.classList.contains('expanded')) return;
    items.replaceChildren(...nodes);
    updateItemScroll();
    if (nodes.some(node => node.dataset.failed === 'true')) {
      itemFragments.delete(id);
      feedbackState('部分单品未加载', loadExpandedItems);
    } else feedbackState();
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
    $('favorite-indicator').hidden = !saved;
    $('stage-favorites').setAttribute('aria-label',saved ? '查看收藏，当前穿搭已收藏' : '查看收藏');
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
  function decodePhoto(photo) {
    let timer;
    return Promise.race([photo.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Image timeout')), 15000); })]).finally(() => clearTimeout(timer));
  }
  function load(look) {
    if (!images.has(look.id)) {
      const photo = new Image();
      photo.src = breakdowns[look.id]?.figure || '../previews/complete-looks/' + (look.display || look.image);
      const pending = decodePhoto(photo).then(() => photo).catch(error => { images.delete(look.id); throw error; });
      images.set(look.id, pending);
    }
    return images.get(look.id);
  }
  async function show(nextIndex, animate = false) {
    if (busy) return;
    taps.reset(); busy = true; stage.setAttribute('aria-busy', 'true');
    announce('');
    feedbackState('加载人物…');
    const characterForRetry = character, lookForRetry = order[nextIndex], favoritesForRetry = browseMode === 'favorites';
    try {
      const look = looks.find(entry => entry.id === order[nextIndex]);
      const photo = await load(look);
      const count = breakdowns[look.id]?.items.length || 0;
      if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stage.classList.add('switching');
        await new Promise(resolve => setTimeout(resolve, 140));
      }
      setExpanded(false, false);
      heart.classList.remove('playing');
      items.replaceChildren(); items.dataset.count = String(count); items.setAttribute('aria-label', count + '件穿搭单品');
      index = nextIndex;
      image.src = photo.src;
      image.alt = characters.find(person => person.id === character).name + ' · ' + look.name + '，完整穿搭';
      stage.dataset.look = look.id;
      stage.dataset.index = String(index);
      figure.setAttribute('aria-label', breakdowns[look.id] ? '查看' + look.name + '穿搭拆解' : characters.find(person => person.id === character).name + ' · ' + look.name);
      stage.setAttribute('aria-label', characters.find(person => person.id === character).name + ' · ' + look.name);
      figure.disabled = false;
      renderFavorite(); persist();
      if (view === 'stage') recordRoute();
      void image.getBoundingClientRect();
      stage.classList.remove('switching');
      const next = looks.find(entry => entry.id === order[index + 1]);
      if (next) load(next).catch(() => {});
      feedbackState();
      return true;
    } catch { feedbackState('人物未加载', () => view === 'stage' ? show(nextIndex, animate) : enterCharacter(characterForRetry, lookForRetry, favoritesForRetry)); }
    finally { busy = false; stage.setAttribute('aria-busy', 'false');
      if (pendingRoute) setTimeout(()=>{if (pendingRoute) { const pending = pendingRoute; pendingRoute = null; restoreRoute(pending.route); }},0);
    }
  }
  function refreshFavoriteOrder() {
    if (browseMode !== 'favorites') return true;
    const currentId = selected()?.id;
    try {
      const updated = F.orderedIds(F.read(storage.getItem(FAVORITES_KEY)),allLooks,character);
      if (!updated.includes(currentId)) { openFavorites(); return false; }
      order = updated; index = order.indexOf(currentId); return true;
    } catch { announce('收藏暂时无法读取',true); return false; }
  }
  async function next() {
    if (!ready || busy || view !== 'stage') return;
    if (!refreshFavoriteOrder()) return;
    taps.reset();
    if (browseMode === 'favorites') {
      if (index === order.length - 1) { announce('已经是最后一套收藏',true); return; }
      await show(index + 1,true); return;
    }
    if (finished || index === order.length - 1) {
      const previous = {order:[...order],index,finished};
      order = newRound(undefined,selected().id); finished = false;
      if (await show(0,true)) priorRounds[character] = previous;
      else { order = previous.order; index = previous.index; finished = previous.finished; }
    } else {
      await show(index + 1, true);
    }
  }
  async function previous() {
    if (!ready || busy || view !== 'stage') return;
    if (!refreshFavoriteOrder()) return;
    taps.reset();
    if (index === 0 && browseMode === 'all' && priorRounds[character]) {
      const oldOrder = order, oldIndex = index, oldFinished = finished, previous = priorRounds[character];
      order = previous.order; finished = false;
      if (await show(previous.index,true)) delete priorRounds[character];
      else { order = oldOrder; index = oldIndex; finished = oldFinished; }
      return;
    }
    if (index === 0) { announce(browseMode === 'favorites' ? '已经是第一套收藏' : '已经是第一套', true); return; }
    finished = false;
    await show(index - 1, true);
  }
  const point = event => ({x:event.clientX,y:event.clientY,time:performance.now()});
  stage.addEventListener('pointerdown', event => {
    if (stage.dataset.scrollItems === 'true' && event.target.closest('#items')) { start = null; taps.reset(); return; }
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
    if (stage.dataset.scrollItems === 'true' && event.target.closest('#items')) return;
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
        try { await decodePhoto(photo); } catch { wrapper.dataset.failed = 'true'; }
        if (wrapper.dataset.failed === 'true') {
          const placeholder = document.createElement('span'); placeholder.className = 'item-unavailable'; placeholder.textContent = '未加载'; photoBox.append(placeholder);
        } else if (item.cell || item.displayBounds) {
          const ns = 'http://www.w3.org/2000/svg';
          const art = document.createElementNS(ns,'svg');
          const [column,row,rows] = item.cell || [0,0,1];
          const width = photo.naturalWidth, height = photo.naturalHeight;
          const inset = 3;
          const [left,top,right,bottom] = item.bounds || [0,0,width,height];
          const [viewLeft,viewTop,viewRight,viewBottom] = item.displayBounds || [left+inset,top+inset,right-inset,bottom-inset];
          art.setAttribute('viewBox',`${viewLeft} ${viewTop} ${viewRight-viewLeft} ${viewBottom-viewTop}`);
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
        const name = document.createElement('p'); name.className = 'item-name'; name.textContent = item.name;
        const description = document.createElement('p'); description.className = 'item-description'; description.textContent = item.description;
        caption.append(name,description);
        wrapper.append(photoBox,caption);
        return wrapper;
      })).catch(error=>{itemFragments.delete(id);throw error;});
      itemFragments.set(id,pending);
    }
    return itemFragments.get(id);
  }
  async function initialize() {
    feedbackState('加载中…');
    try {
      const response = await fetch('拆解小样信息.json?v=20261011-browse2', {signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error('单品信息读取失败');
      const data = await response.json();
      if (!allLooks.every(look => Array.isArray(data[look.id]?.items))) throw new Error('单品信息不完整');
      breakdowns = data;
      ready = true;
      if (initialRoute) { await restoreRoute(initialRoute); recordRoute(); return; }
      switchView('picker');
      const sample = initialQuery.get('sample');
      const look = allLooks.find(look=>look.id === sample);
      if (look && breakdowns[look.id]) await enterCharacter(look.character,look.id);
      else if (initialQuery.get('view') === 'favorites') {
        favoriteCharacter = characters.some(person=>person.id === initialQuery.get('character')) ? initialQuery.get('character') : 'sweet';
        switchView('favorites');renderFavorites();
      }
    } catch { feedbackState('暂时未能加载', initialize); }
  }
  await initialize();
}());
