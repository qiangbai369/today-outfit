const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../previews/complete-looks/gallery.js');
const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const R = require('../previews/complete-looks/lighting.js');
const assets = path.resolve(__dirname, '../previews/complete-looks');

test('a saved expression survives reload and remains distinct from the same neutral outfit and light', () => {
  const map = new Map([[G.FAVORITES_KEY, JSON.stringify([
    'sweet-autumn-b',
    { id: 'sweet-autumn-b', light: 'warm', motion: 'heart' },
    { id: 'sweet-autumn-b', light: 'warm', motion: 'pout' },
    { id: 'cool-autumn-a', light: 'cool', motion: 'peace' }
  ])]]);
  const storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) };
  const saved = G.readFavorites(storage);
  assert.equal(saved.length, 4, 'Distinct poses were merged or discarded');
  assert.equal(saved[1].motion, 'heart');
  assert.equal(saved[2].motion, 'pout');
  G.writeFavorites(storage, saved);
  assert.deepEqual(G.readFavorites(storage), saved);
  assert.deepEqual(G.selectionFor(saved[3].id, saved[3].light, saved[3].motion),
    { character: 'cool', season: 'autumn', look: 'cool-autumn-a', light: 'cool', motion: 'peace' });
});

test('unsupported actions cannot be restored into the wrong character', () => {
  const map = new Map([[G.FAVORITES_KEY, JSON.stringify([
    { id: 'cool-autumn-a', light: 'natural', motion: 'heart' },
    { id: 'sweet-winter-a', light: 'natural', motion: 'peace' },
    { id: 'literary-autumn-a', light: 'warm', motion: 'wink' }
  ])]]);
  const saved = G.readFavorites({ getItem: key => map.get(key) });
  assert.deepEqual(saved[0], { id: 'cool-autumn-a', light: 'natural' });
  assert.deepEqual(saved[1], { id: 'sweet-winter-a', light: 'natural' });
  assert.equal(saved[2].motion, 'wink');
});

test('changing facial poses keeps the complete figure on the same scale and baseline', async () => {
  for (const look of G.LOOKS) {
    const neutral = R.prepare(await loadImage(path.join(assets, look.cartoon)), createCanvas);
    for (const asset of Object.values(look.poses).map(value => typeof value === 'string' ? value : value.image).filter(Boolean)) {
      const image = await loadImage(path.join(assets, asset));
      assert.equal(image.width, 1024); assert.equal(image.height, 1536);
      const pose = R.prepare(image, createCanvas, neutral);
      assert.deepEqual(pose.transform, neutral.transform, `${asset} recenters or rescales the person`);
      const baseLine = pose.placement.y + pose.placement.height;
      assert.ok(Math.abs(baseLine - 1180) < 8, `${asset} moves the shoes off the floor`);
      const pixels = pose.base.getContext('2d').getImageData(0, 0, R.WIDTH, R.HEIGHT).data;
      assert.equal(pixels[3], 0, `${asset} adds an opaque background`);
    }
  }
});

test('ponytail motion changes rear hair pixels while keeping the entire lower body still', async () => {
  const look = G.find('literary-autumn-a'), asset = look.poses.ponytail;
  const neutral = R.prepare(await loadImage(path.join(assets, look.cartoon)), createCanvas);
  const pack = {
    body: R.prepare(await loadImage(path.join(assets, asset.base)), createCanvas, neutral),
    tail: R.prepare(await loadImage(path.join(assets, asset.layer)), createCanvas, neutral),
    pivot: asset.pivot
  };
  const still = R.ponytailFrame(pack, 0, createCanvas).base.getContext('2d');
  const moved = R.ponytailFrame(pack, .045, createCanvas).base.getContext('2d');
  const lower = context => Buffer.from(context.getImageData(0, 500, R.WIDTH, 700).data);
  assert.deepEqual(lower(moved), lower(still), 'Clothes, hands or shoes moved with the ponytail');
  const upper = context => Buffer.from(context.getImageData(0, 0, R.WIDTH, 500).data);
  assert.notDeepEqual(upper(moved), upper(still), 'No actual hair movement');
});
