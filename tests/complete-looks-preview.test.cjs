const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const preview = path.join(root, 'previews/complete-looks');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const api = () => {
  assert.ok(fs.existsSync(path.join(preview, 'gallery.js')), 'The confirmed complete-look browser has not been implemented');
  return require(path.join(preview, 'gallery.js'));
};

test('every character and season opens two complete looks, all 24 remain browsable', () => {
  const G = api();
  assert.equal(G.LOOKS.length, 24);
  assert.equal(new Set(G.LOOKS.map(l => l.id)).size, 24);
  for (const character of ['sweet', 'cool', 'literary']) {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const looks = G.forSeason(character, season);
      assert.equal(looks.length, 2, `${character}/${season}`);
      assert.equal(G.choose({ character, season }).id, looks[0].id);
    }
  }
});

test('a saved look restores its own character and season instead of a previous filter', () => {
  const G = api();
  const restored = G.selectionFor('cool-winter-b');
  assert.deepEqual(restored, { character: 'cool', season: 'winter', look: 'cool-winter-b', light: 'natural' });
  assert.equal(G.choose({ character: 'sweet', season: 'spring', look: 'cool-winter-b' }).id, 'sweet-spring-a');
  assert.equal(G.choose({ character: 'missing', season: 'missing' }).id, 'sweet-autumn-a');
  assert.equal(G.selectionFor('unknown'), null);
});

test('favorites survive reload without touching existing dress-up saved records', () => {
  const G = api();
  const stored = new Map([['today-outfit-plans-v1', '[{"name":"用户原收藏"}]']]);
  const storage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
  assert.deepEqual(G.readFavorites(storage), []);
  G.writeFavorites(storage, ['sweet-spring-a', 'cool-winter-b', 'cool-winter-b', 'unknown']);
  assert.deepEqual(G.readFavorites(storage), [{ id: 'sweet-spring-a', light: 'natural' }, { id: 'cool-winter-b', light: 'natural' }]);
  assert.equal(stored.get('today-outfit-plans-v1'), '[{"name":"用户原收藏"}]');
  stored.set(G.FAVORITES_KEY, '{broken');
  assert.deepEqual(G.readFavorites(storage), []);
  assert.throws(() => G.writeFavorites({ setItem() { throw Error('quota'); } }, ['sweet-spring-a']), /quota/);
});

test('all 24 approved whole originals remain untouched beside derived display assets', () => {
  const G = api();
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/approved-complete-looks.json')));
  assert.equal(sources.length, 24);
  for (const source of sources) {
    const look = G.find(source.id);
    assert.ok(look, source.id);
    assert.equal(hash(path.join(preview, look.image)), source.sha256, source.id);
  }
  const winter = G.forSeason('sweet', 'winter');
  assert.equal(winter[0].name, '暖粉冬日');
  assert.equal(winter[1].name, '奶油冬信');
});

test('favorites preserve each lighting choice and safely migrate earlier outfit-only records', () => {
  const G = api();
  const values = new Map([[G.FAVORITES_KEY, JSON.stringify(['sweet-spring-a', { id: 'cool-winter-b', light: 'warm' }, { id: 'missing', light: 'cool' }])]]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(G.readFavorites(storage), [{ id: 'sweet-spring-a', light: 'natural' }, { id: 'cool-winter-b', light: 'warm' }]);
  const saved = G.writeFavorites(storage, [...G.readFavorites(storage), { id: 'cool-winter-b', light: 'cool' }, { id: 'cool-winter-b', light: 'warm' }]);
  assert.equal(saved.length, 3);
  assert.deepEqual(G.readFavorites(storage), saved);
  assert.deepEqual(G.selectionFor(saved[1].id, saved[1].light), { character: 'cool', season: 'winter', look: 'cool-winter-b', light: 'warm' });
  assert.equal(G.normalizeLight('unknown'), 'natural');
  assert.notEqual(G.favoriteKey(saved[1]), G.favoriteKey(saved[2]));
});
