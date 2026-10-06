const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../previews/complete-looks');
const renderer = () => require(path.join(root, 'lighting.js'));

test('three studio lights change background and subject without changing the silhouette', () => {
  const R = renderer();
  const subject = createCanvas(100, 150), c = subject.getContext('2d');
  c.fillStyle = '#785748'; c.fillRect(25, 10, 50, 130);
  const prepared = R.prepare(subject, createCanvas);
  const outputs = R.LIGHTS.map(light => R.figure(prepared, light.id, createCanvas));
  const samples = outputs.map(output => output.getContext('2d').getImageData(0, 0, output.width, output.height).data);
  for (let i = 3; i < samples[0].length; i += 4) {
    assert.equal(samples[0][i], samples[1][i], 'warm silhouette moved');
    assert.equal(samples[0][i], samples[2][i], 'cool silhouette moved');
  }
  const pixel = (canvas, x, y) => [...canvas.getContext('2d').getImageData(x, y, 1, 1).data];
  assert.notDeepEqual(pixel(outputs[0], 450, 600), pixel(outputs[1], 450, 600));
  assert.notDeepEqual(pixel(outputs[0], 450, 600), pixel(outputs[2], 450, 600));
  const photos = R.LIGHTS.map(light => R.photo(prepared, light.id, createCanvas));
  assert.notDeepEqual(pixel(photos[0], 10, 10), pixel(photos[1], 10, 10));
  assert.notDeepEqual(pixel(photos[0], 10, 10), pixel(photos[2], 10, 10));
  for (let i = 0; i < photos.length; i++) assert.deepEqual(pixel(photos[i], 450, 600), pixel(outputs[i], 450, 600));
  assert.ok(prepared.bounds.height / prepared.bounds.width === 130 / 50);
});

test('all 24 display figures have transparent surrounds and fit inside the common whole-photo frame', async () => {
  const R = renderer(), G = require(path.join(root, 'gallery.js'));
  for (const look of G.LOOKS) {
    const image = await loadImage(path.join(root, look.cartoon || look.display || look.image));
    const prepared = R.prepare(image, createCanvas);
    assert.ok(prepared.bounds.height > 1300, look.id + ' figure is incomplete');
    assert.ok(prepared.bounds.width < image.width * .9, look.id + ' still has a rectangular background');
    const figure = R.figure(prepared, 'natural', createCanvas), ctx = figure.getContext('2d');
    assert.equal(ctx.getImageData(0, 0, 1, 1).data[3], 0, look.id);
    assert.equal(ctx.getImageData(899, 1199, 1, 1).data[3], 0, look.id);
    assert.ok(prepared.placement.y >= 0 && prepared.placement.y + prepared.placement.height <= 1200, look.id + ' is clipped');
  }
});

test('Chen cutouts keep the approved facial pixels instead of substituting regenerated faces', async () => {
  const G = require(path.join(root, 'gallery.js'));
  for (const look of G.LOOKS.filter(look => look.character === 'cool')) {
    const sample = async file => {
      const image = await loadImage(path.join(root, file)), canvas = createCanvas(1024, 1536), ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(470, 260, 100, 110).data;
    };
    const original = await sample(look.image), cutout = await sample(look.display);
    assert.ok(Buffer.from(cutout).equals(Buffer.from(original)), look.id + ' face changed');
  }
});
