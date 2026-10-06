(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'), require('./cartoon.js'));
  else root.CompleteLookGallery = factory(root.CompleteLookData, root.CompleteLookCartoon);
})(globalThis, function (data, cartoon) {
  'use strict';
  const FAVORITES_KEY = 'today-outfit-complete-preview-favorites-v1';
  const SESSION_KEY = 'today-outfit-complete-preview-session-v1';
  const normalizeLight = light => ['natural', 'warm', 'cool'].includes(light) ? light : 'natural';
  const LOOKS = data.LOOKS.map(look => ({ ...look, ...cartoon.SAMPLES[look.id] }));
  const CHARACTERS = data.CHARACTERS.map(character => ({ ...character, portrait: cartoon.SAMPLES[cartoon.REPRESENTATIVES[character.id]].cartoon }));
  const find = id => LOOKS.find(look => look.id === id);
  const forSeason = (character, season) => LOOKS.filter(look => look.character === character && look.season === season);
  const normalizeMotion = (id, motion) => find(id)?.poses?.[motion] ? motion : 'natural';
  const normalizeAngle = angle => Number.isFinite(angle) ? Math.max(-.07, Math.min(.07, angle)) : 0;
  const actionsFor = id => (cartoon.ACTIONS[find(id)?.character] || []).map(action => ({ ...action, supported: !!find(id)?.poses?.[action.id] }));
  function poseFields(id, motion, angle) {
    const valid = normalizeMotion(id, motion);
    if (valid === 'natural') return {};
    return ['ponytail', 'wave'].includes(valid) ? { motion: valid, angle: normalizeAngle(angle) } : { motion: valid };
  }
  function choose(selection = {}) {
    const character = data.CHARACTERS.some(c => c.id === selection.character) ? selection.character : 'sweet';
    const season = data.SEASONS.some(s => s.id === selection.season) ? selection.season : 'autumn';
    const pair = forSeason(character, season);
    return pair.find(look => look.id === selection.look) || pair[0];
  }
  function selectionFor(id, light = 'natural', motion, angle) {
    const look = find(id);
    return look ? { character: look.character, season: look.season, look: look.id, light: normalizeLight(light), ...poseFields(id, motion, angle) } : null;
  }
  const favoriteKey = entry => entry.id + ':' + normalizeLight(entry.light) + (normalizeMotion(entry.id, entry.motion) === 'natural' ? '' : ':' + entry.motion);
  function validFavorites(value) {
    if (!Array.isArray(value)) return [];
    const records = new Map();
    for (const saved of value) {
      const id = typeof saved === 'string' ? saved : saved?.id;
      if (!find(id)) continue;
      const entry = { id, light: normalizeLight(saved?.light), ...poseFields(id, saved?.motion, saved?.angle) };
      records.set(favoriteKey(entry), entry);
    }
    return [...records.values()];
  }
  function readFavorites(storage) {
    try { return validFavorites(JSON.parse(storage.getItem(FAVORITES_KEY))); }
    catch { return []; }
  }
  function writeFavorites(storage, ids) {
    const valid = validFavorites(ids);
    storage.setItem(FAVORITES_KEY, JSON.stringify(valid));
    return valid;
  }
  return { ...data, LOOKS, CHARACTERS, REPRESENTATIVES: cartoon.REPRESENTATIVES, FAVORITES_KEY, SESSION_KEY, find, forSeason, choose, selectionFor, normalizeLight, normalizeMotion, normalizeAngle, actionsFor, favoriteKey, readFavorites, writeFavorites };
});
