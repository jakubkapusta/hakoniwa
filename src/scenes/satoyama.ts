// Scene 8: a farmhouse in the hills (satoyama) on the night of the autumn moon (tsukimi). A thatched minka with a
// veranda, a water channel turning a wheel, golden rice paddies, a scarecrow, a persimmon tree. Bigger kit (32 pieces).
// Finale: the full moon rises over the mountains, the paper doors glow, smoke from the thatch, crickets and a far bell.
import * as THREE from 'three';
import { blob, dab, foliage, JPG, meadow, mottle, newCanvas, poly, polarPts, rrect, soft, text, toTex, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { ease, lerp, mix, pick, rand, rnd, smooth } from '../core/util';
import { boardMat, cutout, cutoutAsset, foldBox, gableRoof, glowing, group, memo, paperMat, plainM, toon } from '../kit/kit';
import { face, figure, seatedOutline } from '../kit/people';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'satoyama:' + s;
const HX = 0.6, HZ = -1.05, HW = 2.4, HD = 1.3, HH = 0.95, FLOOR = 0.2; // the house
const RA = 0.8, RL = 1.25, RY = FLOOR + HH + (HD / 2) * Math.tan(RA); // thatch angle, slope length, ridge height
const CZ = 0.3, CW = 0.36; // the water channel along x
const PATH = [-0.05, 0.45];
const PADDY_L = { x0: -2.95, x1: -0.35, z0: 0.7, z1: 2.0 }, PADDY_R = { x0: 0.75, x1: 2.95, z0: 0.75, z1: 1.85 };
const WHEEL_X = 2.55, MOON_X = -1.55;

// ── backdrop: blue mountains, a nearer hill with terraced fields and autumn trees
const ridgeY = (x: number) => 1.55 + 0.3 * Math.sin(x * 0.8 + 1) + 0.18 * Math.sin(x * 1.9) + 0.45 * Math.max(0, 1 - Math.abs(x + 1.4) / 1.3);
const hillY = (x: number) => 0.72 + 0.18 * Math.sin(x * 1.3 + 0.5) + 0.06 * Math.sin(x * 4);
function mountOutline(p: Pen) { p.moveTo(-3.1, 0); for (let i = 0; i <= 90; i++) { const x = -3.1 + (6.2 * i) / 90; p.lineTo(x, ridgeY(x)); } p.lineTo(3.1, 0); p.closePath(); }
const mountA = () => cutoutAsset(K('mount'), mountOutline, (c) => {
  const g = c.createLinearGradient(0, 2.5, 0, 0.6); g.addColorStop(0, '#7f93b8'); g.addColorStop(1, '#a3b4c8'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.8);
  c.fillStyle = 'rgba(70,85,130,.3)'; [[-1.4, 2.3], [0.6, 1.8], [2.3, 1.7]].forEach(([px, py]) => { c.beginPath(); poly(c, [[px, py], [px + 1.2, 0.9], [px + 0.15, 0.9]]); c.fill(); });
  // the near hill with terraces
  c.fillStyle = '#8aa860'; c.beginPath(); c.moveTo(-3.2, 0); for (let x = -3.2; x <= 3.2; x += 0.05) c.lineTo(x, hillY(x)); c.lineTo(3.2, 0); c.closePath(); c.fill();
  for (let k = 0; k < 5; k++) {
    c.strokeStyle = k % 2 ? '#d8b04a' : '#c8a040'; c.lineWidth = 0.06;
    c.beginPath(); for (let x = 0.2; x <= 3.2; x += 0.05) c.lineTo(x, hillY(x) - 0.12 - k * 0.1 + 0.02 * Math.sin(x * 3)); c.stroke();
    c.strokeStyle = '#6a8a48'; c.lineWidth = 0.012; c.beginPath(); for (let x = 0.2; x <= 3.2; x += 0.05) c.lineTo(x, hillY(x) - 0.155 - k * 0.1 + 0.02 * Math.sin(x * 3)); c.stroke();
  }
  foliage(c, -3.15, 0.25, 3.2, 0.55, { shade: '#4f6a3a', mid: '#6a8a48', light: '#8aaa5a', hi: '#c4d48a' }, { n: 34, r: [0.08, 0.14], inside: (x, y) => y < hillY(x) - 0.03 });
  for (let i = 0; i < 9; i++) { const x = rand(-3, 0), y = hillY(x) - rand(0.08, 0.25); blob(c, x, y, rand(0.06, 0.1), pick(['#d8603a', '#e8a03a', '#c84a30']), 1, 0.2); blob(c, x - 0.02, y + 0.02, 0.04, '#f2c060', 0.9, 0.2); }
  c.fillStyle = '#6a8a48'; c.fillRect(-3.2, 0, 6.4, 0.22);
}, { ppu: 170, ink: 0 });
// the nearer wood behind the farm: cedars and a few maples
const woodY = (x: number) => 0.55 + 0.12 * Math.sin(x * 2.1) + 0.08 * Math.sin(x * 5.3);
function forestOutline(p: Pen) {
  p.moveTo(-3.1, 0);
  for (let x = -3.1; x <= 3.1; x += 0.1) { const y = woodY(x); p.lineTo(x, y); p.lineTo(x + 0.05, y + 0.18 + 0.06 * Math.sin(x * 7)); }
  p.lineTo(3.1, woodY(3.1)); p.lineTo(3.1, 0); p.closePath();
}
const forestA = () => cutoutAsset(K('forest'), forestOutline, (c) => {
  c.fillStyle = '#3f5a3a'; c.fillRect(-3.2, 0, 6.4, 1);
  for (let x = -3.1; x <= 3.1; x += 0.1) { const y = woodY(x); c.fillStyle = mix('#2f4a32', '#46663f', rnd()); c.beginPath(); poly(c, [[x - 0.03, y - 0.1], [x + 0.05, y + 0.18 + 0.06 * Math.sin(x * 7)], [x + 0.13, y - 0.1]]); c.fill(); c.fillStyle = '#5a7a4a'; c.beginPath(); poly(c, [[x + 0.0, y - 0.05], [x + 0.05, y + 0.15], [x + 0.05, y - 0.05]]); c.fill(); }
  for (let i = 0; i < 7; i++) { const x = rand(-2.8, 2.8); blob(c, x, woodY(x) - 0.12, rand(0.08, 0.13), pick(['#c8503a', '#e8903a', '#d86a3a']), 1, 0.2); }
  c.fillStyle = '#3a4f34'; c.fillRect(-3.2, 0, 6.4, 0.3);
}, { ppu: 200, ink: 0 });
// the full moon on a cardboard stick behind the mountains; it rises as the evening comes
const MOON_R = 0.36, MOON_Y = 2.2;
const moonA = () => cutoutAsset(K('moon'), (p) => {
  p.moveTo(-0.025, 0); p.lineTo(0.025, 0); p.lineTo(0.025, MOON_Y - MOON_R + 0.01);
  polarPts(0, MOON_Y, () => MOON_R, 1, -Math.PI / 2 + 0.07, Math.PI * 1.5 - 0.07, 60).forEach(([x, y]) => p.lineTo(x, y));
  p.lineTo(-0.025, MOON_Y - MOON_R + 0.01); p.closePath();
}, (c) => {
  c.fillStyle = '#b8a888'; c.fillRect(-0.05, 0, 0.1, MOON_Y);
  c.fillStyle = '#fff2c8'; c.beginPath(); c.arc(0, MOON_Y, MOON_R + 0.01, 0, 7); c.fill();
  // the rabbit in the moon, faint
  c.fillStyle = 'rgba(214,190,140,.55)';
  c.beginPath(); c.ellipse(-0.06, MOON_Y - 0.04, 0.11, 0.08, 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(-0.14, MOON_Y + 0.1, 0.03, 0.11, -0.3, 0, 7); c.fill();
  c.beginPath(); c.ellipse(0.12, MOON_Y - 0.12, 0.08, 0.06, 0, 0, 7); c.fill(); c.fillRect(0.05, MOON_Y - 0.02, 0.03, 0.18);
  for (let i = 0; i < 5; i++) soft(c, rand(-0.25, 0.25), MOON_Y + rand(-0.25, 0.25), rand(0.03, 0.06), '#e8d8a8', 0.6);
}, { ppu: 400, ink: 0, emissive: (c) => { c.fillStyle = '#fff0c0'; c.beginPath(); c.arc(0, MOON_Y, MOON_R, 0, 7); c.fill(); } });
function buildMoon() { const m = cutout(moonA()), g = group(m); g.userData.tick = (_t, ev) => { m.position.y = lerp(-0.3, 0, ease.inOut(ev)); }; return g; }

// ── water: the channel, its stones, a plank bridge, the water wheel and its shed
const chanTex = () => memo(K('chanTex'), () => {
  const cv = newCanvas(512, 64), c = cv.getContext('2d')!;
  c.fillStyle = '#4f8a98'; c.fillRect(0, 0, 512, 64);
  c.lineCap = 'round'; for (let i = 0; i < 40; i++) { const x = rand(0, 512), y = rand(4, 60), w = rand(14, 40); c.strokeStyle = rnd() < 0.7 ? 'rgba(210,240,245,.55)' : 'rgba(30,80,90,.35)'; c.lineWidth = rand(2, 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + rand(-2, 2)); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
});
const stoneMats = () => memo(K('stones'), () => ['#8f8b82', '#7d7a73', '#a39e92'].map((col) => toon({ color: col })));
function stone(r: number, sy = 0.5) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), pick(stoneMats())); m.scale.set(rand(1, 1.3), sy, rand(0.8, 1)); m.rotation.y = rand(0, 6); m.receiveShadow = true; return m; }
function buildChannel() {
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6.38, CW), toon({ map: chanTex() })); water.rotation.x = -Math.PI / 2; water.position.y = 0.012; water.receiveShadow = true;
  const g = group(water);
  for (let x = -3.1; x < 3.15; x += rand(0.14, 0.2)) [-1, 1].forEach((s) => { if (x > PATH[0] - 0.05 && x < PATH[1] + 0.05) return; const st = stone(rand(0.05, 0.08)); st.position.set(x, 0.015, s * (CW / 2 + 0.02)); g.add(st); });
  g.userData.tick = (t) => { chanTex().offset.x = t * 0.12; };
  return g;
}
function buildBridge() {
  const g = group(), pl = plainM(K('plank'), '#9a7a52'), log = plainM(K('log'), '#6a5038');
  [-0.13, 0, 0.13].forEach((dx, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.72), pl); b.position.set(dx, 0.05 + (i % 2) * 0.005, 0); b.castShadow = b.receiveShadow = true; g.add(b); });
  [-0.24, 0.24].forEach((dx) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 8), log); l.rotation.x = Math.PI / 2; l.position.set(dx, 0.04, 0); g.add(l); });
  return g;
}
function buildWheel() {
  const wd = plainM(K('wheelWood'), '#7a5a3a'), dark = plainM(K('wheelDark'), '#5a4030');
  const pivot = new THREE.Group(); pivot.position.y = 0.42;
  [-0.08, 0.08].forEach((z) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.022, 6, 36), wd); rim.position.z = z; pivot.add(rim);
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.03), wd); s.rotation.z = (i / 4) * Math.PI; s.position.z = z; pivot.add(s); }
  });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, p = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.2), dark); p.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0); p.rotation.z = a; pivot.add(p); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), dark); hub.rotation.x = Math.PI / 2; pivot.add(hub);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8), dark); axle.rotation.x = Math.PI / 2; axle.position.set(0, 0.42, -0.2);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), wd); post.position.set(0, 0.21, -0.17);
  const g = group(pivot, axle, post);
  g.traverse((m) => { m.castShadow = true; });
  g.userData.tick = (t) => { pivot.rotation.z = t * 0.55; };
  return g;
}
const shedFront = () => boardMat(K('shedFront'), 0.8, 0.62, (c, W, H) => { wood(c, W, H, '#8a6a48', { dir: 'v', plank: 0.1 }); c.fillStyle = '#3a2a1e'; c.beginPath(); c.arc(W / 2 + 0.1, H * 0.35, 0.05, 0, 7); c.fill(); c.fillStyle = '#5a4030'; c.fillRect(0.08, 0.15, 0.22, 0.47); }, { ppu: 300 });
const shedSide = () => boardMat(K('shedSide'), 0.6, 0.62, (c, W, H) => wood(c, W, H, '#8a6a48', { dir: 'v', plank: 0.1 }), { ppu: 300 });
const shedRoofM = () => boardMat(K('shedRoof'), 0.95, 0.42, (c, W, H) => { c.fillStyle = '#5a5a60'; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 0.08) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, 0, 0.03, H); } c.fillStyle = 'rgba(160,110,60,.35)'; for (let i = 0; i < 6; i++) blob(c, rand(0, W), rand(0, H), 0.05, '#a86a3a', 0.4); }, { ppu: 300 });
function buildShed() {
  const s = shedSide(), box = foldBox({ w: 0.8, d: 0.6, h: 0.62, top: plainM(K('shedTop'), '#5a4030'), front: shedFront(), back: s, left: s, right: s });
  const roof = gableRoof({ w: 0.95, l: 0.42, angle: 0.55, top: shedRoofM(), under: plainM(K('shedU'), '#4a3a2a') }); roof.position.y = 0.62 + 0.3 * Math.tan(0.55);
  const g = group(box, roof);
  g.userData.setFold = (k) => { box.userData.setFold!(k); roof.userData.setFold!(Math.max(0, k * 1.4 - 0.4)); };
  return g;
}

// ── the farmhouse: a raised floor, walls folded up as a box, thick thatch, a ridge cap, a veranda
function buildFloor() {
  const side = plainM(K('floorSide'), '#6a5038'), top = plainM(K('floorTop'), '#8a6a48');
  const m = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.1, FLOOR, HD + 0.1), [side, side, top, side, side, side]); m.position.y = FLOOR / 2;
  const base = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.2, 0.06, HD + 0.2), stoneMats()[0]); base.position.y = 0.03;
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.16), stoneMats()[2]); step.position.set(0.3, 0.04, HD / 2 + 0.42);
  return group(base, m, step);
}
const plaster = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) blob(c, rand(0, W), rand(0, H * 0.6), rand(0.05, 0.12), '#e2d6bc', 0.5, 0.4);
  c.save(); c.translate(0, H * 0.6); wood(c, W, H * 0.4, '#5a4030', { dir: 'v', plank: 0.1 }); c.restore();
  c.fillStyle = '#3a2a1e'; c.fillRect(0, 0, W, 0.06); c.fillRect(0, H * 0.6 - 0.025, W, 0.03); c.fillRect(0, 0, 0.05, H); c.fillRect(W - 0.05, 0, 0.05, H);
};
const BAYS = [0, 0.6, 1.2, 1.8, 2.4];
const frontMat = () => boardMat(K('front'), HW, HH, (c, W, H) => {
  c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#3a2a1e'; c.fillRect(0, 0, W, 0.1);
  // the doma bay on the left: a dark open doorway with a hanging lamp, then three bays of paper doors
  c.fillStyle = '#2a1e16'; c.fillRect(0.06, 0.16, 0.5, H - 0.16); c.fillStyle = '#4a3426'; c.fillRect(0.38, 0.16, 0.18, H - 0.16);
  dab(c, 0.22, 0.35, 0.04, '#e8b860'); c.fillStyle = '#3a2a1e'; c.fillRect(0.215, 0.16, 0.01, 0.15);
  for (let b = 1; b < 4; b++) {
    const x0 = BAYS[b] + 0.04, x1 = BAYS[b + 1] - 0.04;
    c.fillStyle = '#f6efdc'; c.fillRect(x0, 0.16, x1 - x0, H - 0.3);
    c.strokeStyle = '#6a5038'; c.lineWidth = 0.014;
    for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 4) { c.beginPath(); c.moveTo(x, 0.16); c.lineTo(x, H - 0.14); c.stroke(); }
    for (let y = 0.16; y <= H - 0.14; y += 0.1) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
    c.fillStyle = '#6a5038'; c.fillRect(x0, H - 0.14, x1 - x0, 0.14); c.fillRect((x0 + x1) / 2 - 0.01, 0.16, 0.02, H - 0.16);
  }
  BAYS.forEach((x) => { c.fillStyle = '#3a2a1e'; c.fillRect(Math.min(W - 0.06, Math.max(0, x - 0.03)), 0, 0.06, H); });
  c.fillStyle = '#5a4030'; c.fillRect(0, H - 0.04, W, 0.04);
}, { ppu: 300, emissive: (c, _W, H) => { for (let b = 1; b < 4; b++) { c.fillStyle = '#ffc878'; c.fillRect(BAYS[b] + 0.04, 0.16, 0.52, H - 0.3); } dab(c, 0.22, 0.35, 0.06, '#ffc070'); } });
const sideMat = () => boardMat(K('side'), HD, HH, (c, W, H) => { plaster(c, W, H); c.fillStyle = '#3a2a1e'; c.fillRect(0.45, 0.2, 0.4, 0.25); c.fillStyle = '#c9b48a'; for (let x = 0.48; x < 0.84; x += 0.06) c.fillRect(x, 0.22, 0.03, 0.21); }, { ppu: 300, emissive: (c) => { c.fillStyle = '#ffb860'; c.fillRect(0.47, 0.22, 0.36, 0.21); } });
const backMat = () => boardMat(K('back'), HW, HH, plaster, { ppu: 260 });
const buildWalls = () => foldBox({ w: HW, d: HD, h: HH, top: plainM(K('wallTop'), '#4a3a2a'), front: frontMat(), back: backMat(), left: sideMat(), right: sideMat() });
const thatchMat = () => boardMat(K('thatch'), 2.95, RL, (c, W, H) => {
  c.fillStyle = '#9a8458'; c.fillRect(0, 0, W, H);
  c.lineCap = 'round';
  for (let i = 0; i < 900; i++) { const x = rand(0, W), y = rand(0, H); c.strokeStyle = pick(['#b09a68', '#8a7448', '#c4ae7a', '#7a6a44']); c.lineWidth = rand(0.006, 0.012); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-0.01, 0.01), y + rand(0.05, 0.1)); c.stroke(); }
  for (let y = 0.25; y < H; y += 0.32) { c.fillStyle = 'rgba(60,45,25,.25)'; c.fillRect(0, y, W, 0.02); }
  for (let i = 0; i < 16; i++) blob(c, rand(0, W), rand(0, H * 0.7), rand(0.05, 0.12), '#6f7a44', 0.55, 0.35); // moss
  c.fillStyle = '#c8b484'; c.fillRect(0, H - 0.06, W, 0.06); // trimmed eave
}, { ppu: 280 });
const buildRoof = () => gableRoof({ w: 2.95, l: RL, angle: RA, t: 0.14, top: thatchMat(), under: plainM(K('thatchU'), '#7a6a48') });
function buildRidge() {
  const bark = plainM(K('ridgeM'), '#3f3228'), pole = plainM(K('chigi'), '#5a4632');
  const cap = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.14, 0.36), bark); cap.position.y = 0.06;
  const g = group(cap);
  for (let i = 0; i < 6; i++) {
    const x = -1.25 + i * 0.5;
    [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 6), pole); p.position.set(x, 0.17, 0); p.rotation.x = s * 0.6; g.add(p); });
  }
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
function buildEngawa() {
  const top = boardMat(K('engTop'), HW + 0.1, 0.35, (c, W, H) => wood(c, W, H, '#a07a50', { dir: 'h', plank: 0.07 }), { ppu: 300 }), side = plainM(K('engSide'), '#6a5038');
  const deck = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.1, 0.06, 0.35), [side, side, top, side, side, side]); deck.position.y = FLOOR - 0.03;
  const g = group(deck);
  BAYS.forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, FLOOR - 0.06, 0.05), side); leg.position.set(x - HW / 2, (FLOOR - 0.06) / 2, 0.12); g.add(leg);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), side); post.position.set(Math.max(-HW / 2 + 0.03, Math.min(HW / 2 - 0.03, x - HW / 2)), FLOOR + 0.31, 0.03); g.add(post);
  });
  g.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return g;
}

// ── the rice paddies: a printed field with rows of standing ears
function paddyTop(w: number, d: number) {
  return boardMat(K('paddy' + w + 'x' + d), w, d, (c, W, H) => {
    c.fillStyle = '#b8903a'; c.fillRect(0, 0, W, H);
    for (let y = 0.06; y < H; y += 0.08) for (let x = 0.04 + (y * 10 % 2) * 0.03; x < W; x += 0.07) { dab(c, x, y, 0.03, '#a07a30'); dab(c, x - 0.006, y - 0.008, 0.022, pick(['#e0b84a', '#d8a83a', '#ecc85a'])); }
    c.strokeStyle = '#7a6a3a'; c.lineWidth = 0.03; c.strokeRect(0.015, 0.015, W - 0.03, H - 0.03);
  }, { ppu: 240 });
}
const riceRow = (w: number) => cutoutAsset(K('rice' + w), (p) => {
  p.moveTo(-w / 2, 0);
  for (let x = -w / 2; x < w / 2 - 0.04; x += 0.06) { p.lineTo(x + 0.01, 0.1); p.quadraticCurveTo(x + 0.04, 0.16, x + 0.06, 0.12); p.lineTo(x + 0.05, 0.09); }
  p.lineTo(w / 2, 0.08); p.lineTo(w / 2, 0); p.closePath();
}, (c) => {
  c.fillStyle = '#c89a3a'; c.fillRect(-w / 2, 0, w, 0.2);
  for (let x = -w / 2; x < w / 2; x += 0.06) { c.fillStyle = '#e8c45a'; c.beginPath(); c.ellipse(x + 0.045, 0.125, 0.022, 0.012, 0.6, 0, 7); c.fill(); c.strokeStyle = '#9a7a2a'; c.lineWidth = 0.006; c.beginPath(); c.moveTo(x + 0.012, 0.0); c.lineTo(x + 0.015, 0.1); c.stroke(); }
  c.fillStyle = 'rgba(110,80,30,.35)'; c.fillRect(-w / 2, 0, w, 0.04);
}, { ppu: 360, t: 0.015, ink: 0 });
function buildPaddy(f: { x0: number; x1: number; z0: number; z1: number }) {
  const w = +(f.x1 - f.x0).toFixed(2), d = +(f.z1 - f.z0).toFixed(2), side = plainM(K('paddySide'), '#7a5a38');
  const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), [side, side, paddyTop(w, d), side, side, side]); bed.position.y = 0.025; bed.receiveShadow = true;
  const g = group(bed), rows: THREE.Mesh[] = [];
  for (let z = -d / 2 + 0.15; z < d / 2 - 0.05; z += 0.24) { const r = cutout(riceRow(+(w - 0.12).toFixed(2))); r.position.set(0, 0.05, z); g.add(r); rows.push(r); }
  g.userData.tick = (t) => rows.forEach((r, i) => { r.rotation.x = Math.sin(t * 1.1 + i * 0.6) * 0.08; });
  return g;
}
// drying rack (hasa-kake) with sheaves hung over the bars
const sheavesA = () => cutoutAsset(K('sheaves'), (p) => {
  p.moveTo(-0.62, 0.02); p.lineTo(0.62, 0.02);
  for (let x = 0.62; x > -0.62; x -= 0.08) { p.lineTo(x - 0.02, -0.24 - 0.03 * Math.sin(x * 9)); p.lineTo(x - 0.06, -0.2); }
  p.closePath();
}, (c) => {
  c.fillStyle = '#c8a048'; c.fillRect(-0.7, -0.3, 1.4, 0.35);
  for (let x = -0.6; x < 0.62; x += 0.08) { c.fillStyle = mix('#d8b85a', '#a88030', rnd() * 0.6); c.fillRect(x, -0.27, 0.07, 0.29); c.fillStyle = '#7a5a2a'; c.fillRect(x + 0.005, -0.05, 0.06, 0.015); }
}, { ppu: 360, t: 0.04 });
function buildRack() {
  const pole = plainM(K('rackPole'), '#8a7050'), g = group();
  [-0.65, 0, 0.65].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.85, 6), pole); p.position.set(x, 0.425, 0); g.add(p); });
  [0.46, 0.78].forEach((y) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.4, 6), pole); b.rotation.z = Math.PI / 2; b.position.y = y; g.add(b); const s = cutout(sheavesA()); s.position.set(0, y, 0.02); g.add(s); });
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
// scarecrow with a henohenomoheji face
const scarecrowA = () => cutoutAsset(K('scarecrow'), (p) => poly(p, [[-0.02, 0], [0.02, 0], [0.02, 0.4], [0.12, 0.42], [0.1, 0.58], [0.38, 0.62], [0.38, 0.68], [0.1, 0.7], [0.08, 0.76], [0.25, 0.8], [0.0, 0.96], [-0.25, 0.8], [-0.08, 0.76], [-0.1, 0.7], [-0.38, 0.68], [-0.38, 0.62], [-0.1, 0.58], [-0.12, 0.42], [-0.02, 0.4]]), (c) => {
  c.fillStyle = '#8a7050'; c.fillRect(-0.03, 0, 0.06, 0.5); c.fillRect(-0.4, 0.62, 0.8, 0.06);
  c.fillStyle = '#3f5a8a'; c.beginPath(); poly(c, [[0.12, 0.42], [0.1, 0.6], [0.38, 0.62], [0.38, 0.68], [-0.38, 0.68], [-0.38, 0.62], [-0.1, 0.6], [-0.12, 0.42]]); c.fill();
  c.fillStyle = '#c4453a'; c.fillRect(-0.06, 0.48, 0.12, 0.06); c.fillStyle = '#e8c45a'; c.fillRect(-0.12, 0.44, 0.08, 0.06);
  c.fillStyle = '#e8c45a'; c.fillRect(0.36, 0.6, 0.04, 0.1); c.fillRect(-0.4, 0.6, 0.04, 0.1);
  c.fillStyle = '#f2ead8'; c.beginPath(); c.ellipse(0, 0.72, 0.09, 0.07, 0, 0, 7); c.fill();
  text(c, 'へ', -0.035, 0.75, 0.035, '#2a2420', { font: JPG }); text(c, 'へ', 0.035, 0.75, 0.035, '#2a2420', { font: JPG });
  text(c, 'の', -0.035, 0.725, 0.035, '#2a2420', { font: JPG }); text(c, 'の', 0.035, 0.725, 0.035, '#2a2420', { font: JPG });
  text(c, 'も', 0, 0.7, 0.03, '#2a2420', { font: JPG }); text(c, 'へ', 0, 0.672, 0.03, '#2a2420', { font: JPG });
  c.fillStyle = '#c8a860'; c.beginPath(); poly(c, [[-0.25, 0.8], [0, 0.96], [0.25, 0.8], [0.08, 0.76], [-0.08, 0.76]]); c.fill();
  c.strokeStyle = '#a08040'; c.lineWidth = 0.008; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(0, 0.95); c.lineTo(i * 0.055, 0.8); c.stroke(); }
}, { ppu: 700 });
function buildScarecrow() { const m = cutout(scarecrowA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 0.8) * 0.025; }; return g; }

// ── the yard: well, persimmon tree, woodpile, cedars
function buildWell() {
  const wd = plainM(K('wellWood'), '#7a5a3a');
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.32, 16, 1, true), plainM(K('wellStone'), '#8f8b82', { side: THREE.DoubleSide })); ring.position.y = 0.16;
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16), plainM(K('wellWater'), '#2a3a40')); water.rotation.x = -Math.PI / 2; water.position.y = 0.2;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.025, 6, 20), wd); lip.rotation.x = Math.PI / 2; lip.position.y = 0.32;
  const g = group(ring, water, lip);
  [-0.26, 0.26].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), wd); p.position.set(x, 0.425, 0); g.add(p); });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), wd); bar.position.y = 0.78;
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), plainM(K('pulley'), '#4a3a2a')); pulley.rotation.x = Math.PI / 2; pulley.position.y = 0.72;
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 4), plainM(K('rope'), '#c8b48a')); rope.position.set(0.05, 0.54, 0);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10), wd); bucket.position.set(0.05, 0.38, 0);
  const roof = gableRoof({ w: 0.7, l: 0.3, angle: 0.5, top: plainM(K('wellRoof'), '#5a5048'), under: wd }); roof.position.y = 0.92;
  g.add(bar, pulley, rope, bucket, roof);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
const kakiR = (a: number) => 0.62 + 0.05 * Math.sin(a * 6) + 0.04 * Math.sin(a * 11);
const kakiA = () => cutoutAsset(K('kaki'), (p) => {
  const pts: number[][] = [[0.07, 0], [0.06, 0.7]];
  for (let i = 0; i <= 80; i++) { const a = -Math.PI / 2 + 0.12 + ((Math.PI * 2 - 0.24) * i) / 80; pts.push([Math.cos(a) * kakiR(a), 1.3 + Math.sin(a) * kakiR(a) * 0.82]); }
  pts.push([-0.06, 0.7], [-0.07, 0]); poly(p, pts);
}, (c) => {
  c.fillStyle = '#7a8a3a'; c.fillRect(-0.8, 0.7, 1.6, 1.3);
  c.fillStyle = '#4a3428'; c.fillRect(-0.08, 0, 0.16, 1.05);
  c.strokeStyle = '#4a3428'; c.lineWidth = 0.03; c.lineCap = 'round'; [[-0.35, 1.2], [0.3, 1.25], [0.0, 1.6]].forEach(([x, y]) => { c.beginPath(); c.moveTo(0, 0.8); c.quadraticCurveTo(x * 0.4, y * 0.85, x, y); c.stroke(); });
  foliage(c, -0.65, 0.85, 1.3, 1.0, { shade: '#6a7a2f', mid: '#94a03a', light: '#c4b84a', hi: '#f0d870' }, { n: 34, r: [0.1, 0.16], inside: (x, y) => Math.hypot(x / 0.62, (y - 1.3) / 0.51) < 0.95 });
  for (let i = 0; i < 22; i++) { const a = rand(0, 6.28), r = Math.sqrt(rnd()) * 0.5, x = Math.cos(a) * r, y = 1.3 + Math.sin(a) * r * 0.8; dab(c, x, y, 0.045, '#e8742a'); dab(c, x - 0.012, y + 0.012, 0.015, '#ffb070'); c.fillStyle = '#4a5a2a'; c.fillRect(x - 0.012, y + 0.035, 0.024, 0.012); }
}, { ppu: 320, t: 0.03 });
const buildKaki = () => { const a = cutout(kakiA()), b = cutout(kakiA()); b.rotation.y = Math.PI / 2; b.scale.x = 0.85; return group(a, b); };
const woodA = () => cutoutAsset(K('wood'), (p) => poly(p, [[-0.42, 0], [0.42, 0], [0.42, 0.42], [0.5, 0.42], [0.44, 0.52], [-0.44, 0.52], [-0.5, 0.42], [-0.42, 0.42]]), (c) => {
  c.fillStyle = '#4a3426'; c.fillRect(-0.6, 0, 1.2, 0.6);
  for (let y = 0.06; y < 0.4; y += 0.09) for (let x = -0.37 + ((y * 10) % 2) * 0.04; x < 0.4; x += 0.09) { dab(c, x, y, 0.043, '#b0784a'); dab(c, x, y, 0.028, '#d9a76c'); c.strokeStyle = '#9a6640'; c.lineWidth = 0.004; c.beginPath(); c.arc(x, y, 0.016, 0, 7); c.stroke(); }
  c.fillStyle = '#5a5048'; c.beginPath(); poly(c, [[-0.5, 0.42], [0.5, 0.42], [0.44, 0.52], [-0.44, 0.52]]); c.fill();
}, { ppu: 400 });
function buildCedars() {
  const g = group(), dark = plainM(K('cedarD'), '#2f4a34'), mid = plainM(K('cedarM'), '#3f6040'), trunk = plainM(K('cedarT'), '#6a4a34');
  [[0, 0, 2.3], [0.42, 0.18, 1.9], [-0.35, 0.22, 1.7]].forEach(([x, z, h]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, h * 0.4, 8), trunk); t.position.set(x, h * 0.2, z); g.add(t);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.32 - k * 0.07, h * 0.42, 10), k % 2 ? mid : dark); c.position.set(x, h * (0.38 + k * 0.2), z); g.add(c); }
  });
  g.traverse((m) => { m.castShadow = true; });
  return g;
}

// ── autumn: pampas grass, spider lilies, the moon-viewing offering, a paper lamp
const SUSUKI_TIPS = 9;
const susukiA = () => cutoutAsset(K('susuki'), (p) => {
  p.moveTo(-0.3, 0);
  for (let i = 0; i < SUSUKI_TIPS; i++) {
    const x = -0.26 + (i * 0.52) / (SUSUKI_TIPS - 1), lean = (i - (SUSUKI_TIPS - 1) / 2) * 0.03, h = 0.55 + 0.18 * Math.sin(i * 2.1) ** 2;
    p.lineTo(x - 0.01, 0.1); p.lineTo(x + lean - 0.01, h - 0.22); p.quadraticCurveTo(x + lean - 0.06, h - 0.12, x + lean + 0.02, h); p.quadraticCurveTo(x + lean + 0.05, h - 0.12, x + lean + 0.01, h - 0.22); p.lineTo(x + 0.01, 0.1);
  }
  p.lineTo(0.3, 0); p.closePath();
}, (c) => {
  c.fillStyle = '#8a9a4a'; c.fillRect(-0.4, 0, 0.8, 0.9);
  c.lineCap = 'round'; for (let i = 0; i < 16; i++) { const x = rand(-0.25, 0.25); c.strokeStyle = pick(['#6a7a3a', '#a8a85a', '#8a9a4a']); c.lineWidth = 0.012; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x, 0.2, x + rand(-0.15, 0.15), rand(0.15, 0.3)); c.stroke(); }
  for (let i = 0; i < SUSUKI_TIPS; i++) { const x = -0.26 + (i * 0.52) / (SUSUKI_TIPS - 1), lean = (i - (SUSUKI_TIPS - 1) / 2) * 0.03, h = 0.55 + 0.18 * Math.sin(i * 2.1) ** 2; c.fillStyle = '#f2e8d0'; c.beginPath(); c.ellipse(x + lean, h - 0.11, 0.04, 0.12, -lean, 0, 7); c.fill(); c.fillStyle = '#d8c49a'; c.beginPath(); c.ellipse(x + lean + 0.012, h - 0.13, 0.014, 0.08, -lean, 0, 7); c.fill(); }
}, { ppu: 600, t: 0.015, ink: 0 });
const SUSUKI_AT = [[-2.75, 2.2, 1], [-0.55, 2.3, 0.85], [2.65, 2.15, 1.1], [1.0, 2.25, 0.8]];
function buildSusuki() {
  const g = group(), clumps = SUSUKI_AT.map(([x, z, s], i) => { const m = cutout(susukiA()); m.position.set(x, 0, z); m.scale.setScalar(s); m.rotation.y = (i % 2 ? -0.2 : 0.2); g.add(m); return m; });
  g.userData.tick = (t) => clumps.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.2 + i * 1.7) * 0.06; });
  return g;
}
const higanbanaA = () => cutoutAsset(K('higanbana'), (p) => {
  p.moveTo(-0.008, 0); p.lineTo(0.008, 0); p.lineTo(0.008, 0.2);
  polarPts(0, 0.24, (a) => 0.05 + 0.035 * Math.abs(Math.sin(a * 3)), 0.8, -Math.PI / 2 + 0.2, Math.PI * 1.5 - 0.2, 40).forEach(([x, y]) => p.lineTo(x, y));
  p.lineTo(-0.008, 0.2); p.closePath();
}, (c) => {
  c.fillStyle = '#4f7a3a'; c.fillRect(-0.02, 0, 0.04, 0.22);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.strokeStyle = '#d8302a'; c.lineWidth = 0.014; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0.24); c.quadraticCurveTo(Math.cos(a) * 0.05, 0.24 + Math.sin(a) * 0.04, Math.cos(a + 0.4) * 0.08, 0.24 + Math.sin(a + 0.4) * 0.065); c.stroke(); }
  dab(c, 0, 0.24, 0.03, '#e8402f'); c.strokeStyle = '#f26a4a'; c.lineWidth = 0.004; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.moveTo(0, 0.24); c.lineTo(Math.cos(a) * 0.075, 0.24 + Math.sin(a) * 0.06); c.stroke(); }
}, { ppu: 900, t: 0.01, ink: 0.006 });
const HIGANBANA_AT = (() => { const a: number[][] = []; for (let x = -2.8; x < -0.4; x += 0.28) a.push([x + rand(-0.06, 0.06), PADDY_L.z1 + 0.1 + rand(-0.03, 0.04)]); for (let x = 0.85; x < 2.9; x += 0.32) a.push([x + rand(-0.06, 0.06), PADDY_R.z1 + 0.1 + rand(-0.03, 0.04)]); [[PATH[0] - 0.1, 1.0], [PATH[0] - 0.12, 1.45], [PATH[1] + 0.12, 1.2], [PATH[1] + 0.1, 0.75]].forEach((p) => a.push(p)); return a; })();
function buildHiganbana() {
  const g = group();
  HIGANBANA_AT.forEach(([x, z], i) => { const m = cutout(higanbanaA()); m.position.set(x, 0, z); m.rotation.y = (i % 3 - 1) * 0.4; m.scale.setScalar(0.9 + (i % 4) * 0.08); g.add(m); });
  return g;
}
function buildTsukimi() {
  const wd = plainM(K('sanbo'), '#c8a878'), white = plainM(K('dango'), '#fbf6ec');
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), wd); stand.position.y = 0.04;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.26), wd); tray.position.y = 0.088;
  const g = group(stand, tray);
  const geo = new THREE.SphereGeometry(0.028, 10, 8);
  [[3, 0.12], [2, 0.165], [1, 0.21]].forEach(([n, y]) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const d = new THREE.Mesh(geo, white); d.position.set((i - (n - 1) / 2) * 0.052, y, (j - (n - 1) / 2) * 0.052); g.add(d); } });
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.2, 12), plainM(K('vase'), '#4a5a6a')); vase.position.set(0.25, 0.1, -0.02); g.add(vase);
  const stem = plainM(K('stem'), '#a8a060'), plume = plainM(K('plume'), '#efe4c8');
  [-0.4, 0, 0.35].forEach((a, i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.42, 4), stem); s.position.set(0.25 + Math.sin(a) * 0.1, 0.4, -0.02); s.rotation.z = -a * 0.5; g.add(s); const p = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 6), plume); p.position.set(0.25 + Math.sin(a) * 0.21, 0.6 - i * 0.02, -0.02); p.rotation.z = -a * 0.5 + Math.PI; g.add(p); });
  return g;
}
const andonMat = () => memo(K('andon'), () => {
  const cv = newCanvas(64, 128), c = cv.getContext('2d')!; c.fillStyle = '#f6eed8'; c.fillRect(0, 0, 64, 128); c.strokeStyle = '#4a3426'; c.lineWidth = 4; c.strokeRect(2, 2, 60, 124); c.beginPath(); c.moveTo(0, 64); c.lineTo(64, 64); c.stroke();
  const m = paperMat(toTex(cv)); glowing(m); m.emissiveMap = toTex(cv); return m;
});
function buildAndon() {
  const frame = plainM(K('andonF'), '#4a3426');
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.24, 0.13), andonMat()); box.position.y = 0.18;
  const g = group(box);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.31, 0.015), frame); l.position.set(sx * 0.068, 0.155, sz * 0.068); g.add(l); });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.015, 0.015), frame); handle.position.y = 0.33; g.add(handle);
  return g;
}

// ── the family
const grandmaA = () => cutoutAsset(K('grandma'), seatedOutline, (c) => {
  c.fillStyle = '#5a6a5a'; c.fillRect(-0.25, 0, 0.5, 0.32);
  c.fillStyle = '#8a6a8a'; c.fillRect(-0.25, 0.28, 0.5, 0.26); c.fillStyle = '#6a4a6a'; for (let i = 0; i < 8; i++) dab(c, rand(-0.18, 0.18), rand(0.3, 0.5), 0.012, '#b08ab0');
  c.fillStyle = '#f4ecd8'; c.beginPath(); poly(c, [[-0.05, 0.54], [0, 0.45], [0.05, 0.54]]); c.fill();
  c.fillStyle = '#e8dcc4'; c.fillRect(-0.06, 0.3, 0.12, 0.05); c.fillStyle = '#f2d1b2'; dab(c, -0.07, 0.33, 0.025, '#f2d1b2'); dab(c, 0.07, 0.33, 0.025, '#f2d1b2'); // a cup of tea
  c.fillStyle = '#c8b48a'; c.fillRect(-0.12, 0, 0.1, 0.03); c.fillRect(0.02, 0, 0.1, 0.03);
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.61, 0.085, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = '#dcd6cc'; c.beginPath(); c.ellipse(0, 0.65, 0.095, 0.06, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.71, 0.04, '#dcd6cc');
  face(c, 0.61, 0.08);
}, { ppu: 800 });
const grandpaA = () => cutoutAsset(K('grandpa'), figure(0.98, 0.18), (c) => {
  c.fillStyle = '#4a5a72'; c.fillRect(-0.25, 0, 0.5, 0.82); c.fillStyle = '#3a4a62'; c.fillRect(-0.25, 0, 0.5, 0.38);
  c.strokeStyle = '#6a7a92'; c.lineWidth = 0.01; for (let y = 0.4; y < 0.78; y += 0.06) { c.beginPath(); c.moveTo(-0.2, y); c.lineTo(0.2, y + 0.01); c.stroke(); }
  c.fillStyle = '#c8b48a'; c.fillRect(-0.15, 0, 0.12, 0.03); c.fillRect(0.03, 0, 0.12, 0.03);
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.89, 0.09, 0.095, 0, 0, 7); c.fill();
  c.fillStyle = '#e8e2d6'; c.fillRect(-0.09, 0.93, 0.18, 0.03); // a towel round the head
  face(c, 0.88, 0.085); c.strokeStyle = '#d8d2c6'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(-0.03, 0.83); c.quadraticCurveTo(0, 0.81, 0.03, 0.83); c.stroke();
}, { ppu: 700 });
const bundleA = () => cutoutAsset(K('bundle'), (p) => poly(p, [[-0.04, 0], [0.04, 0], [0.12, 0.42], [0.04, 0.44], [-0.04, 0.44], [-0.1, 0.42]]), (c) => {
  c.fillStyle = '#d8b85a'; c.fillRect(-0.15, 0, 0.3, 0.5); c.strokeStyle = '#a88030'; c.lineWidth = 0.006; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(rand(-0.03, 0.03), 0); c.lineTo(rand(-0.1, 0.1), 0.44); c.stroke(); }
  c.fillStyle = '#7a5a2a'; c.fillRect(-0.06, 0.12, 0.12, 0.02);
}, { ppu: 700 });
function buildGrandpa() { const b = cutout(bundleA()); b.position.set(0.14, 0.55, -0.02); b.rotation.z = -0.5; return group(cutout(grandpaA()), b); }
const boyA = () => cutoutAsset(K('boy'), figure(0.7, 0.14), (c) => {
  c.fillStyle = '#f2f2ea'; c.fillRect(-0.2, 0.32, 0.4, 0.4); c.fillStyle = '#3a5a8a'; c.fillRect(-0.2, 0, 0.4, 0.34);
  c.fillStyle = '#f5d9bf'; c.fillRect(-0.12, 0, 0.24, 0.05);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.63, 0.085, 0.085, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.67, 0.09, 0.05, 0, Math.PI, 0, true); c.fill();
  face(c, 0.62, 0.08, false); c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; c.beginPath(); c.arc(0, 0.6, 0.02, 0.2, Math.PI - 0.2); c.stroke();
}, { ppu: 800 });
const netA = () => cutoutAsset(K('net'), (p) => { p.moveTo(-0.008, 0); p.lineTo(0.008, 0); p.lineTo(0.008, 0.5); polarPts(0, 0.58, () => 0.08, 1, -Math.PI / 2 + 0.1, Math.PI * 1.5 - 0.1, 30).forEach(([x, y]) => p.lineTo(x, y)); p.lineTo(-0.008, 0.5); p.closePath(); }, (c) => {
  c.fillStyle = '#c8a878'; c.fillRect(-0.02, 0, 0.04, 0.52); c.fillStyle = 'rgba(240,250,240,.9)'; c.beginPath(); c.arc(0, 0.58, 0.075, 0, 7); c.fill();
  c.strokeStyle = '#9ab0a0'; c.lineWidth = 0.004; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 0.022, 0.5); c.lineTo(i * 0.022, 0.66); c.stroke(); c.beginPath(); c.moveTo(-0.08, 0.58 + i * 0.022); c.lineTo(0.08, 0.58 + i * 0.022); c.stroke(); }
  c.strokeStyle = '#4a7a3a'; c.lineWidth = 0.01; c.beginPath(); c.arc(0, 0.58, 0.078, 0, 7); c.stroke();
}, { ppu: 900, t: 0.01 });
function buildBoy() {
  const net = new THREE.Group(); net.position.set(0.12, 0.35, 0.02); net.add(cutout(netA()));
  const g = group(cutout(boyA()), net);
  g.userData.tick = (t) => { net.rotation.z = -0.3 + Math.sin(t * 1.6) * 0.5; };
  return g;
}
const girlA = () => cutoutAsset(K('girl'), figure(0.74, 0.15), (c) => {
  c.fillStyle = '#e8743a'; c.fillRect(-0.22, 0, 0.44, 0.62);
  for (let i = 0; i < 8; i++) { const x = rand(-0.13, 0.13), y = rand(0.06, 0.5); c.fillStyle = '#f6e6c8'; c.beginPath(); c.ellipse(x, y, 0.025, 0.014, 0.6, 0, 7); c.fill(); }
  c.fillStyle = '#c4362f'; c.fillRect(-0.15, 0.38, 0.3, 0.07);
  c.fillStyle = '#c8a050'; c.beginPath(); c.ellipse(-0.1, 0.3, 0.07, 0.05, 0, 0, 7); c.fill(); c.strokeStyle = '#8a6a30'; c.lineWidth = 0.006; c.beginPath(); c.ellipse(-0.1, 0.32, 0.07, 0.035, 0, Math.PI, 0); c.stroke(); // a basket of chestnuts
  dab(c, -0.12, 0.33, 0.015, '#6a3a20'); dab(c, -0.08, 0.335, 0.015, '#6a3a20');
  c.fillStyle = '#f5d9bf'; c.fillRect(-0.1, 0, 0.2, 0.04); c.beginPath(); c.ellipse(0, 0.67, 0.085, 0.085, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.71, 0.095, 0.055, 0, Math.PI, 0, true); c.fill(); c.fillRect(-0.095, 0.6, 0.04, 0.11); c.fillRect(0.055, 0.6, 0.04, 0.11);
  face(c, 0.66, 0.08, false);
}, { ppu: 800 });
function buildGirl() { const m = cutout(girlA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 1.4) * 0.03; }; return g; }

// ── animals
const henA = () => cutoutAsset(K('hen'), (p) => { p.moveTo(-0.02, 0); p.lineTo(0.02, 0); p.lineTo(0.03, 0.05); p.bezierCurveTo(0.1, 0.05, 0.12, 0.1, 0.1, 0.15); p.lineTo(0.14, 0.14); p.lineTo(0.1, 0.18); p.lineTo(0.1, 0.21); p.lineTo(0.07, 0.2); p.bezierCurveTo(0.04, 0.18, 0.03, 0.14, 0.02, 0.12); p.bezierCurveTo(-0.06, 0.13, -0.12, 0.16, -0.15, 0.2); p.bezierCurveTo(-0.14, 0.1, -0.08, 0.05, -0.02, 0.05); p.closePath(); }, (c) => {
  c.fillStyle = '#fbf8f0'; c.fillRect(-0.2, 0, 0.36, 0.25); c.fillStyle = '#e8e2d4'; c.beginPath(); c.ellipse(-0.02, 0.09, 0.07, 0.03, -0.2, 0, 7); c.fill();
  c.fillStyle = '#d8302a'; c.fillRect(0.06, 0.18, 0.05, 0.035); c.fillStyle = '#e8a83a'; c.beginPath(); poly(c, [[0.1, 0.155], [0.14, 0.14], [0.1, 0.17]]); c.fill(); dab(c, 0.085, 0.165, 0.007, '#2a2420');
  c.fillStyle = '#e8a83a'; c.fillRect(-0.02, 0, 0.01, 0.05); c.fillRect(0.01, 0, 0.01, 0.05);
}, { ppu: 1100, t: 0.02 });
function buildChickens() {
  const g = group(), hens = [[0, 0, 1, 0], [0.3, -0.12, -1, 1.5], [-0.28, 0.08, 1, 3]].map(([x, z, s, ph]) => { const m = cutout(henA()); m.position.set(x, 0, z); m.scale.x = s; g.add(m); return { m, ph }; });
  g.userData.tick = (t) => hens.forEach(({ m, ph }) => { const k = (t * 0.7 + ph) % 3; m.rotation.z = (k < 0.4 ? Math.sin(k / 0.4 * Math.PI) * 0.45 : 0) * Math.sign(m.scale.x) * -1; });
  return g;
}
const catA = () => cutoutAsset(K('cat'), (p) => { p.moveTo(-0.08, 0); p.lineTo(0.1, 0); p.bezierCurveTo(0.12, 0.12, 0.08, 0.2, 0.06, 0.22); p.lineTo(0.08, 0.3); p.lineTo(0.03, 0.26); p.lineTo(-0.02, 0.26); p.lineTo(-0.06, 0.3); p.lineTo(-0.05, 0.22); p.bezierCurveTo(-0.1, 0.18, -0.12, 0.08, -0.08, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#fbf6ec'; c.fillRect(-0.15, 0, 0.3, 0.32); c.fillStyle = '#e8963a'; c.beginPath(); c.ellipse(-0.06, 0.24, 0.06, 0.06, 0, 0, 7); c.fill(); c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0.07, 0.25, 0.04, 0.05, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-0.05, 0.06, 0.05, 0.04, 0, 0, 7); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.007; [-0.015, 0.035].forEach((x) => { c.beginPath(); c.arc(x, 0.2, 0.011, 0.3, Math.PI - 0.3); c.stroke(); });
}, { ppu: 1000, t: 0.02 });
function buildCat() { const m = cutout(catA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 0.9) * 0.03; }; return g; }
const crowA = () => cutoutAsset(K('crow'), (p) => { p.moveTo(-0.02, 0); p.lineTo(0.02, 0); p.lineTo(0.03, 0.05); p.bezierCurveTo(0.09, 0.06, 0.11, 0.11, 0.1, 0.14); p.lineTo(0.16, 0.13); p.lineTo(0.1, 0.17); p.bezierCurveTo(0.07, 0.19, 0.03, 0.16, 0.02, 0.13); p.bezierCurveTo(-0.06, 0.13, -0.14, 0.09, -0.18, 0.05); p.bezierCurveTo(-0.08, 0.05, -0.04, 0.05, -0.02, 0.04); p.closePath(); }, (c) => {
  c.fillStyle = '#23232a'; c.fillRect(-0.2, 0, 0.38, 0.2); c.fillStyle = '#3a3a48'; c.beginPath(); c.ellipse(-0.04, 0.1, 0.07, 0.025, -0.2, 0, 7); c.fill(); dab(c, 0.08, 0.15, 0.008, '#f2f2f2');
}, { ppu: 1100, t: 0.02 });
function buildCrow() { const m = cutout(crowA()), g = group(m); g.userData.tick = (t) => { const k = t % 7; m.position.y = k < 0.3 ? Math.sin((k / 0.3) * Math.PI) * 0.05 : 0; m.scale.x = Math.floor(t / 7) % 2 ? -1 : 1; }; return g; }
function buildDragonflies() {
  const body = plainM(K('tombo'), '#d8402a'), wingM = memo(K('tomboW'), () => toon({ color: '#f4f8ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  const g = group();
  const flies = [[-1.6, 0.65, 1.3], [-0.9, 0.8, 1.6], [1.8, 0.7, 1.3], [0.2, 0.9, 1.0], [-2.2, 0.75, 0.9]].map(([x, y, z], i) => {
    const d = new THREE.Group(); d.position.set(x, y, z);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.12, 5), body); b.rotation.z = Math.PI / 2; d.add(b);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), body); head.position.x = 0.065; d.add(head);
    const wings = [-1, 1].flatMap((s) => [0.02, 0.0].map((dx) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.08), wingM); w.rotation.x = -Math.PI / 2; w.position.set(0.02 + dx, 0.005, s * 0.042); d.add(w); return w; }));
    g.add(d); return { d, home: new V3(x, y, z), wings, ph: i * 1.3 };
  });
  g.userData.tick = (t, ev) => flies.forEach(({ d, home, wings, ph }) => {
    // dart, hover, dart: smooth steps between random-ish hover points
    const seg = Math.floor(t / 2.2 + ph), k = smooth(Math.min(1, ((t / 2.2 + ph) % 1) * 2.5));
    const P = (n: number) => new V3(home.x + Math.sin(n * 2.7 + ph) * 0.45, home.y + Math.sin(n * 1.9) * 0.12, home.z + Math.cos(n * 2.3 + ph) * 0.3);
    const a = P(seg), b = P(seg + 1); d.position.lerpVectors(a, b, k);
    d.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
    wings.forEach((w, i) => { w.rotation.y = Math.sin(t * 40 + i) * 0.3; });
    d.scale.setScalar(Math.max(0.001, 1 - smooth(Math.min(1, ev * 1.5))));
  });
  return g;
}
// ── the secret: the moon rabbit pounding mochi behind the house
const rabbitA = () => cutoutAsset(K('rabbit'), (p) => { p.moveTo(-0.1, 0); p.lineTo(0.1, 0); p.bezierCurveTo(0.14, 0.1, 0.12, 0.2, 0.06, 0.24); p.lineTo(0.08, 0.42); p.lineTo(0.03, 0.42); p.lineTo(0.02, 0.27); p.lineTo(-0.02, 0.27); p.lineTo(-0.04, 0.43); p.lineTo(-0.08, 0.43); p.lineTo(-0.06, 0.24); p.bezierCurveTo(-0.12, 0.2, -0.14, 0.1, -0.1, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#fbfaf4'; c.fillRect(-0.15, 0, 0.3, 0.45); c.fillStyle = '#f2b8c8'; c.fillRect(0.045, 0.3, 0.015, 0.1); c.fillRect(-0.06, 0.3, 0.015, 0.1);
  dab(c, -0.03, 0.18, 0.011, '#d8302a'); dab(c, 0.03, 0.18, 0.011, '#d8302a'); soft(c, -0.05, 0.15, 0.02, '#f2a8b8', 0.7); soft(c, 0.05, 0.15, 0.02, '#f2a8b8', 0.7);
}, { ppu: 1000, t: 0.02 });
function buildRabbit() {
  const usu = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.12, 12), plainM(K('usu'), '#8a6a48')); usu.position.set(0.18, 0.06, 0.02);
  const mochi = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), plainM(K('mochi'), '#fbfaf4')); mochi.scale.y = 0.6; mochi.position.set(0.18, 0.13, 0.02);
  const kine = new THREE.Group(); kine.position.set(0.06, 0.18, 0.05);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 5), plainM(K('kineH'), '#c8a878')); handle.rotation.z = -1.0; handle.position.set(0.06, 0.05, 0);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 8), plainM(K('kineH'), '#c8a878')); head.position.set(0.13, 0.1, 0); kine.add(handle, head);
  const g = group(cutout(rabbitA()), usu, mochi, kine);
  g.userData.tick = (t) => { const k = (t * 1.2) % 1; kine.rotation.z = k < 0.6 ? lerp(0, 0.9, ease.out(k / 0.6)) : lerp(0.9, 0, ease.in((k - 0.6) / 0.4)); };
  return g;
}

// ── ground: autumn grass, a packed-earth yard, the stone channel, paddy beds and ridges, a dirt path
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#a0b45a', light: '#bcc86e', shade: '#80984a', tufts: [] });
  c.fillStyle = '#c9ad7f'; c.beginPath(); rrect(c, -2.2, -CZ + 0.25, 2.45, 2.0, 0.4); c.fill();
  mottle(c, -2.2, -CZ + 0.25, 4.65, 1.7, ['#b89a6a', '#d8bf92'], 40, [0.05, 0.14], 0.5);
  // the channel: stones and water
  c.fillStyle = '#8f8a80'; c.fillRect(-W / 2, -CZ - CW / 2 - 0.06, W, CW + 0.12); c.fillStyle = '#3f6a7a'; c.fillRect(-W / 2, -CZ - CW / 2, W, CW);
  // paddy beds (mud) inside grassy ridges
  [PADDY_L, PADDY_R].forEach((f) => { c.fillStyle = '#7a6040'; c.fillRect(f.x0 - 0.06, -f.z1 - 0.06, f.x1 - f.x0 + 0.12, f.z1 - f.z0 + 0.12); });
  // the path
  c.fillStyle = '#c4a878'; c.beginPath(); rrect(c, PATH[0], -D / 2 - 0.1, PATH[1], -CZ - CW / 2, 0.05); c.fill();
  for (let i = 0; i < 120; i++) dab(c, rand(PATH[0], PATH[1]), rand(-D / 2, -CZ - 0.25), rand(0.008, 0.016), pick(['#b09468', '#d8c49a']), 0.8);
  const inYard = (x: number, y: number) => x > -2.2 && x < 2.45 && y > -CZ + 0.2 && y < 2.0;
  const inPaddy = (x: number, y: number) => [PADDY_L, PADDY_R].some((f) => x > f.x0 - 0.08 && x < f.x1 + 0.08 && -y > f.z0 - 0.08 && -y < f.z1 + 0.08);
  tufts(c, -W / 2, -D / 2, W, D, ['#7a9a45', '#98b052', '#b8c06a', '#c4b060'], 1500, (x, y) => inYard(x, y) || inPaddy(x, y) || Math.abs(y + CZ) < CW / 2 + 0.08 || (x > PATH[0] && x < PATH[1] && y < -CZ));
  for (let i = 0; i < 30; i++) { const x = rand(-3, 3), y = rand(-2.4, 2.4); if (inYard(x, y) || inPaddy(x, y)) continue; dab(c, x, y, 0.012, pick(['#f2d24a', '#ffffff', '#c8a8e8']), 0.9); }
}

export const SATOYAMA: SceneDef = {
  id: 'satoyama',
  title: 'Wiejska zagroda',
  jp: '里山の月見',
  season: 'jesień, pełnia',
  blurb: 'Chata pod strzechą, złote pola i księżyc w pełni.',
  box: ['#26305a', '#d8a84a'],
  seed: 8181,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#9ab45a', '#b8c86e'] },
  sky: {
    day: { grad: [[0, '#3f86cc'], [0.45, '#8cc0e6'], [0.82, '#e8e0c4'], [1, '#f6ecd0']], cloud: '#fffaf0', hi: '#ffffff', edge: '#fffaf0', shadow: '#c4c0d4' },
    evening: { grad: [[0, '#0c1236'], [0.45, '#1f2a5e'], [0.78, '#45508a'], [1, '#a88a8a']], cloud: '#3a4478', hi: '#5a68a0', edge: '#3a4478', shadow: '#232c5a', stars: true },
  },
  light: {
    day: { sky: '#fff0d8', ground: '#a08a50', hemi: 1.15, sun: '#ffe2b4', sunI: 2.6, sunPos: [5, 6.5, 4], bloom: 0.03 },
    evening: { sky: '#5a6aa8', ground: '#2a2a3a', hemi: 0.8, sun: '#b8c8f4', sunI: 1.0, sunPos: [-3, 5, -3], bloom: 0.85 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['mountains', 'forest', 'moon'] },
    { name: 'Woda', jp: '水', pieces: ['channel', 'bridge', 'wheel', 'shed'] },
    { name: 'Chata', jp: '民家', pieces: ['floor', 'walls', 'roof', 'ridge', 'engawa'] },
    { name: 'Pola', jp: '田んぼ', pieces: ['paddyL', 'paddyR', 'rack', 'scarecrow'] },
    { name: 'Podwórze', jp: '庭', pieces: ['well', 'kaki', 'wood', 'cedars'] },
    { name: 'Jesień', jp: '秋', pieces: ['susuki', 'higanbana', 'tsukimi', 'andon'] },
    { name: 'Domownicy', jp: '家族', pieces: ['grandma', 'grandpa', 'boy', 'girl'] },
    { name: 'Zwierzęta', jp: '生き物', pieces: ['chickens', 'cat', 'crow', 'dragonflies'] },
  ],
  pieces: {
    mountains: { name: 'Góry', pos: [0, 0, -2.42], build: () => group(cutout(mountA())) },
    forest: { name: 'Las', pos: [0, 0, -2.2], build: () => group(cutout(forestA())), sound: 'leaves' },
    moon: { name: 'Księżyc', pos: [MOON_X, 0, -2.49], build: buildMoon, sound: 'bonsho' },
    channel: { name: 'Kanał', pos: [0, 0, CZ], build: buildChannel, sound: 'stream' },
    bridge: { name: 'Kładka', pos: [(PATH[0] + PATH[1]) / 2, 0, CZ], build: buildBridge },
    wheel: { name: 'Koło wodne', pos: [WHEEL_X, 0, CZ], build: buildWheel, sound: 'mill' },
    shed: { name: 'Młynek', pos: [WHEEL_X, 0, -0.32], build: buildShed },
    floor: { name: 'Podłoga', pos: [HX, 0, HZ], build: buildFloor },
    walls: { name: 'Ściany', pos: [HX, FLOOR, HZ], build: buildWalls },
    roof: { name: 'Strzecha', pos: [HX, RY, HZ], build: buildRoof },
    ridge: { name: 'Kalenica', pos: [HX, RY, HZ], build: buildRidge },
    engawa: { name: 'Weranda', pos: [HX, 0, HZ + HD / 2 + 0.175], build: buildEngawa },
    paddyL: { name: 'Pole ryżu', pos: [(PADDY_L.x0 + PADDY_L.x1) / 2, 0, (PADDY_L.z0 + PADDY_L.z1) / 2], build: () => buildPaddy(PADDY_L) },
    paddyR: { name: 'Poletko', pos: [(PADDY_R.x0 + PADDY_R.x1) / 2, 0, (PADDY_R.z0 + PADDY_R.z1) / 2], build: () => buildPaddy(PADDY_R) },
    rack: { name: 'Suszarnia', pos: [-2.0, 0, -1.2], build: buildRack },
    scarecrow: { name: 'Strach na wróble', pos: [-1.85, 0.05, 1.25], build: buildScarecrow },
    well: { name: 'Studnia', pos: [-1.25, 0, -0.5], build: buildWell },
    kaki: { name: 'Kaki', pos: [-1.25, 0, -1.95], build: buildKaki, sound: 'crickets' },
    wood: { name: 'Drewno', pos: [-2.7, 0, -0.3], rotY: 0.3, build: () => group(cutout(woodA())) },
    cedars: { name: 'Cedry', pos: [2.6, 0, -1.75], build: buildCedars },
    susuki: { name: 'Susuki', pos: [0, 0, 0], build: buildSusuki },
    higanbana: { name: 'Higanbana', pos: [0, 0, 0], build: buildHiganbana },
    tsukimi: { name: 'Dango', pos: [HX + 0.75, FLOOR, -0.22], build: buildTsukimi },
    andon: { name: 'Lampka', pos: [HX - 0.85, FLOOR, -0.24], build: buildAndon },
    grandma: { name: 'Babcia', pos: [HX + 0.15, FLOOR - 0.24, -0.0], build: () => group(cutout(grandmaA())) },
    grandpa: { name: 'Dziadek', pos: [-1.75, 0, -0.75], rotY: 0.2, build: buildGrandpa },
    boy: { name: 'Chłopiec', pos: [0.32, 0, 1.65], rotY: -0.15, build: buildBoy },
    girl: { name: 'Dziewczynka', pos: [0.05, 0, 2.15], rotY: 0.15, build: buildGirl },
    chickens: { name: 'Kury', pos: [-2.0, 0, -0.05], build: buildChickens },
    cat: { name: 'Kot', pos: [HX - 0.4, FLOOR, -0.18], build: buildCat },
    crow: { name: 'Wrona', pos: [-1.55, 0.73, 1.26], build: buildCrow, sound: 'crow' },
    dragonflies: { name: 'Ważki', pos: [0, 0, 0], build: buildDragonflies },
  },
  secret: { name: 'księżycowy królik', build: buildRabbit, pos: [HX + 0.4, 0, -2.0] },
  setup(ctx) {
    const { fx, scene } = ctx;
    const porch = new THREE.PointLight('#ffc880', 0, 3.5, 1.5); porch.position.set(HX + 0.3, 0.75, -0.05);
    const andon = new THREE.PointLight('#ffc070', 0, 2.5, 1.5); andon.position.set(HX - 0.85, 0.42, -0.02);
    const moonL = new THREE.PointLight('#dfe6ff', 0, 9, 1.2); moonL.position.set(MOON_X, 2.6, -1.6);
    scene.add(porch, andon, moonL);
    const smoke = fx.emitter(0, () => fx.steam(new V3(HX - 1.42, RY - 0.25, HZ), '#e6e2dc', 1.3));
    const leaves = fx.emitter(0, () => fx.leaf(new V3(-1.25 + rand(-0.5, 0.5), rand(1.2, 1.7), -1.95 + rand(-0.3, 0.3)), pick(['#e8742a', '#d8a03a', '#c8502a'])));
    return {
      update(_dt, _t, c) {
        const e = c.evening, on = (id: string) => (c.placed.has(id) ? e : 0);
        frontMat().emissiveIntensity = on('walls') * 0.6; sideMat().emissiveIntensity = on('walls') * 0.5;
        porch.intensity = on('walls') * 2.2;
        andonMat().emissiveIntensity = on('andon') * 1.2; andon.intensity = on('andon') * 1.8;
        moonA().mat.emissiveIntensity = 0.15 + on('moon') * 1.05; moonL.intensity = on('moon') * 2.5;
        smoke.rate = c.placed.has('roof') ? (c.done ? 1.6 : 0.6) : 0;
        leaves.rate = c.placed.has('kaki') ? (c.done ? 0.6 : 0.2) : 0;
      },
    };
  },
};
