// Scene 4: a neighbourhood bathhouse (sento) on a snowy winter evening. A tall chimney, warm frosted windows,
// a snowman by the path. Finale: thick snowfall, steam pouring from the chimney, the bath hall glowing.
import * as THREE from 'three';
import { blob, dab, JPG, meadow, mottle, poly, rrect, soft, text, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { mix, pick, rand, rnd } from '../core/util';
import { boardMat, cutout, cutoutAsset, foldBox, gableRoof, group, latheMat, plainM } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'sento:' + s;
const BX = 0.2, BZ = -0.95, BW = 2.6, BD = 1.4, BH = 1.25;
const PATH = (x: number, y: number) => x > -0.45 && x < 0.85 && y > -2.5 && y < -BZ - BD / 2 + 0.05; // ground coords (y = -z)

// ── backdrop: snowy mountains over a dark pine band
const peaks = (x: number) => 1.3 + 0.55 * Math.max(0, 1 - Math.abs(x + 1.4) / 1.5) ** 1.2 + 0.85 * Math.max(0, 1 - Math.abs(x - 1.2) / 1.7) ** 1.1 + 0.1 * Math.sin(x * 3);
function mountOutline(p: Pen) { p.moveTo(-3.1, 0); for (let i = 0; i <= 100; i++) { const x = -3.1 + (6.2 * i) / 100; p.lineTo(x, peaks(x)); } p.lineTo(3.1, 0); p.closePath(); }
const mountA = () => cutoutAsset(K('mount'), mountOutline, (c) => {
  const g = c.createLinearGradient(0, 2.4, 0, 0); g.addColorStop(0, '#dfe8f2'); g.addColorStop(1, '#a9bdd4'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.6);
  // shaded right faces of the peaks
  c.fillStyle = 'rgba(110,135,175,.35)';
  [[-1.4, 1.85], [1.2, 2.15]].forEach(([px, py]) => { c.beginPath(); poly(c, [[px, py], [px + 1.6, 0.9], [px + 0.3, 0.9]]); c.fill(); });
  // dark pine forest band with snowy tips
  for (let x = -3.2; x < 3.2; x += rand(0.07, 0.11)) {
    const h = rand(0.25, 0.45), y0 = 0.55 + 0.1 * Math.sin(x * 2.3);
    c.fillStyle = mix('#2f4a4a', '#1f3434', rnd()); c.beginPath(); poly(c, [[x, y0 + h], [x - h * 0.28, y0], [x + h * 0.28, y0]]); c.fill();
    c.fillStyle = '#eef3f8'; c.beginPath(); poly(c, [[x, y0 + h], [x - h * 0.1, y0 + h * 0.65], [x + h * 0.08, y0 + h * 0.7]]); c.fill();
  }
  c.fillStyle = '#e4ebf3'; c.fillRect(-3.2, 0, 6.4, 0.58);
  for (let i = 0; i < 30; i++) blob(c, rand(-3.2, 3.2), rand(0.4, 0.6), rand(0.08, 0.2), '#f6f9fc', 0.8, 0.3);
}, { ppu: 170, ink: 0 });

// ── backdrop: snowy houses with lit windows
const HOUSES = [[-3.0, -2.2, 0.9], [-2.05, -1.25, 1.1], [-1.1, -0.45, 0.8], [1.35, 2.1, 0.95], [2.25, 3.0, 0.8]];
function housesOutline(p: Pen) {
  p.moveTo(-3.05, 0); p.lineTo(-3.05, 0.25);
  for (const [x0, x1, h] of HOUSES) { const m = (x0 + x1) / 2; p.lineTo(x0, 0.25); p.lineTo(x0, h); p.lineTo(x0 - 0.07, h - 0.03); p.lineTo(m, h + 0.32); p.lineTo(x1 + 0.07, h - 0.03); p.lineTo(x1, h); p.lineTo(x1, 0.25); }
  p.lineTo(3.05, 0.25); p.lineTo(3.05, 0); p.closePath();
}
const housesA = () => cutoutAsset(K('houses'), housesOutline, (c) => {
  c.fillStyle = '#c7cdd6'; c.fillRect(-3.1, 0, 6.2, 0.27);
  for (const [x0, x1, h] of HOUSES) {
    const m = (x0 + x1) / 2, w = x1 - x0;
    c.fillStyle = pick(['#8a6a52', '#7a5c48', '#9a7a5e']); c.fillRect(x0, 0.25, w, h - 0.25);
    c.fillStyle = 'rgba(40,40,70,.25)'; c.fillRect(x1 - w * 0.3, 0.25, w * 0.3, h - 0.25);
    [[m - w * 0.22, h * 0.62], [m + w * 0.2, h * 0.62]].forEach(([x, y]) => { c.fillStyle = '#f2dfae'; c.fillRect(x - 0.07, y - 0.06, 0.14, 0.12); c.strokeStyle = '#4a382c'; c.lineWidth = 0.01; c.strokeRect(x - 0.07, y - 0.06, 0.14, 0.12); });
    c.fillStyle = '#3e4658'; c.beginPath(); poly(c, [[x0 - 0.07, h - 0.03], [m, h + 0.32], [x1 + 0.07, h - 0.03]]); c.fill();
    c.fillStyle = '#f4f7fb'; c.beginPath(); c.moveTo(x0 - 0.07, h); c.lineTo(m, h + 0.33); c.lineTo(x1 + 0.07, h);
    for (let x = x1 + 0.05; x > x0 - 0.06; x -= 0.06) c.lineTo(x, h + 0.04 + rand(-0.015, 0.015)); c.closePath(); c.fill();
    c.fillStyle = '#c9d6e8'; c.beginPath(); poly(c, [[m, h + 0.33], [x1 + 0.07, h], [m + 0.05, h + 0.05]]); c.fill();
  }
  c.fillStyle = '#eef3f8'; c.fillRect(-3.1, 0.22, 6.2, 0.06);
}, { ppu: 200, ink: 0, emissive: (c) => {
  for (const [x0, x1, h] of HOUSES) { const m = (x0 + x1) / 2, w = x1 - x0; [[m - w * 0.22, h * 0.62], [m + w * 0.2, h * 0.62]].forEach(([x, y]) => { soft(c, x, y, 0.16, '#ffb060', 0.5); c.fillStyle = '#ffd38a'; c.fillRect(x - 0.07, y - 0.06, 0.14, 0.12); }); }
} });

// ── chimney with the bath mark
const chimneyMat = () => latheMat(K('chimney'), 256, 512, (c, w, h) => {
  c.fillStyle = '#b6654a'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 10) { c.fillStyle = 'rgba(80,30,20,.25)'; c.fillRect(0, y, w, 2); for (let x = (y / 10) % 2 ? 0 : 12; x < w; x += 24) c.fillRect(x, y, 2, 10); }
  c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, 26);
  c.fillStyle = '#f6efe2'; c.fillRect(w * 0.38, 70, w * 0.24, 150); text(c, 'ゆ', w * 0.5, 145, 54, '#c4362f', { font: JPG });
  c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(0, 30, w, 12);
});
function buildChimney() {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 3.1, 20, 1, true), chimneyMat()); body.position.y = 1.55; body.rotation.y = Math.PI;
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20), plainM(K('lip'), '#2a2420')); lip.position.y = 3.1;
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), plainM(K('foot'), '#8f8a82')); foot.position.y = 0.15;
  return group(body, lip, foot);
}

// ── the bathhouse
const frontMat = () => boardMat(K('front'), BW, BH, (c, W, H) => {
  c.fillStyle = '#efe6d4'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(0, H * 0.55); wood(c, W, H * 0.45, '#6b4a34', { dir: 'v', plank: 0.12 }); c.restore();
  c.fillStyle = '#efe6d4'; c.fillRect(0, 0, W, H * 0.55);
  c.fillStyle = '#4a3426'; c.fillRect(0, H * 0.53, W, 0.04); c.fillRect(0, 0, W, 0.05);
  // frosted windows
  [[0.25, 0.14], [0.62, 0.14], [1.78, 0.14], [2.15, 0.14]].forEach(([x, y]) => {
    c.fillStyle = '#f3e3bf'; c.fillRect(x, y, 0.28, 0.3); c.strokeStyle = '#4a3426'; c.lineWidth = 0.02; c.strokeRect(x, y, 0.28, 0.3);
    c.lineWidth = 0.008; c.beginPath(); c.moveTo(x + 0.14, y); c.lineTo(x + 0.14, y + 0.3); c.moveTo(x, y + 0.15); c.lineTo(x + 0.28, y + 0.15); c.stroke();
  });
  // entrance: sliding glass doors under a sign
  c.fillStyle = '#3a2a1e'; c.fillRect(1.0, 0.45, 0.6, H - 0.45);
  c.fillStyle = '#f2d9a8'; [1.04, 1.31].forEach((x) => { c.fillRect(x, 0.52, 0.25, H - 0.6); });
  c.strokeStyle = '#3a2a1e'; c.lineWidth = 0.01; for (let y = 0.6; y < H - 0.1; y += 0.1) { c.beginPath(); c.moveTo(1.04, y); c.lineTo(1.56, y); c.stroke(); }
  c.fillStyle = '#2f241c'; c.fillRect(0.92, 0.22, 0.76, 0.2); text(c, '松の湯', 1.3, 0.32, 0.12, '#f3e6c6');
}, {
  ppu: 300, emissive: (c, _W, H) => {
    [[0.25, 0.14], [0.62, 0.14], [1.78, 0.14], [2.15, 0.14]].forEach(([x, y]) => { c.fillStyle = '#ffcf8a'; c.fillRect(x, y, 0.28, 0.3); });
    c.fillStyle = '#ffd59a'; [1.04, 1.31].forEach((x) => c.fillRect(x, 0.52, 0.25, H - 0.6));
  },
});
const sideMat = () => boardMat(K('side'), BD, BH, (c, W, H) => {
  c.fillStyle = '#efe6d4'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(0, H * 0.55); wood(c, W, H * 0.45, '#6b4a34', { dir: 'v', plank: 0.12 }); c.restore();
  c.fillStyle = '#4a3426'; c.fillRect(0, H * 0.53, W, 0.04); c.fillRect(0, 0, W, 0.05);
  c.fillStyle = '#f3e3bf'; c.fillRect(0.5, 0.16, 0.4, 0.28); c.strokeStyle = '#4a3426'; c.lineWidth = 0.02; c.strokeRect(0.5, 0.16, 0.4, 0.28);
  mottle(c, 0, H * 0.85, W, H * 0.15, ['#e9eef4', '#f7f9fb'], 10, [0.04, 0.09], 0.8);
}, { ppu: 300, emissive: (c) => { c.fillStyle = '#ffcf8a'; c.fillRect(0.5, 0.16, 0.4, 0.28); } });
const backMat = () => boardMat(K('back'), BW, BH, (c, W, H) => { c.fillStyle = '#e6dcc8'; c.fillRect(0, 0, W, H); c.save(); c.translate(0, H * 0.55); wood(c, W, H * 0.45, '#6b4a34', { dir: 'v', plank: 0.12 }); c.restore(); });
const buildHouse = () => { const s = sideMat(); return foldBox({ w: BW, d: BD, h: BH, top: plainM(K('btop'), '#5a5048'), front: frontMat(), back: backMat(), left: s, right: s }); };
const snowRoofMat = (key: string, W: number, H: number) => boardMat(K(key), W, H, (c, w, h) => {
  c.fillStyle = '#3e4658'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 0.1) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, 0, 0.05, h); }
  // snow blanket from the ridge down, wavy edge above the eave
  c.fillStyle = '#f4f7fb'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
  for (let x = w; x >= 0; x -= 0.05) c.lineTo(x, h * 0.78 + Math.sin(x * 13) * 0.03 + rand(-0.01, 0.01));
  c.closePath(); c.fill();
  for (let i = 0; i < 18; i++) blob(c, rand(0, w), rand(0.1, h * 0.7), rand(0.05, 0.14), '#d6e0ee', 0.5, 0.3);
  c.fillStyle = '#d0dbea'; c.fillRect(0, 0, w, 0.04);
}, { ppu: 280 });
const buildRoof = () => gableRoof({ w: 2.95, l: 0.95, angle: 0.5, top: snowRoofMat('roof', 2.95, 0.95), under: plainM(K('under'), '#4a3a30'), ridge: plainM(K('ridge'), '#e9eef4') });
function buildPorch() {
  const roof = gableRoof({ w: 0.7, l: 0.45, angle: 0.55, top: snowRoofMat('porch', 0.7, 0.45), under: plainM(K('under'), '#4a3a30'), ridge: plainM(K('ridge'), '#e9eef4') });
  roof.rotation.y = Math.PI / 2; roof.position.set(0, 1.12, 0);
  const post = plainM(K('post'), '#5a4030');
  const g = group(roof);
  [-0.36, 0.36].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), post); p.position.set(x, 0.5, 0.3); g.add(p); });
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  return g;
}

// ── the lane
const norenA = (col: string, key: string) => cutoutAsset(K(key), (p) => poly(p, [[-0.15, -0.42], [0.15, -0.42], [0.15, 0.02], [-0.15, 0.02]]), (c) => {
  c.fillStyle = col; c.fillRect(-0.3, -0.5, 0.6, 0.6);
  c.fillStyle = mix(col, '#000000', 0.25); c.fillRect(-0.3, -0.04, 0.6, 0.06);
  dab(c, 0, -0.22, 0.1, '#f6efe2'); text(c, 'ゆ', 0, -0.22, 0.14, col, { font: JPG });
}, { ppu: 500, t: 0.012, ink: 0.012 });
function buildNoren() {
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), plainM(K('rod'), '#3a2a1e')); rod.rotation.z = Math.PI / 2;
  const g = group(rod);
  const pv = [['#2f5f9a', 'norenM', -0.16], ['#c4453a', 'norenF', 0.16]].map(([col, key, x]) => { const p = new THREE.Group(); p.position.x = x as number; p.add(cutout(norenA(col as string, key as string))); g.add(p); return p; });
  g.userData.tick = (t) => pv.forEach((p, i) => { p.rotation.x = -0.02 + Math.sin(t * 1.5 + i) * 0.04; });
  return g;
}
const lampA = () => cutoutAsset(K('lamp'), (p) => poly(p, [[-0.04, 0], [0.04, 0], [0.035, 1.55], [0.13, 1.55], [0.13, 1.85], [0.09, 1.92], [-0.09, 1.92], [-0.13, 1.85], [-0.13, 1.55], [-0.035, 1.55]]), (c) => {
  c.fillStyle = '#2f3438'; c.fillRect(-0.2, 0, 0.4, 2);
  c.fillStyle = '#f3e3bf'; c.fillRect(-0.1, 1.58, 0.2, 0.25); c.strokeStyle = '#2f3438'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(0, 1.58); c.lineTo(0, 1.83); c.stroke();
  c.fillStyle = '#f4f7fb'; c.fillRect(-0.14, 1.86, 0.28, 0.06);
}, { ppu: 400, emissive: (c) => { soft(c, 0, 1.7, 0.25, '#ffc070', 0.6); c.fillStyle = '#ffe0a0'; c.fillRect(-0.1, 1.58, 0.2, 0.25); } });
const woodA = () => cutoutAsset(K('wood'), (p) => poly(p, [[-0.5, 0], [0.5, 0], [0.5, 0.6], [0.6, 0.6], [0.52, 0.72], [-0.52, 0.72], [-0.6, 0.6], [-0.5, 0.6]]), (c) => {
  c.fillStyle = '#4a3426'; c.fillRect(-0.7, 0, 1.4, 0.8);
  for (let y = 0.07; y < 0.58; y += 0.11) for (let x = -0.44 + ((y * 10) % 2) * 0.05; x < 0.46; x += 0.11) { dab(c, x, y, 0.052, '#b0784a'); dab(c, x, y, 0.035, '#d9a76c'); c.strokeStyle = '#9a6640'; c.lineWidth = 0.004; c.beginPath(); c.arc(x, y, 0.02, 0, 7); c.stroke(); }
  c.fillStyle = '#f4f7fb'; c.beginPath(); c.moveTo(-0.62, 0.6); c.lineTo(0.62, 0.6); c.lineTo(0.52, 0.74); c.lineTo(-0.52, 0.74); c.closePath(); c.fill();
}, { ppu: 400 });

// ── winter things
const pineA = () => cutoutAsset(K('pine'), (p) => poly(p, [[0.07, 0], [0.07, 0.3], [0.62, 0.3], [0.25, 0.85], [0.5, 0.85], [0.16, 1.4], [0.36, 1.4], [0, 2.0], [-0.36, 1.4], [-0.16, 1.4], [-0.5, 0.85], [-0.25, 0.85], [-0.62, 0.3], [-0.07, 0.3], [-0.07, 0]]), (c) => {
  c.fillStyle = '#5a4030'; c.fillRect(-0.1, 0, 0.2, 0.4);
  [[0.3, 0.62, 0.85], [0.85, 0.5, 1.4], [1.4, 0.36, 2.0]].forEach(([y0, w, y1]) => {
    c.fillStyle = '#2f5a46'; c.beginPath(); poly(c, [[-w, y0], [w, y0], [0, y1 + 0.02]]); c.fill();
    c.fillStyle = '#3f7258'; c.beginPath(); poly(c, [[-w * 0.85, y0 + 0.02], [-w * 0.05, y0 + 0.02], [-0.02, y1]]); c.fill();
    c.fillStyle = '#f4f7fb'; c.beginPath(); c.moveTo(-w * 0.95, y0 + 0.02);
    for (let x = -w * 0.95; x <= w * 0.95; x += 0.05) c.lineTo(x, y0 + 0.07 + Math.abs(Math.sin(x * 14)) * 0.05);
    c.lineTo(w * 0.95, y0 + 0.02); c.closePath(); c.fill();
    c.beginPath(); poly(c, [[0, y1 + 0.02], [-w * 0.3, y1 - (y1 - y0) * 0.35], [w * 0.25, y1 - (y1 - y0) * 0.3]]); c.fill();
  });
}, { ppu: 320, t: 0.03 });
function snowmanOutline(p: Pen) {
  const pts: number[][] = [];
  for (let a = -50; a <= 230; a += 8) { const r = (a * Math.PI) / 180; pts.push([0.17 * Math.cos(r), 0.6 + 0.17 * Math.sin(r)]); }
  for (let a = 125; a <= 415; a += 8) { const r = (a * Math.PI) / 180; pts.push([0.25 * Math.cos(r), 0.25 + 0.25 * Math.sin(r)]); }
  poly(p, pts);
}
const snowmanA = () => cutoutAsset(K('snowman'), snowmanOutline, (c) => {
  c.fillStyle = '#fbfdff'; c.fillRect(-0.3, 0, 0.6, 0.8);
  c.fillStyle = '#d6e0ee'; c.beginPath(); c.ellipse(0.1, 0.22, 0.17, 0.22, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0.08, 0.57, 0.1, 0.13, 0, 0, 7); c.fill();
  c.fillStyle = '#c4362f'; c.fillRect(-0.18, 0.44, 0.36, 0.06); c.fillRect(0.06, 0.3, 0.06, 0.16);
  c.beginPath(); c.ellipse(0, 0.73, 0.15, 0.06, 0, 0, Math.PI, true); c.fill(); dab(c, 0, 0.78, 0.03, '#e8574a');
  dab(c, -0.055, 0.63, 0.016, '#2a2420'); dab(c, 0.055, 0.63, 0.016, '#2a2420');
  c.fillStyle = '#e8873a'; c.beginPath(); poly(c, [[0, 0.6], [0.11, 0.585], [0, 0.575]]); c.fill();
  [0.3, 0.2, 0.1].forEach((y) => dab(c, 0, y, 0.018, '#2a2420'));
}, { ppu: 700 });

// ── people and the cat
function personOutline(h: number, w: number, bump = 0) {
  return (p: Pen) => {
    p.moveTo(-w, 0); p.lineTo(w, 0); p.lineTo(w * 0.9, h * 0.55); p.bezierCurveTo(w * 1.05, h * 0.7, w * 0.95, h * 0.78, w * 0.55, h * 0.8);
    p.bezierCurveTo(w * 0.8, h * 0.88, w * 0.75, h * 1.0, 0, h * 1.0 + bump); p.bezierCurveTo(-w * 0.75, h * 1.0, -w * 0.8, h * 0.88, -w * 0.55, h * 0.8);
    p.bezierCurveTo(-w * 0.95, h * 0.78, -w * 1.05, h * 0.7, -w * 0.9, h * 0.55); p.closePath();
  };
}
const grandpaA = () => cutoutAsset(K('grandpa'), personOutline(1.05, 0.22), (c) => {
  c.fillStyle = '#6b4a3a'; c.fillRect(-0.3, 0, 0.6, 0.86);
  c.strokeStyle = '#5a3c2e'; c.lineWidth = 0.01; for (let y = 0.1; y < 0.8; y += 0.08) { c.beginPath(); c.moveTo(-0.25, y); c.lineTo(0.25, y + 0.02); c.stroke(); }
  c.fillStyle = '#2f3a4a'; c.fillRect(-0.3, 0, 0.6, 0.12);
  c.fillStyle = '#f6f2ea'; c.beginPath(); poly(c, [[-0.2, 0.84], [-0.05, 0.84], [0.05, 0.5], [-0.06, 0.48]]); c.fill(); // towel
  c.fillStyle = '#c99a5e'; c.beginPath(); c.ellipse(0.15, 0.42, 0.12, 0.08, 0, 0, 7); c.fill(); c.strokeStyle = '#8a6438'; c.lineWidth = 0.012; c.stroke(); // bucket
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.92, 0.12, 0.12, 0, 0, 7); c.fill();
  c.fillStyle = '#bdb6aa'; c.beginPath(); c.ellipse(0, 1.0, 0.12, 0.05, 0, 0, 7); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#3b2f28'; c.lineWidth = 0.012; [-0.045, 0.045].forEach((x) => { c.beginPath(); c.arc(x, 0.93, 0.018, 0.3, Math.PI - 0.3); c.stroke(); });
  soft(c, -0.07, 0.89, 0.03, '#f08a7a', 0.6); soft(c, 0.07, 0.89, 0.03, '#f08a7a', 0.6);
}, { ppu: 700 });
const kidA = () => cutoutAsset(K('kid'), personOutline(0.72, 0.16, 0.08), (c) => {
  c.fillStyle = '#d9483b'; c.fillRect(-0.25, 0, 0.5, 0.58); c.fillStyle = '#2f3a4a'; c.fillRect(-0.25, 0, 0.5, 0.1);
  c.fillStyle = '#f2c94c'; c.fillRect(-0.16, 0.5, 0.32, 0.06);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.65, 0.09, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = '#3f6fb0'; c.beginPath(); c.ellipse(0, 0.72, 0.1, 0.06, 0, Math.PI, 0, true); c.fill(); c.fillRect(-0.1, 0.7, 0.2, 0.03); dab(c, 0, 0.78, 0.035, '#f6f2ea');
  dab(c, -0.03, 0.65, 0.008, '#2a201a'); dab(c, 0.03, 0.65, 0.008, '#2a201a'); soft(c, -0.05, 0.62, 0.02, '#f08a7a', 0.7); soft(c, 0.05, 0.62, 0.02, '#f08a7a', 0.7);
}, { ppu: 800 });
const catA = () => cutoutAsset(K('cat'), (p) => { p.moveTo(-0.2, 0); p.lineTo(0.2, 0); p.bezierCurveTo(0.24, 0.08, 0.2, 0.16, 0.12, 0.17); p.lineTo(0.13, 0.24); p.lineTo(0.08, 0.2); p.lineTo(0.02, 0.2); p.lineTo(-0.01, 0.25); p.lineTo(-0.02, 0.17); p.bezierCurveTo(-0.12, 0.17, -0.24, 0.12, -0.2, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#8f949c'; c.fillRect(-0.3, 0, 0.6, 0.3); c.strokeStyle = '#6f747c'; c.lineWidth = 0.012; [-0.12, -0.05, 0.02].forEach((x) => { c.beginPath(); c.moveTo(x, 0.16); c.lineTo(x + 0.02, 0.05); c.stroke(); });
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; [0.03, 0.09].forEach((x) => { c.beginPath(); c.arc(x, 0.14, 0.012, 0.3, Math.PI - 0.3); c.stroke(); });
}, { ppu: 1000, t: 0.02 });
function buildCat() { const m = cutout(catA()), g = group(m); g.userData.tick = (t) => { m.scale.y = 1 + Math.sin(t * 1.8) * 0.02; }; return g; }

// ── secret: a snow bunny (yuki usagi) behind the bathhouse
const bunnyA = () => cutoutAsset(K('bunny'), (p) => { p.moveTo(-0.16, 0); p.lineTo(0.16, 0); p.bezierCurveTo(0.18, 0.1, 0.1, 0.15, 0.04, 0.15); p.lineTo(0.08, 0.28); p.lineTo(0.02, 0.16); p.lineTo(-0.02, 0.16); p.lineTo(-0.06, 0.29); p.lineTo(-0.06, 0.15); p.bezierCurveTo(-0.14, 0.14, -0.18, 0.1, -0.16, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#fbfdff'; c.fillRect(-0.2, 0, 0.4, 0.35); c.fillStyle = '#d6e0ee'; c.beginPath(); c.ellipse(0.05, 0.04, 0.12, 0.05, 0, 0, 7); c.fill();
  c.fillStyle = '#4f8a3a'; c.beginPath(); poly(c, [[0.03, 0.15], [0.08, 0.28], [0.06, 0.16]]); c.fill(); c.beginPath(); poly(c, [[-0.03, 0.15], [-0.06, 0.29], [-0.05, 0.15]]); c.fill();
  dab(c, -0.05, 0.1, 0.014, '#d3392b'); dab(c, 0.03, 0.1, 0.014, '#d3392b');
}, { ppu: 1000, t: 0.02 });

// ── ground: snow with blue shadows, a cleared stone path
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#eef2f7', light: '#ffffff', shade: '#d3dceb', tufts: [] });
  c.fillStyle = '#9aa0a8'; c.beginPath(); rrect(c, -0.45, -2.6, 0.85, -BZ - BD / 2 + 0.05, 0.1); c.fill();
  for (let y = -2.55; y < -BZ - BD / 2; y += 0.22) for (let x = -0.42 + rnd() * 0.08; x < 0.82;) { const w = rand(0.18, 0.3); c.fillStyle = pick(['#b3b8c0', '#a7acb4', '#bec3ca']); c.beginPath(); rrect(c, x + 0.015, y + 0.015, Math.min(0.82, x + w) - 0.015, y + 0.2, 0.04); c.fill(); x += w; }
  // snow drifts over the path edges and footprints beside it
  for (let y = -2.5; y < -BZ - BD / 2; y += 0.08) { blob(c, -0.45 + rand(-0.03, 0.05), y, rand(0.05, 0.09), '#f4f7fb', 1, 0.3); blob(c, 0.85 + rand(-0.05, 0.03), y, rand(0.05, 0.09), '#f4f7fb', 1, 0.3); }
  for (let y = -2.3; y < 1.0; y += 0.16) { dab(c, -0.7 + Math.sin(y * 2) * 0.05, y, 0.025, '#c7d1e1'); dab(c, -0.62 + Math.sin(y * 2) * 0.05, y + 0.08, 0.025, '#c7d1e1'); }
  tufts(c, -W / 2, -D / 2, W, D, ['#a89a7a', '#8f8468', '#c2b48c'], 160, (x, y) => PATH(x, y) || rnd() < 0.5, 0.8);
  mottle(c, -W / 2, -D / 2, W, D, ['#ffffff', '#e2e9f3'], 40, [0.08, 0.2], 0.5);
}

export const SENTO: SceneDef = {
  id: 'sento',
  title: 'Łaźnia zimą',
  jp: '銭湯',
  season: 'zima',
  blurb: 'Osiedlowa łaźnia z kominem w śnieżny wieczór.',
  box: ['#3f5a8a', '#8fb0d8'],
  seed: 2024,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#e8eef5', '#ffffff'] },
  sky: {
    day: { grad: [[0, '#7fa6cf'], [0.5, '#b4cbe0'], [1, '#e8eef2']], cloud: '#f2f5f8', hi: '#ffffff', edge: '#f2f5f8', shadow: '#aebbd0' },
    evening: { grad: [[0, '#121a3a'], [0.45, '#2e3c6c'], [0.8, '#6c6f9c'], [1, '#d4a3a4']], cloud: '#4a5584', hi: '#6c78a8', edge: '#4a5584', shadow: '#2c3460', stars: true },
  },
  light: {
    day: { sky: '#e6eefc', ground: '#b8c0cc', hemi: 1.25, sun: '#fff4e6', sunI: 2.2, sunPos: [4, 7, 5], bloom: 0.03 },
    evening: { sky: '#6070a8', ground: '#2c3244', hemi: 0.85, sun: '#9fb4e0', sunI: 0.4, sunPos: [-4, 5, 3], bloom: 0.85 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['mount', 'houses', 'chimney'] },
    { name: 'Łaźnia', jp: '銭湯', pieces: ['house', 'roof', 'porch'] },
    { name: 'Uliczka', jp: '路地', pieces: ['noren', 'lamp', 'wood'] },
    { name: 'Zima', jp: '冬', pieces: ['pine', 'snowman'] },
    { name: 'Życie', jp: '暮らし', pieces: ['grandpa', 'kid', 'cat'] },
  ],
  pieces: {
    mount: { name: 'Góry', pos: [0, 0, -2.42], build: () => group(cutout(mountA())), sound: 'wind' },
    houses: { name: 'Domy', pos: [0, 0, -2.2], build: () => group(cutout(housesA())) },
    chimney: { name: 'Komin', pos: [1.95, 0, -1.95], build: buildChimney },
    house: { name: 'Łaźnia', pos: [BX, 0, BZ], build: buildHouse, sound: 'onsen' },
    roof: { name: 'Dach', pos: [BX, BH + 0.95 * Math.sin(0.5), BZ], build: buildRoof },
    porch: { name: 'Daszek', pos: [BX + 0.1, 0, BZ + BD / 2], build: buildPorch },
    noren: { name: 'Noren', pos: [BX + 0.1, 1.02, BZ + BD / 2 + 0.33], build: buildNoren },
    lamp: { name: 'Latarnia', pos: [-1.9, 0, 0.75], build: () => group(cutout(lampA())) },
    wood: { name: 'Drewno', pos: [1.95, 0, -0.35], rotY: -0.2, build: () => group(cutout(woodA())) },
    pine: { name: 'Sosna', pos: [-2.35, 0, -1.2], build: () => { const a = cutout(pineA()), b = cutout(pineA()); b.rotation.y = Math.PI / 2; return group(a, b); } },
    snowman: { name: 'Bałwan', pos: [-1.25, 0, 1.25], rotY: 0.2, build: () => group(cutout(snowmanA())) },
    grandpa: { name: 'Dziadek', pos: [0.95, 0, 0.75], rotY: -0.25, build: () => group(cutout(grandpaA())) },
    kid: { name: 'Dziecko', pos: [-0.55, 0, 1.5], rotY: 0.15, build: () => group(cutout(kidA())) },
    cat: { name: 'Kot', pos: [1.95, 0.74, -0.35], rotY: -0.2, build: buildCat },
  },
  secret: { name: 'śnieżny królik', build: () => group(cutout(bunnyA())), pos: [-0.9, 0, -1.95], rotY: 0.2 },
  sounds: [],
  setup(ctx) {
    const { fx, scene } = ctx;
    const lamp = new THREE.PointLight('#ffc070', 0, 4, 1.5); lamp.position.set(-1.9, 1.7, 1.05);
    const door = new THREE.PointLight('#ffcf8a', 0, 4, 1.5); door.position.set(BX + 0.1, 0.7, BZ + BD / 2 + 0.6);
    scene.add(lamp, door);
    const snow = fx.emitter(2.5, () => fx.snow(new V3(rand(-3.1, 3.1), rand(2.6, 3.8), rand(-2.3, 2.3))));
    const smoke = fx.emitter(0, () => fx.steam(new V3(1.95, 3.15, -1.95), '#e9edf3', 1.8));
    return {
      placed(id) { if (id === 'chimney') smoke.rate = 1.2; },
      finale() { snow.rate = 9; smoke.rate = 3.5; },
      alive() { snow.rate = 9; smoke.rate = 3.5; },
      update(_dt, _t, c) {
        const e = c.evening;
        frontMat().emissiveIntensity = sideMat().emissiveIntensity = e * 0.7;
        housesA().mat.emissiveIntensity = e * 1.8;
        lampA().mat.emissiveIntensity = (c.placed.has('lamp') ? e : 0) * 1.6;
        lamp.intensity = (c.placed.has('lamp') ? e : 0) * 4;
        door.intensity = (c.placed.has('house') ? e : 0) * 2.2;
      },
    };
  },
};
