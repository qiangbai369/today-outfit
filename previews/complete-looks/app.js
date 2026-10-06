(function () {
  'use strict';
  const G = window.CompleteLookGallery, R = window.CompleteLookLighting;
  const $ = selector => document.querySelector(selector);
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  let savedSession;
  try { savedSession = JSON.parse(storage.getItem(G.SESSION_KEY)); } catch { savedSession = null; }
  let selected = savedSession ? G.choose(savedSession) : G.find(G.REPRESENTATIVES.sweet);
  let light = G.normalizeLight(savedSession?.light);
  let motion = G.normalizeMotion(selected.id, savedSession?.motion), angle = G.normalizeAngle(savedSession?.angle);
  let favorites = G.readFavorites(storage);
  let loaded = null, request = 0, loadingTimer, animation, downloadURL, downloadRequest = 0;
  const images = new Map();
  const make = (w, h) => { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; };
  const characterFor = look => G.CHARACTERS.find(c => c.id === look.character);
  const seasonFor = look => G.SEASONS.find(s => s.id === look.season);
  const motionName = (look, id) => G.actionsFor(look.id).find(a => a.id === id)?.name || (id === 'ponytail' ? '马尾轻摆（旧收藏）' : '');
  const notice = text => { $('#status').textContent = text; $('#status').hidden = !text; };
  const entryFor = () => ({ id: selected.id, light, ...(motion === 'natural' ? {} : { motion }), ...(['ponytail', 'wave'].includes(motion) ? { angle } : {}) });
  const persist = () => { try { storage.setItem(G.SESSION_KEY, JSON.stringify(G.selectionFor(selected.id, light, motion, angle))); } catch { /* Browsing works without storage. */ } };
  function stopAnimation() { cancelAnimationFrame(animation); animation = null; }

  function imageFor(look, pose = 'natural') {
    const key = look.id + ':' + pose;
    if (!images.has(key)) {
      const asset = pose === 'natural' ? (look.cartoon || look.display || look.image) : look.poses[pose];
      const promise = (async () => {
        const neutral = pose === 'natural' ? null : await imageFor(look);
        const read = async path => { const image = new Image(); image.src = path; await image.decode(); return R.prepare(image, make, neutral); };
        if (typeof asset === 'string') return read(asset);
        if (asset.image) return R.wavePack(await read(asset.image), asset, make);
        const [body, tail] = await Promise.all([read(asset.base), read(asset.layer)]);
        return { body, tail, pivot: asset.pivot };
      })().catch(error => { images.delete(key); throw error; });
      images.set(key, promise);
      if (images.size > 16) images.delete(images.keys().next().value);
    }
    return images.get(key);
  }
  const frameFor = (prepared, pose, currentAngle = 0) => pose === 'ponytail' ? R.ponytailFrame(prepared, currentAngle) : pose === 'wave' ? R.waveFrame(prepared, currentAngle) : prepared;

  function thumbnail(image, look, lighting, pose = 'natural', savedAngle = 0) {
    image.src = look.cartoon || look.display || look.image;
    imageFor(look, pose).then(prepared => {
      if (!image.isConnected) return;
      const photo = R.photo(frameFor(prepared, pose, savedAngle), lighting);
      const small = make(240, 320); small.getContext('2d').drawImage(photo, 0, 0, 240, 320);
      image.src = small.toDataURL('image/webp', .9);
      image.dataset.light = lighting; image.dataset.motion = pose;
    }).catch(() => { if (image.isConnected) image.alt = '图片未能加载'; });
  }

  function renderFilters() {
    for (const button of $('#characters').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.character === selected.character));
    for (const button of $('#seasons').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.season === selected.season));
    const pair = G.forSeason(selected.character, selected.season);
    $('#looks').replaceChildren(...pair.map(look => {
      const button = document.createElement('button'); button.className = 'look-card'; button.dataset.look = look.id;
      button.setAttribute('aria-pressed', String(look.id === selected.id)); button.setAttribute('aria-label', look.name);
      const picture = document.createElement('span'); picture.className = 'look-picture';
      const image = document.createElement('img'); image.alt = ''; image.decoding = 'async'; picture.append(image);
      const name = document.createElement('span'); name.className = 'look-card-name'; name.textContent = look.name;
      button.append(picture, name); button.addEventListener('click', () => show(look));
      queueMicrotask(() => thumbnail(image, look, light)); return button;
    }));
    $('#pair-count').textContent = pair.length + ' 套'; $('#looks').scrollTop = 0;
  }
  function renderMotions() {
    const actions = G.actionsFor(selected.id);
    $('#motions').replaceChildren(...actions.map(action => {
      const button = document.createElement('button'); button.dataset.motion = action.id; button.textContent = action.name;
      button.disabled = !action.supported; button.title = action.supported ? '再点一次回到自然状态' : '这套动作待适配';
      button.setAttribute('aria-pressed', String(motion === action.id));
      button.addEventListener('click', () => show(selected, motion === action.id ? 'natural' : action.id, 0, ['ponytail', 'wave'].includes(action.id) && motion !== action.id));
      return button;
    }));
    $('#motion-note').hidden = actions.some(action => action.supported);
  }
  function renderFavorite() {
    const isSaved = favorites.some(entry => G.favoriteKey(entry) === G.favoriteKey(entryFor()));
    $('#favorite').setAttribute('aria-pressed', String(isSaved));
    $('#favorite-icon').textContent = isSaved ? '♥' : '♡'; $('#favorite-label').textContent = isSaved ? '已收藏' : '收藏这套';
    $('#favorite-count').textContent = favorites.length ? String(favorites.length) : '';
  }
  function updateDownload(ready) {
    if (!loaded || loaded.id !== selected.id || loaded.light !== light || loaded.motion !== motion) return;
    const current = ++downloadRequest;
    $('#download').setAttribute('aria-disabled', 'true');
    R.photo(loaded.frame, light).toBlob(blob => {
      if (current !== downloadRequest) return;
      if (!blob) { notice('整图未能导出，请重试。'); return; }
      const oldURL = downloadURL;
      downloadURL = URL.createObjectURL(blob); $('#download').href = downloadURL;
      $('#download').setAttribute('aria-disabled', 'false');
      if (oldURL) setTimeout(() => URL.revokeObjectURL(oldURL), 60000);
      if (ready) ready();
    }, 'image/png');
    $('#download').download = [characterFor(selected).name, selected.name, motionName(selected, motion), R.lightFor(light).name].filter(Boolean).join('-') + '.png';
    Object.assign($('#download').dataset, { look: selected.id, light, motion });
  }
  function animatePonytail(pack, currentRequest) {
    const canvas = $('#motion-canvas'), ctx = canvas.getContext('2d');
    const body = R.figure(pack.body, light), tail = R.figure(pack.tail, light);
    const litPack = { ...pack, body: { ...pack.body, base: body }, tail: { ...pack.tail, base: tail } };
    let start;
    $('#look-image').hidden = true; canvas.hidden = false;
    const tick = time => {
      if (request !== currentRequest || motion !== 'ponytail') return;
      if (start === undefined) start = time;
      const progress = Math.min(1, (time - start) / 1900);
      angle = progress === 1 ? 0 : .055 * Math.sin(progress * Math.PI * 5) * (1 - progress);
      const frame = R.ponytailFrame(litPack, angle);
      ctx.clearRect(0, 0, R.WIDTH, R.HEIGHT); ctx.drawImage(frame.base, 0, 0);
      canvas.dataset.angle = String(angle); loaded.frame = R.ponytailFrame(pack, angle);
      if (progress < 1) animation = requestAnimationFrame(tick);
      else { animation = null; $('#look-image').src = frame.base.toDataURL('image/png'); $('#look-image').hidden = false; canvas.hidden = true; updateDownload(); persist(); }
    };
    animation = requestAnimationFrame(tick);
  }

  function animateWave(pack, currentRequest) {
    const canvas = $('#motion-canvas'), ctx = canvas.getContext('2d');
    const lit = R.figure(pack.prepared, light), litPrepared = { ...pack.prepared, base: lit };
    const litPack = R.wavePack(litPrepared, selected.poses.wave, make);
    let start;
    $('#look-image').hidden = true; canvas.hidden = false;
    const tick = time => {
      if (request !== currentRequest || motion !== 'wave') return;
      if (start === undefined) start = time;
      const progress = Math.min(1, (time - start) / 1800);
      angle = progress === 1 ? 0 : .04 * Math.sin(progress * Math.PI * 4) * Math.sin(progress * Math.PI);
      ctx.clearRect(0, 0, R.WIDTH, R.HEIGHT); ctx.drawImage(R.waveFrame(litPack, angle).base, 0, 0);
      canvas.dataset.angle = String(angle); loaded.frame = R.waveFrame(pack, angle);
      if (progress < 1) animation = requestAnimationFrame(tick);
      else { animation = null; $('#look-image').src = lit.toDataURL('image/png'); $('#look-image').hidden = false; canvas.hidden = true; updateDownload(); persist(); }
    };
    animation = requestAnimationFrame(tick);
  }

  async function show(look, requestedMotion = look.id === selected.id ? motion : 'natural', requestedAngle = 0, animate = false) {
    stopAnimation();
    ++downloadRequest;
    selected = look; motion = G.normalizeMotion(look.id, requestedMotion); angle = ['ponytail', 'wave'].includes(motion) ? G.normalizeAngle(requestedAngle) : 0;
    const currentRequest = ++request, currentLight = light, currentMotion = motion;
    renderFilters(); renderMotions(); renderFavorite(); notice('');
    for (const button of $('#lights').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.light === currentLight));
    $('#stage').setAttribute('aria-busy', 'true'); $('#favorite').disabled = true; $('#download').setAttribute('aria-disabled', 'true'); $('#retry').hidden = true;
    clearTimeout(loadingTimer); loadingTimer = setTimeout(() => { if (currentRequest === request) $('#loading').hidden = false; }, 200);
    try {
      const prepared = await imageFor(look, currentMotion);
      if (currentRequest !== request) return;
      const frame = frameFor(prepared, currentMotion, angle);
      const figureURL = R.figure(frame, currentLight).toDataURL('image/png');
      const ready = new Image(); ready.src = figureURL; await ready.decode();
      if (currentRequest !== request) return;
      loaded = { id: look.id, light: currentLight, motion: currentMotion, frame };
      $('#look-image').src = figureURL; $('#look-image').hidden = false; $('#motion-canvas').hidden = true;
      const description = [characterFor(look).name, look.name, motionName(look, currentMotion), R.lightFor(currentLight).name].filter(Boolean).join(' · ') + '，完整穿搭';
      $('#look-image').alt = description; $('#motion-canvas').setAttribute('aria-label', description);
      for (const element of [$('#look-image'), $('#motion-canvas')]) Object.assign(element.dataset, { look: look.id, light: currentLight, motion: currentMotion });
      $('#stage').dataset.light = currentLight;
      R.lightFor(currentLight).colors.forEach((color, index) => $('#stage').style.setProperty('--studio-' + index, color));
      $('#stage-name').textContent = characterFor(look).name; $('#look-name').textContent = look.name;
      const pair = G.forSeason(look.character, look.season);
      $('#look-counter').textContent = String(pair.findIndex(l => l.id === look.id) + 1).padStart(2, '0') + ' / 02';
      $('#favorite').disabled = false; $('#download').setAttribute('aria-disabled', 'false'); updateDownload(); persist();
      if (animate && currentMotion === 'ponytail' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) animatePonytail(prepared, currentRequest);
      if (animate && currentMotion === 'wave' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) animateWave(prepared, currentRequest);
      for (const adjacent of pair) if (adjacent.id !== look.id) imageFor(adjacent).catch(() => {});
    } catch {
      if (currentRequest !== request) return;
      notice('图片未能加载，请重试。'); $('#retry').hidden = false;
    } finally {
      if (currentRequest === request) { clearTimeout(loadingTimer); $('#loading').hidden = true; $('#stage').setAttribute('aria-busy', 'false'); }
    }
  }
  function changeFavorite(entry) {
    const key = G.favoriteKey(entry), isSaved = favorites.some(saved => G.favoriteKey(saved) === key);
    const next = isSaved ? favorites.filter(saved => G.favoriteKey(saved) !== key) : [...favorites, entry];
    try { favorites = G.writeFavorites(storage, next); renderFavorite(); notice(''); return true; }
    catch { notice('浏览器未能保存收藏，请检查存储设置。'); return false; }
  }
  function renderSaved() {
    const container = $('#saved-looks'); container.replaceChildren();
    if (!favorites.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = '还没有收藏，遇到喜欢的一套就留在这里。'; container.append(empty); return; }
    for (const entry of [...favorites].reverse()) {
      const { id, light: savedLight, motion: savedMotion = 'natural', angle: savedAngle = 0 } = entry;
      const look = G.find(id), card = document.createElement('article'); card.className = 'saved-card';
      const open = document.createElement('button'); open.className = 'saved-open';
      Object.assign(open.dataset, { savedLook: id, savedLight, savedMotion });
      const poseLabel = motionName(look, savedMotion);
      open.setAttribute('aria-label', '查看 ' + [characterFor(look).name, look.name, poseLabel, R.lightFor(savedLight).name].filter(Boolean).join(' · '));
      const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy';
      const title = document.createElement('span'); title.className = 'saved-title'; title.textContent = look.name;
      const detail = document.createElement('small'); detail.textContent = [characterFor(look).name, seasonFor(look).name, poseLabel, R.lightFor(savedLight).name].filter(Boolean).join(' · '); title.append(detail);
      open.append(image, title); open.addEventListener('click', () => { $('#favorites-dialog').close(); light = savedLight; show(look, savedMotion, savedAngle); });
      const remove = document.createElement('button'); remove.className = 'remove-favorite'; remove.textContent = '♡'; remove.setAttribute('aria-label', '取消收藏 ' + [look.name, poseLabel, R.lightFor(savedLight).name].filter(Boolean).join(' · '));
      remove.addEventListener('click', () => { if (changeFavorite(entry)) renderSaved(); }); card.append(open, remove); container.append(card);
      thumbnail(image, look, savedLight, savedMotion, savedAngle);
    }
  }
  for (const lighting of R.LIGHTS) {
    const button = document.createElement('button'); button.className = 'light'; button.dataset.light = lighting.id; button.textContent = lighting.name;
    button.addEventListener('click', () => { if (light !== lighting.id) { light = lighting.id; show(selected, motion, angle); } }); $('#lights').append(button);
  }
  for (const character of G.CHARACTERS) {
    const button = document.createElement('button'); button.className = 'character'; button.dataset.character = character.id;
    const avatar = document.createElement('span'); avatar.className = 'avatar'; const image = document.createElement('img'); image.src = character.portrait; image.alt = ''; avatar.append(image);
    const name = document.createElement('span'); name.textContent = character.name; button.append(avatar, name);
    button.addEventListener('click', () => { if (selected.character !== character.id) show(selected.season === 'autumn' ? G.find(G.REPRESENTATIVES[character.id]) : G.choose({ character: character.id, season: selected.season })); }); $('#characters').append(button);
  }
  for (const season of G.SEASONS) {
    const button = document.createElement('button'); button.className = 'season'; button.dataset.season = season.id; button.textContent = season.name;
    button.addEventListener('click', () => { if (selected.season !== season.id) show(season.id === 'autumn' ? G.find(G.REPRESENTATIVES[selected.character]) : G.choose({ character: selected.character, season: season.id })); }); $('#seasons').append(button);
  }
  function step(direction) { const pair = G.forSeason(selected.character, selected.season), index = pair.findIndex(l => l.id === selected.id); show(pair[(index + direction + pair.length) % pair.length]); }
  $('#previous').addEventListener('click', () => step(-1)); $('#next').addEventListener('click', () => step(1)); $('#retry').addEventListener('click', () => show(selected, motion, angle));
  $('#favorite').addEventListener('click', () => {
    if (loaded?.id !== selected.id || loaded.light !== light || loaded.motion !== motion) return;
    if (animation) { stopAnimation(); $('#look-image').src = R.figure(loaded.frame, light).toDataURL('image/png'); $('#look-image').hidden = false; $('#motion-canvas').hidden = true; updateDownload(); persist(); }
    changeFavorite(entryFor());
  });
  $('#download').addEventListener('click', event => {
    if ($('#download').getAttribute('aria-disabled') === 'true') event.preventDefault();
    else if (animation) { event.preventDefault(); stopAnimation(); $('#look-image').src = R.figure(loaded.frame, light).toDataURL('image/png'); $('#look-image').hidden = false; $('#motion-canvas').hidden = true; updateDownload(() => $('#download').click()); persist(); }
  });
  $('#library').addEventListener('click', () => { renderSaved(); $('#favorites-dialog').showModal(); }); $('#close-favorites').addEventListener('click', () => $('#favorites-dialog').close());
  $('#favorites-dialog').addEventListener('click', event => { if (event.target === $('#favorites-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
  show(selected, motion, angle);
})();
