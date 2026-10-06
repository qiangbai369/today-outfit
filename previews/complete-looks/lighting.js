(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CompleteLookLighting = factory();
})(globalThis, function () {
  'use strict';
  const WIDTH = 900, HEIGHT = 1200;
  const LIGHTS = [
    { id: 'natural', name: '自然光', colors: ['#f5f2eb', '#e9e6df', '#dedbd4'] },
    { id: 'warm', name: '暖光', colors: ['#fff4df', '#eee0c8', '#d6c4a9'] },
    { id: 'cool', name: '柔冷光', colors: ['#eff5fa', '#dfe8ed', '#c5d1da'] }
  ];
  const lightFor = id => LIGHTS.find(light => light.id === id) || LIGHTS[0];
  const make = (w, h) => { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; };

  function prepare(image, canvasFactory = make, reference) {
    const source = canvasFactory(image.width, image.height), ctx = source.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
    let left = source.width, top = source.height, right = -1, bottom = -1;
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      if (pixels[(y * source.width + x) * 4 + 3] > 128) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < 0) throw Error('图片没有可见人物');
    // One uniform scale for the entire original figure; no anatomy or outfit layers.
    const bounds = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
    const scale = reference?.transform.scale || Math.min(840 / bounds.width, 1160 / bounds.height);
    const transform = reference?.transform || { scale, x: (WIDTH - bounds.width * scale) / 2 - left * scale, y: 1180 - bounds.height * scale - top * scale };
    const placement = { x: transform.x + left * scale, y: transform.y + top * scale, width: bounds.width * scale, height: bounds.height * scale };
    const base = canvasFactory(WIDTH, HEIGHT);
    // Draw the full source rather than clipping the crop, retaining fine hair outside the solid bounds.
    base.getContext('2d').drawImage(source, transform.x, transform.y, source.width * scale, source.height * scale);
    return { base, bounds, placement, transform };
  }

  function ponytailFrame(pack, angle = 0, canvasFactory = make) {
    const base = canvasFactory(WIDTH, HEIGHT), ctx = base.getContext('2d');
    const t = pack.body.transform;
    const pivot = [t.x + pack.pivot[0] * t.scale, t.y + pack.pivot[1] * t.scale];
    // Restrict animation to rear hair; the transparent source can contain a faint full-frame matte.
    const p = pack.tail.placement, padding = 12;
    const x = Math.max(0, p.x - padding), y = Math.max(0, p.y - padding);
    const width = Math.min(WIDTH - x, p.width + padding * 2), height = Math.min(HEIGHT - y, p.height + padding * 2);
    ctx.save(); ctx.translate(...pivot); ctx.rotate(angle); ctx.translate(-pivot[0], -pivot[1]);
    ctx.drawImage(pack.tail.base, x, y, width, height, x, y, width, height); ctx.restore();
    // Rear hair moves behind the unchanged scalp, face, neck and complete outfit.
    ctx.drawImage(pack.body.base, 0, 0);
    return { ...pack.body, base };
  }

  function wavePack(prepared, geometry, canvasFactory = make) {
    const t = prepared.transform;
    const points = geometry.hand.map(([x, y]) => [t.x + x * t.scale, t.y + y * t.scale]);
    const pivot = [t.x + geometry.pivot[0] * t.scale, t.y + geometry.pivot[1] * t.scale];
    const trace = ctx => { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
    const hand = canvasFactory(WIDTH, HEIGHT), hc = hand.getContext('2d');
    hc.save(); trace(hc); hc.clip(); hc.drawImage(prepared.base, 0, 0); hc.restore();
    const body = canvasFactory(WIDTH, HEIGHT), bc = body.getContext('2d');
    bc.drawImage(prepared.base, 0, 0);
    bc.save(); trace(bc); bc.clip(); bc.clearRect(0, 0, WIDTH, HEIGHT); bc.restore();
    return { prepared, body, hand, pivot, points, wristBand: 8 * t.scale };
  }

  function waveFrame(pack, angle = 0, canvasFactory = make) {
    if (!angle) return pack.prepared;
    const base = canvasFactory(WIDTH, HEIGHT), ctx = base.getContext('2d');
    ctx.drawImage(pack.body, 0, 0);
    ctx.save(); ctx.translate(...pack.pivot); ctx.rotate(Math.max(-.045, Math.min(.045, angle)));
    ctx.translate(-pack.pivot[0], -pack.pivot[1]); ctx.drawImage(pack.hand, 0, 0); ctx.restore();
    // A short strip of the original wrist stays at the hinge, joining the stationary cuff/forearm.
    ctx.save(); ctx.beginPath(); pack.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.beginPath(); ctx.rect(0, pack.pivot[1] - pack.wristBand, WIDTH, HEIGHT); ctx.clip();
    ctx.drawImage(pack.prepared.base, 0, 0); ctx.restore();
    // The cuff stays fixed; only the skin above the wrist pivot rotates.
    return { ...pack.prepared, base };
  }

  function figure(prepared, lightId, canvasFactory = make) {
    const canvas = canvasFactory(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
    ctx.drawImage(prepared.base, 0, 0);
    const light = lightFor(lightId);
    if (light.id !== 'natural') {
      const image = ctx.getImageData(0, 0, WIDTH, HEIGHT), d = image.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        // A restrained 2D color-temperature treatment; alpha and geometry remain exact.
        if (light.id === 'warm') {
          d[i] = Math.min(255, d[i] * 1.025 + 4); d[i + 1] = Math.min(255, d[i + 1] + 2); d[i + 2] *= .955;
        } else {
          d[i] *= .965; d[i + 1] = Math.min(255, d[i + 1] * 1.015 + 2); d[i + 2] = Math.min(255, d[i + 2] * 1.04 + 5);
        }
      }
      ctx.putImageData(image, 0, 0);
    }
    return canvas;
  }

  function photo(prepared, lightId, canvasFactory = make) {
    const canvas = canvasFactory(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
    const light = lightFor(lightId);
    const gradient = ctx.createRadialGradient(450, 384, 0, 450, 384, 870);
    gradient.addColorStop(0, light.colors[0]); gradient.addColorStop(.65, light.colors[1]); gradient.addColorStop(1, light.colors[2]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save(); ctx.translate(450, 1180); ctx.scale(1, .125);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 155);
    shadow.addColorStop(0, '#65584925'); shadow.addColorStop(1, '#65584900');
    ctx.fillStyle = shadow; ctx.fillRect(-155, -155, 310, 310); ctx.restore();
    ctx.drawImage(figure(prepared, lightId, canvasFactory), 0, 0);
    return canvas;
  }
  return { WIDTH, HEIGHT, LIGHTS, lightFor, prepare, ponytailFrame, wavePack, waveFrame, figure, photo };
});
