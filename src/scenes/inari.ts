// Scene 3: a small Inari shrine in an autumn forest. A row of vermilion torii leads to it, stone foxes guard it.
// Finale: dusk, the stone lanterns light up, maple leaves fall and blue fox-fires (kitsunebi) drift around the shrine.
import * as THREE from 'three';
import { blob, dab, flowers, foliage, meadow, poly, rrect, soft, text, tufts, wood, type Ctx, type Pen, type Tones } from '../core/paint';
import { mix, pick, rand, rnd } from '../core/util';
import { boardMat, cutout, cutoutAsset, foldBox, gableRoof, group, plainM } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'inari:' + s;
const SHRINE_Z = -1.3;
const PATH = (x: number, y: number) => Math.abs(x) < 0.62 && y < 2.5 && y > -SHRINE_Z - 0.6; // ground coords: y = -z

// ── backdrop: autumn forest on a hill
const ridge = (x: number) => 1.75 + 0.3 * Math.sin(x * 0.8 + 1.1) + 0.15 * Math.sin(x * 2.1);
function forestOutline(p: Pen) {
  p.moveTo(-3.1, 0);
  for (let i = 0; i <= 120; i++) { const x = -3.1 + (6.2 * i) / 120; p.lineTo(x, ridge(x) + 0.09 * Math.abs(Math.sin(x * 9)) + 0.05 * Math.sin(x * 23)); }
  p.lineTo(3.1, 0); p.closePath();
}
const AUTUMN: Tones[] = [
  { shade: '#a5392b', mid: '#d4552f', light: '#ef8a3f', hi: '#ffd08a' },
  { shade: '#b8741f', mid: '#dfa23a', light: '#f3cf6a', hi: '#fff0b0' },
  { shade: '#7d3427', mid: '#a84a2f', light: '#cf7444', hi: '#f2b27a' },
  { shade: '#3f5d3e', mid: '#56794a', light: '#7a9c5c', hi: '#b8d48a' },
];
const forestA = () => cutoutAsset(K('forest'), forestOutline, (c) => {
  const g = c.createLinearGradient(0, 2.4, 0, 0); g.addColorStop(0, '#c9a37a'); g.addColorStop(1, '#8a6a4a'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.6);
  // three rows of crowns, the far ones paler (aerial perspective)
  ([[1.55, 0.55, 0.42], [1.05, 0.75, 0.22], [0.55, 1, 0]] as [number, number, number][]).forEach(([y, size, haze]) => {
    for (let x = -3.3; x < 3.3; x += rand(0.35, 0.55) * size) {
      const t = pick(AUTUMN), hz = (col: string) => mix(col, '#e9d6c0', haze);
      const tt = { shade: hz(t.shade), mid: hz(t.mid), light: hz(t.light), hi: hz(t.hi) };
      const r = rand(0.28, 0.42) * size, cy = y + rand(-0.1, 0.12);
      foliage(c, x - r, cy - r * 0.8, 2 * r, 1.8 * r, tt, { n: 8, r: [r * 0.35, r * 0.55] });
    }
  });
  c.fillStyle = 'rgba(255,236,210,.18)'; c.fillRect(-3.2, 1.2, 6.4, 1.4);
}, { ppu: 170, ink: 0 });

// ── trees
function crownOutline(cy: number, rx: number, ry: number, trunkW: number) {
  return (p: Pen) => {
    p.moveTo(trunkW * 1.4, 0); p.lineTo(trunkW, 0.15); p.lineTo(trunkW * 0.8, cy - ry * 0.7);
    const a0 = -1.3, a1 = Math.PI + 1.3;
    for (let i = 0; i <= 80; i++) { const a = a0 + ((a1 - a0) * i) / 80, r = 1 + 0.1 * Math.sin(a * 6 + 1) + 0.05 * Math.sin(a * 13); p.lineTo(Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); }
    p.lineTo(-trunkW * 0.8, cy - ry * 0.7); p.lineTo(-trunkW, 0.15); p.lineTo(-trunkW * 1.5, 0); p.closePath();
  };
}
const treeA = (key: string, t: Tones, cy: number, rx: number, ry: number) => cutoutAsset(K(key), crownOutline(cy, rx, ry, 0.09), (c) => {
  c.fillStyle = '#5e4334'; c.fillRect(-0.3, 0, 0.6, cy + 0.2);
  c.strokeStyle = '#4a3428'; c.lineWidth = 0.04; c.lineCap = 'round';
  [[-0.5, cy + 0.2], [0.45, cy + 0.1], [0, cy + 0.5], [-0.3, cy - 0.2]].forEach(([x, y]) => { c.beginPath(); c.moveTo(0, cy - ry * 0.6); c.quadraticCurveTo(x * 0.4, (cy + y) / 2, x, y); c.stroke(); });
  c.fillStyle = t.shade; c.beginPath(); c.ellipse(0, cy, rx * 0.95, ry * 0.92, 0, 0, 7); c.fill();
  foliage(c, -rx, cy - ry, 2 * rx, 2 * ry, t, { n: 42, r: [0.15, 0.26], inside: (x, y) => (x / (rx * 0.92)) ** 2 + ((y - cy) / (ry * 0.88)) ** 2 < 1 });
}, { ppu: 300, t: 0.03 });
const crossed = (a: () => ReturnType<typeof treeA>) => { const x = cutout(a()), y = cutout(a()); y.rotation.y = Math.PI / 2; return group(x, y); };
const mapleA = () => treeA('maple', AUTUMN[0], 2.0, 1.0, 0.85);
const ginkgoA = () => treeA('ginkgo', AUTUMN[1], 2.15, 0.75, 1.0);

// ── the shrine (hokora) on a stone plinth
const frontMat = () => boardMat(K('shFront'), 1.3, 0.95, (c, W, H) => {
  wood(c, W, H, '#8a5a36', { dir: 'v', plank: 0.22, frame: 0.05 });
  c.fillStyle = '#3a2618'; c.fillRect(0.2, 0.12, W - 0.4, H - 0.2);
  c.strokeStyle = '#c9a26a'; c.lineWidth = 0.012;
  for (let x = 0.26; x < W - 0.2; x += 0.08) { c.beginPath(); c.moveTo(x, 0.12); c.lineTo(x, H - 0.08); c.stroke(); }
  for (let y = 0.18; y < H - 0.08; y += 0.1) { c.beginPath(); c.moveTo(0.2, y); c.lineTo(W - 0.2, y); c.stroke(); }
  c.fillStyle = '#f3ead6'; c.fillRect(W / 2 - 0.14, 0.02, 0.28, 0.09); text(c, '稲荷', W / 2, 0.065, 0.06, '#2a2420');
  // a white paper zigzag (shide) on a straw rope
  c.strokeStyle = '#d9c38a'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(0.05, 0.13); c.quadraticCurveTo(W / 2, 0.2, W - 0.05, 0.13); c.stroke();
  [0.35, W - 0.35].forEach((x) => { c.fillStyle = '#ffffff'; poly(c, [[x, 0.16], [x + 0.05, 0.16], [x + 0.02, 0.22], [x + 0.06, 0.22], [x + 0.03, 0.3], [x - 0.01, 0.3], [x + 0.02, 0.22], [x - 0.02, 0.22]]); c.fill(); });
});
const sideMat = () => boardMat(K('shSide'), 1.0, 0.95, (c, W, H) => wood(c, W, H, '#8a5a36', { dir: 'h', plank: 0.16, frame: 0.05 }));
const topMat = () => boardMat(K('shTop'), 1.3, 1.0, (c, W, H) => wood(c, W, H, '#7a4e2f', { dir: 'h', plank: 0.2 }));
function buildShrine() {
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 1.35), plainM(K('plinth'), '#a8a397')); plinth.position.y = 0.15;
  const s = sideMat(), box = foldBox({ w: 1.3, d: 1.0, h: 0.95, top: topMat(), front: frontMat(), back: s, left: s, right: s });
  box.position.y = 0.3;
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.35), plainM(K('plinth'), '#a8a397')); step.position.set(0, 0.06, 0.85);
  const g = group(plinth, box, step);
  g.userData.setFold = (k) => box.userData.setFold!(k);
  return g;
}
const copperMat = () => boardMat(K('copper'), 1.95, 0.9, (c, W, H) => {
  c.fillStyle = '#5f9a86'; c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 0.09) { c.fillStyle = rnd() < 0.5 ? '#4f8774' : '#6fae97'; c.fillRect(x, 0, 0.045, H); }
  for (let i = 0; i < 18; i++) blob(c, rand(0, W), rand(0, H), rand(0.04, 0.1), pick(['#8cc4ad', '#3f6f5f']), 0.5, 0.3);
  c.fillStyle = '#3d6a5a'; c.fillRect(0, H - 0.05, W, 0.05);
}, { ppu: 300 });
const buildShrineRoof = () => gableRoof({ w: 1.95, l: 0.9, angle: 0.55, top: copperMat(), under: plainM(K('under'), '#5a3a24'), ridge: plainM(K('ridge'), '#355c4e') });
const saisenTop = () => boardMat(K('saisenTop'), 0.6, 0.32, (c, W, H) => { wood(c, W, H, '#6e4a2e', { dir: 'h', plank: 0.32 }); c.fillStyle = '#2a1c12'; for (let x = 0.05; x < W - 0.04; x += 0.07) c.fillRect(x, 0.04, 0.035, H - 0.08); });
const saisenFront = () => boardMat(K('saisenFront'), 0.6, 0.3, (c, W, H) => { wood(c, W, H, '#7e5434', { dir: 'h', plank: 0.3, frame: 0.025 }); text(c, '奉納', W / 2, H / 2, 0.11, '#f3e6c6'); });
const buildSaisen = () => { const f = saisenFront(); return foldBox({ w: 0.6, d: 0.32, h: 0.3, t: 0.02, top: saisenTop(), front: f, back: f, left: f, right: f }); };

// ── torii
function toriiOutline(p: Pen) {
  const R = [[0.62, 0], [0.59, 1.24], [0.72, 1.24], [0.72, 1.33], [0.58, 1.33], [0.58, 1.45], [0.84, 1.47], [0.92, 1.62], [0.6, 1.6], [0, 1.6]];
  p.moveTo(-0.62, 0);
  for (const [x, y] of R.slice(1)) p.lineTo(-x, y);
  for (const [x, y] of R.slice().reverse()) p.lineTo(x, y);
  p.lineTo(0.5, 0); p.lineTo(0.49, 1.24); p.lineTo(-0.49, 1.24); p.lineTo(-0.5, 0); p.closePath();
}
const toriiA = () => cutoutAsset(K('torii'), toriiOutline, (c) => {
  c.fillStyle = '#e04a30'; c.fillRect(-1, 0, 2, 1.7);
  c.fillStyle = '#b8361f'; c.fillRect(0.53, 0, 0.1, 1.3); c.fillRect(-0.53, 0, 0.04, 1.3); c.fillRect(-0.75, 1.24, 1.5, 0.03);
  c.fillStyle = '#f07a5a'; c.fillRect(-0.6, 0, 0.03, 1.3);
  c.fillStyle = '#2a2420'; c.fillRect(-1, 1.55, 2, 0.15); c.fillRect(-1, 0, 2, 0.1);
  c.fillStyle = '#2a2420'; c.fillRect(-0.09, 1.33, 0.18, 0.13); text(c, '稲荷', 0, 1.395, 0.045, '#e8c35a', { vertical: false });
  c.fillStyle = 'rgba(255,240,220,.35)'; c.fillRect(-0.95, 1.6, 1.9, 0.02);
}, { ppu: 380 });

// ── stone lanterns (toro) and stone foxes
const stone = () => plainM(K('stone'), '#aaa59a');
const fireMat = () => boardMat(K('fire'), 0.26, 0.24, (c, W, H) => {
  c.fillStyle = '#9d988d'; c.fillRect(0, 0, W, H); c.fillStyle = '#3a3530'; c.fillRect(0.06, 0.05, W - 0.12, H - 0.1);
  c.fillStyle = '#5a5248'; c.fillRect(W / 2 - 0.005, 0.05, 0.01, H - 0.1);
}, { ppu: 500, emissive: (c, W, H) => { c.fillStyle = '#ffb35a'; c.fillRect(0.06, 0.05, W - 0.12, H - 0.1); } });
function buildToro() {
  const s = stone();
  const parts: [THREE.BufferGeometry, number][] = [
    [new THREE.CylinderGeometry(0.2, 0.22, 0.1, 6), 0.05], [new THREE.CylinderGeometry(0.07, 0.09, 0.45, 8), 0.32],
    [new THREE.BoxGeometry(0.38, 0.06, 0.38), 0.57], [new THREE.ConeGeometry(0.33, 0.2, 4), 0.86], [new THREE.SphereGeometry(0.05, 8, 6), 0.99]];
  const g = group();
  parts.forEach(([geo, y]) => { const m = new THREE.Mesh(geo, s); m.position.y = y; if (geo instanceof THREE.ConeGeometry) m.rotation.y = Math.PI / 4; g.add(m); });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.26), [fireMat(), fireMat(), s, s, fireMat(), fireMat()]); box.position.y = 0.72; g.add(box);
  return g;
}
function foxOutline(sx: number) {
  return (p: Pen) => {
    const P = [[-0.14, 0], [0.16, 0], [0.17, 0.12], [0.12, 0.3], [0.1, 0.42], [0.13, 0.5], [0.1, 0.62], [0.12, 0.72], [0.07, 0.64], [0.0, 0.66], [-0.05, 0.64], [-0.08, 0.72], [-0.1, 0.6], [-0.1, 0.48], [-0.16, 0.4], [-0.2, 0.32], [-0.3, 0.42], [-0.34, 0.3], [-0.26, 0.12], [-0.2, 0.06]];
    poly(p, P.map(([x, y]) => [x * sx, y]));
  };
}
const stoneFoxA = (sx: number) => cutoutAsset(K('stoneFox' + sx), foxOutline(sx), (c) => {
  c.fillStyle = '#b2ad9f'; c.fillRect(-0.4, 0, 0.8, 0.8);
  blob(c, 0.06 * sx, 0.3, 0.12, '#9c978a', 1, 0.3); dab(c, -0.04 * sx, 0.5, 0.06, '#c4bfb2');
  for (let i = 0; i < 20; i++) dab(c, rand(-0.3, 0.2) * sx, rand(0, 0.7), rand(0.01, 0.03), pick(['#8e897d', '#c9c4b7', '#7f9a62']), 0.6);
  c.fillStyle = '#d3392b'; c.beginPath(); c.moveTo(-0.1 * sx, 0.44); c.lineTo(0.12 * sx, 0.44); c.lineTo(0.02 * sx, 0.3); c.closePath(); c.fill();
  c.strokeStyle = '#3a3530'; c.lineWidth = 0.01; c.beginPath(); c.moveTo(0.0, 0.6); c.lineTo(0.04 * sx, 0.58); c.stroke();
  dab(c, 0.06 * sx, 0.6, 0.012, '#3a3530');
}, { ppu: 700 });
const buildStoneFox = (sx: number) => () => {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.36), stone()); base.position.y = 0.175;
  const f = cutout(stoneFoxA(sx)); f.position.y = 0.35;
  return group(base, f);
};

// ── life
function keeperOutline(p: Pen) {
  p.moveTo(-0.24, 0); p.lineTo(0.24, 0); p.lineTo(0.2, 0.55); p.bezierCurveTo(0.24, 0.7, 0.22, 0.82, 0.13, 0.86);
  p.bezierCurveTo(0.18, 0.95, 0.15, 1.12, 0, 1.13); p.bezierCurveTo(-0.15, 1.12, -0.18, 0.95, -0.13, 0.86);
  p.bezierCurveTo(-0.22, 0.82, -0.24, 0.7, -0.2, 0.55); p.closePath();
}
const keeperA = () => cutoutAsset(K('keeper'), keeperOutline, (c) => {
  c.fillStyle = '#7fa4c9'; c.fillRect(-0.3, 0, 0.6, 0.55);
  c.strokeStyle = '#5f84a9'; c.lineWidth = 0.01; [-0.12, 0, 0.12].forEach((x) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x * 0.7, 0.5); c.stroke(); });
  c.fillStyle = '#f6f2ea'; c.fillRect(-0.3, 0.5, 0.6, 0.38); c.fillStyle = '#d9d2c4'; c.fillRect(0.08, 0.5, 0.2, 0.38);
  c.strokeStyle = '#cfc6b5'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(-0.08, 0.86); c.lineTo(0.04, 0.62); c.stroke();
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.99, 0.13, 0.14, 0, 0, 7); c.fill();
  c.fillStyle = '#ece8e0'; c.beginPath(); c.ellipse(0, 1.08, 0.13, 0.06, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, 0.9, 0.07, 0.05, 0, 0, 7); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#3b2f28'; c.lineWidth = 0.012; [-0.05, 0.05].forEach((x) => { c.beginPath(); c.arc(x, 1.0, 0.02, 0.3, Math.PI - 0.3); c.stroke(); });
  soft(c, -0.08, 0.96, 0.03, '#f08a7a', 0.6); soft(c, 0.08, 0.96, 0.03, '#f08a7a', 0.6);
  c.fillStyle = '#2b2622'; c.fillRect(-0.24, 0, 0.48, 0.05);
}, { ppu: 700 });
const broomA = () => cutoutAsset(K('broom'), (p) => poly(p, [[-0.012, 0.25], [-0.15, 0], [0.15, 0], [0.012, 0.25], [0.012, 1.0], [-0.012, 1.0]]), (c) => {
  c.fillStyle = '#c9a86a'; c.fillRect(-0.2, 0.25, 0.4, 0.8);
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 0.008; for (let x = -0.14; x <= 0.14; x += 0.025) { c.beginPath(); c.moveTo(0, 0.25); c.lineTo(x, 0); c.stroke(); }
  c.fillStyle = '#b08a4a'; c.beginPath(); poly(c, [[-0.012, 0.25], [-0.15, 0], [0.15, 0], [0.012, 0.25]]); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
}, { ppu: 700, t: 0.02 });
function buildKeeper() {
  const broom = new THREE.Group(); broom.position.set(0.24, 0.0, 0.05); broom.add(cutout(broomA()));
  const g = group(cutout(keeperA()), broom);
  g.userData.tick = (t) => { broom.rotation.z = 0.35 + Math.sin(t * 3.9) * 0.18; g.children[0].rotation.z = Math.sin(t * 3.9) * 0.02; };
  return g;
}
const emaA = () => cutoutAsset(K('ema'), (p) => poly(p, [[-0.42, 0], [-0.36, 0], [-0.36, 0.25], [0.36, 0.25], [0.36, 0], [0.42, 0], [0.42, 0.78], [0.5, 0.78], [0, 0.95], [-0.5, 0.78], [-0.42, 0.78]]), (c) => {
  c.fillStyle = '#6e4a2e'; c.fillRect(-0.6, 0, 1.2, 1);
  c.fillStyle = '#3b4a3a'; poly(c, [[0.5, 0.78], [0, 0.95], [-0.5, 0.78]]); c.fill();
  c.fillStyle = '#5a3a24'; c.fillRect(-0.4, 0.62, 0.8, 0.03);
  const plaque = (x: number, y: number, i: number) => {
    c.fillStyle = '#e2c393'; poly(c, [[x - 0.07, y - 0.07], [x + 0.07, y - 0.07], [x + 0.07, y + 0.04], [x, y + 0.08], [x - 0.07, y + 0.04]]); c.fill();
    c.strokeStyle = '#a37a4a'; c.lineWidth = 0.006; c.stroke();
    if (i % 3 === 0) { dab(c, x, y, 0.025, '#c4362f'); } else { c.fillStyle = '#3a2a1e'; c.fillRect(x - 0.04, y - 0.02, 0.08, 0.008); c.fillRect(x - 0.04, y - 0.045, 0.06, 0.008); }
  };
  let i = 0; for (const y of [0.53, 0.36]) for (let x = -0.3; x <= 0.31; x += 0.15) plaque(x + rand(-0.01, 0.01), y + rand(-0.01, 0.01), i++);
}, { ppu: 600 });
function foxOutlineReal(p: Pen) {
  p.moveTo(-0.12, 0); p.lineTo(0.14, 0); p.bezierCurveTo(0.17, 0.12, 0.13, 0.24, 0.09, 0.3); p.lineTo(0.13, 0.36); p.lineTo(0.12, 0.47); p.lineTo(0.07, 0.4);
  p.lineTo(-0.03, 0.4); p.lineTo(-0.07, 0.47); p.lineTo(-0.07, 0.36); p.bezierCurveTo(-0.1, 0.3, -0.16, 0.18, -0.12, 0); p.closePath();
}
const foxA = () => cutoutAsset(K('fox'), foxOutlineReal, (c) => {
  c.fillStyle = '#e07a2e'; c.fillRect(-0.3, 0, 0.6, 0.6);
  c.fillStyle = '#fbf3e6'; c.beginPath(); c.ellipse(0.02, 0.15, 0.07, 0.14, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0.03, 0.31, 0.06, 0.035, 0, 0, 7); c.fill();
  c.fillStyle = '#3b2a22'; c.fillRect(-0.12, 0, 0.26, 0.03); poly(c, [[0.12, 0.47], [0.1, 0.42], [0.125, 0.43]]); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#2a201a'; c.lineWidth = 0.01; [-0.01, 0.07].forEach((x) => { c.beginPath(); c.arc(x, 0.355, 0.012, 0.3, Math.PI - 0.3); c.stroke(); });
  dab(c, 0.03, 0.315, 0.009, '#2a201a');
}, { ppu: 900, t: 0.02 });
const foxTailA = () => cutoutAsset(K('foxTail'), (p) => { p.moveTo(0, 0); p.bezierCurveTo(-0.15, -0.02, -0.3, 0.05, -0.28, 0.2); p.bezierCurveTo(-0.22, 0.12, -0.1, 0.08, 0, 0.06); p.closePath(); }, (c) => {
  c.fillStyle = '#e07a2e'; c.fillRect(-0.35, -0.05, 0.4, 0.3); dab(c, -0.27, 0.18, 0.05, '#fbf3e6');
}, { ppu: 900, t: 0.02 });
function buildFox() {
  const tail = new THREE.Group(); tail.position.set(-0.1, 0.04, -0.006); tail.add(cutout(foxTailA()));
  const g = group(cutout(foxA()), tail);
  g.userData.tick = (t) => { tail.rotation.z = Math.sin(t * 1.4) * 0.18; };
  return g;
}

// ── the secret: a little jizo with a red bib and a knitted cap, hiding behind the shrine
const jizoA = () => cutoutAsset(K('jizo'), (p) => { p.moveTo(-0.13, 0); p.lineTo(0.13, 0); p.bezierCurveTo(0.16, 0.2, 0.13, 0.3, 0.1, 0.34); p.bezierCurveTo(0.14, 0.4, 0.12, 0.52, 0, 0.53); p.bezierCurveTo(-0.12, 0.52, -0.14, 0.4, -0.1, 0.34); p.bezierCurveTo(-0.13, 0.3, -0.16, 0.2, -0.13, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#a9a396'; c.fillRect(-0.2, 0, 0.4, 0.6);
  c.fillStyle = '#d3392b'; c.beginPath(); c.moveTo(-0.11, 0.33); c.lineTo(0.11, 0.33); c.lineTo(0.09, 0.2); c.lineTo(-0.09, 0.2); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, 0.49, 0.1, 0.05, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.53, 0.025, '#e8574a');
  c.lineCap = 'round'; c.strokeStyle = '#4a4540'; c.lineWidth = 0.008; [-0.035, 0.035].forEach((x) => { c.beginPath(); c.arc(x, 0.42, 0.015, 0.3, Math.PI - 0.3); c.stroke(); });
  c.beginPath(); c.arc(0, 0.385, 0.015, 0.4, Math.PI - 0.4); c.stroke();
}, { ppu: 900, t: 0.025 });
const buildJizo = () => group(cutout(jizoA()));

// ── ground: moss and fallen leaves, a gravel path to the shrine
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#8f9a55', light: '#b2b866', shade: '#6d7c46', tufts: [] });
  for (let i = 0; i < 26; i++) blob(c, rand(-W / 2, W / 2), rand(-D / 2, D / 2), rand(0.2, 0.5), pick(['#c98a3e', '#b4683a', '#d9a94a']), 0.35, 0.4);
  // gravel path
  c.fillStyle = '#cfc6b2'; c.beginPath(); rrect(c, -0.6, -2.5, 0.6, -SHRINE_Z + 0.6, 0.12); c.fill();
  c.strokeStyle = 'rgba(140,130,110,.5)'; c.lineWidth = 0.01;
  for (let y = -2.45; y < -SHRINE_Z + 0.55; y += 0.06) { c.beginPath(); c.moveTo(-0.56, y); for (let x = -0.56; x <= 0.56; x += 0.08) c.lineTo(x, y + Math.sin(x * 9 + y * 3) * 0.008); c.stroke(); }
  for (let i = 0; i < 500; i++) dab(c, rand(-0.56, 0.56), rand(-2.45, -SHRINE_Z + 0.55), rand(0.006, 0.014), pick(['#b4ab97', '#e2dbc9', '#9d9480']), 0.8);
  // stone slab in front of the shrine
  c.fillStyle = '#b3ae9f'; c.beginPath(); rrect(c, -1.1, -SHRINE_Z + 0.55, 1.1, -SHRINE_Z + 1.0, 0.06); c.fill();
  tufts(c, -W / 2, -D / 2, W, D, ['#6f7d40', '#8a9a4c', '#a7ad5c', '#5d6a38'], 1300, (x, y) => PATH(x, y) || (Math.abs(x) < 1.12 && y > -SHRINE_Z + 0.5 && y < -SHRINE_Z + 1.05));
  // fallen leaves: little five-pointed shapes
  for (let i = 0; i < 260; i++) {
    const x = rand(-W / 2 + 0.1, W / 2 - 0.1), y = rand(-D / 2 + 0.1, D / 2 - 0.1), r = rand(0.025, 0.045), a0 = rand(0, 6);
    if (PATH(x, y) && rnd() < 0.6) continue;
    c.fillStyle = pick(['#d4552f', '#ef8a3f', '#e8c23a', '#a5392b', '#f3cf6a']); c.beginPath();
    for (let k = 0; k <= 10; k++) { const a = a0 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.4 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.fill();
  }
  flowers(c, -W / 2 + 0.2, -D / 2 + 0.2, W - 0.4, D - 0.4, ['#f2f0e8', '#b9a7e0'], 26, (x, y) => PATH(x, y));
}

export const INARI: SceneDef = {
  id: 'inari',
  title: 'Kapliczka Inari',
  jp: '稲荷',
  season: 'jesień',
  blurb: 'Leśna kapliczka za rzędem czerwonych bram.',
  box: ['#b8432c', '#e39a3c'],
  seed: 1117,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#7d8a48', '#a7ad5c'] },
  sky: {
    day: { grad: [[0, '#3a7cc4'], [0.45, '#86b8e0'], [0.8, '#e6d8b8'], [1, '#f6e7c8']], cloud: '#fff8ea', hi: '#ffffff', edge: '#fff8ea', shadow: '#c9b8c8' },
    evening: { grad: [[0, '#1c1f4a'], [0.4, '#55407a'], [0.72, '#d9704e'], [1, '#ffbf7a']], cloud: '#f09a78', hi: '#ffd2a8', edge: '#f09a78', shadow: '#7a5a8e', stars: true },
  },
  light: {
    day: { sky: '#ffeccc', ground: '#8a7a50', hemi: 1.1, sun: '#ffd9a0', sunI: 2.7, sunPos: [6, 6, 4], bloom: 0.03 },
    evening: { sky: '#8a7ab0', ground: '#4a3a30', hemi: 0.75, sun: '#ff8a50', sunI: 0.6, sunPos: [-6, 2.4, 3], bloom: 0.8 },
  },
  steps: [
    { name: 'Las', jp: '森', pieces: ['forest', 'maple', 'ginkgo'] },
    { name: 'Kapliczka', jp: '祠', pieces: ['shrine', 'roof', 'saisen'] },
    { name: 'Bramy torii', jp: '鳥居', pieces: ['toriiA', 'toriiB', 'toriiC'] },
    { name: 'Strażnicy', jp: '狐', pieces: ['toroL', 'toroR', 'kitsuneL', 'kitsuneR'] },
    { name: 'Życie', jp: '暮らし', pieces: ['keeper', 'ema', 'fox'] },
  ],
  pieces: {
    forest: { name: 'Las', pos: [0, 0, -2.42], build: () => group(cutout(forestA())), sound: 'leaves' },
    maple: { name: 'Klon', pos: [-2.3, 0, -1.25], build: () => crossed(mapleA) },
    ginkgo: { name: 'Miłorząb', pos: [2.35, 0, -1.5], build: () => crossed(ginkgoA), sound: 'crow' },
    shrine: { name: 'Kapliczka', pos: [0, 0, SHRINE_Z], build: buildShrine, sound: 'suzu' },
    roof: { name: 'Dach', pos: [0, 1.25 + 0.46, SHRINE_Z], build: buildShrineRoof },
    saisen: { name: 'Skrzynka', pos: [0, 0.12, SHRINE_Z + 0.95], build: buildSaisen },
    toriiA: { name: 'Torii', pos: [0, 0, 1.75], build: () => group(cutout(toriiA())) },
    toriiB: { name: 'Torii', pos: [0, 0, 1.0], build: () => group(cutout(toriiA())) },
    toriiC: { name: 'Torii', pos: [0, 0, 0.25], build: () => group(cutout(toriiA())) },
    toroL: { name: 'Latarnia', pos: [-1.25, 0, 0.55], build: buildToro, sound: 'crickets' },
    toroR: { name: 'Latarnia', pos: [1.25, 0, 0.55], build: buildToro },
    kitsuneL: { name: 'Lis', pos: [-0.95, 0, -0.45], rotY: 0.3, build: buildStoneFox(1) },
    kitsuneR: { name: 'Lis', pos: [0.95, 0, -0.45], rotY: -0.3, build: buildStoneFox(-1) },
    keeper: { name: 'Strażnik', pos: [-1.55, 0, 1.6], rotY: 0.3, build: buildKeeper, sound: 'sweep' },
    ema: { name: 'Tabliczki', pos: [1.75, 0, 0.05], rotY: -0.35, build: () => group(cutout(emaA())) },
    fox: { name: 'Lisek', pos: [1.35, 0, 1.75], rotY: -0.4, build: buildFox },
  },
  secret: { name: 'jizō w czerwonej czapeczce', build: buildJizo, pos: [0.25, 0, -2.08], rotY: 0.15 },
  setup(ctx) {
    const { fx, scene } = ctx;
    const lights = [-1.25, 1.25].map((x) => { const l = new THREE.PointLight('#ffb060', 0, 3.5, 1.5); l.position.set(x, 0.72, 0.95); scene.add(l); return l; });
    const shrineGlow = new THREE.PointLight('#ffd08a', 0, 3, 1.5); shrineGlow.position.set(0, 0.9, SHRINE_Z + 0.9); scene.add(shrineGlow);
    const leaves = fx.emitter(0, () => {
      const left = rnd() < 0.55, x = left ? -2.3 : 2.35, z = left ? -1.25 : -1.5;
      fx.leaf(new V3(x + rand(-0.9, 0.9), rand(1.5, 2.9), z + rand(-0.6, 0.6)), left ? pick(['#e0582f', '#c93b2a', '#f08a3c']) : pick(['#f0c63a', '#e8b02a']));
    });
    const wisps = fx.emitter(0, () => fx.firefly(new V3(rand(-1.4, 1.4), rand(0.5, 1.6), SHRINE_Z + rand(-0.2, 1.4)), '#7fd6ff'));
    const alive = () => { leaves.rate = 1.6; };
    return {
      placed(id) { if (id === 'maple' || id === 'ginkgo') leaves.rate = 0.6; },
      finale: alive, alive,
      update(_dt, _t, c) {
        const e = c.evening;
        fireMat().emissiveIntensity = e * 0.9;
        lights[0].intensity = (c.placed.has('toroL') ? e : 0) * 2.2; lights[1].intensity = (c.placed.has('toroR') ? e : 0) * 2.2;
        shrineGlow.intensity = (c.done ? e : 0) * 3;
        wisps.rate = c.done ? e * 2.2 : 0;
      },
    };
  },
};
