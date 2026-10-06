const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const G = require('../previews/complete-looks/gallery.js');
const R = require('../previews/complete-looks/lighting.js');
const root = path.resolve(__dirname, '../previews/complete-looks');

test('waving moves hand pixels while keeping the head, clothes and lower body exactly fixed', async () => {
  for (const look of G.LOOKS.filter(look => look.poses?.wave)) {
    const asset = look.poses.wave;
    const neutral = R.prepare(await loadImage(path.join(root, look.cartoon)), createCanvas);
    const prepared = R.prepare(await loadImage(path.join(root, asset.image)), createCanvas, neutral);
    const pack = R.wavePack(prepared, asset, createCanvas);
    const t = prepared.transform, xs = asset.hand.map(p => t.x + p[0] * t.scale), ys = asset.hand.map(p => t.y + p[1] * t.scale);
    const region = { left: Math.floor(Math.min(...xs) - 15), right: Math.ceil(Math.max(...xs) + 15), top: Math.floor(Math.min(...ys) - 15), bottom: Math.ceil(Math.max(...ys) + 15) };
    const still = prepared.base.getContext('2d').getImageData(0, 0, R.WIDTH, R.HEIGHT).data;
    for (const angle of [-.04, .04]) {
      const moved = R.waveFrame(pack, angle, createCanvas).base.getContext('2d').getImageData(0, 0, R.WIDTH, R.HEIGHT).data;
      let changed = 0;
      for (let y = 0; y < R.HEIGHT; y++) for (let x = 0; x < R.WIDTH; x++) {
        const offset = (y * R.WIDTH + x) * 4;
        for (let c = 0; c < 4; c++) if (moved[offset + c] !== still[offset + c]) {
          assert.ok(x >= region.left && x <= region.right && y >= region.top && y <= region.bottom, `${look.id}: pixels outside the hand moved at ${x},${y}`);
          changed++;
        }
      }
      assert.ok(changed > 100, `${look.id}: no visible wrist motion`);
    }
    assert.equal(R.waveFrame(pack, 0, createCanvas).base, prepared.base, 'rest pose must be the exact full figure');
  }
});

test('new wave favorites and legacy ponytail favorites both survive reload independently', () => {
  const records = [
    { id: 'literary-autumn-a', light: 'warm', motion: 'wave', angle: .02 },
    { id: 'literary-autumn-a', light: 'cool', motion: 'ponytail', angle: -.03 }
  ];
  const map = new Map([[G.FAVORITES_KEY, JSON.stringify(records)], ['today-outfit-plans-v1', 'real-user-data']]);
  const storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
  assert.deepEqual(G.readFavorites(storage), records);
  assert.deepEqual(G.writeFavorites(storage, records), records);
  assert.equal(map.get('today-outfit-plans-v1'), 'real-user-data');
  assert.ok(!G.actionsFor('literary-autumn-a').some(a => a.id === 'ponytail'));
});
