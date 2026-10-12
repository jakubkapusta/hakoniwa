// Scene 1: a ramen stall (yatai) on a spring evening, sakura behind, a small town and a mountain in the back.
import * as THREE from 'three';
import { bandPts, blob, circ, clumps, dab, flowers, foliage, meadow, mottle, tufts, poly, rrect, soft, text, wood, type Ctx, type Pen } from '../core/paint';
import { clamp, lerp, mix, pick, rand, rgba, rnd } from '../core/util';
import { board, boardMat, cutout, cutoutAsset, foldBox, gableRoof, glowing, group, latheMat, memo, plainM, type Foldable } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const CZ = 0.2, CH = 1.0, CW = 2.0, CD = 1.0, ROOF_Y = 2.31, FENCE = 0.3;
const K = (s: string) => 'yatai:' + s;

// ── background: hills with a mountain
const rolling = (x: number) => 1.15 + 0.25 * Math.sin(1.4 * x + 0.6) + 0.16 * Math.sin(2.9 * x + 2);
const mount = (x: number) => 0.8 + 2.25 * Math.pow(Math.max(0, 1 - Math.abs(x - 1.05) / 1.6), 1.35);
const hillY = (x: number) => Math.max(rolling(x), mount(x));
function hillsOutline(p: Pen) { p.moveTo(-3.1, 0); for (let i = 0; i <= 110; i++) { const x = -3.1 + (6.2 * i) / 110; p.lineTo(x, hillY(x)); } p.lineTo(3.1, 0); p.closePath(); }
const hillsA = () => cutoutAsset(K('hills'), hillsOutline, (c) => {
  let g = c.createLinearGradient(0, 3.2, 0, 0); g.addColorStop(0, '#aecbc4'); g.addColorStop(1, '#93b98f'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 3.4);
  c.save(); c.beginPath(); c.moveTo(-1, 0); for (let x = -1; x <= 3.15; x += 0.04) c.lineTo(x, mount(x)); c.lineTo(3.15, 0); c.closePath();
  g = c.createLinearGradient(0, 3.1, 0, 0.8); g.addColorStop(0, '#c9d5e2'); g.addColorStop(1, '#9fb5c9'); c.fillStyle = g; c.fill(); c.clip();
  c.fillStyle = 'rgba(70,90,125,.16)'; c.beginPath(); poly(c, [[1.05, 3.2], [1.35, 0], [3.2, 0], [3.2, 3.2]]); c.fill();
  c.fillStyle = '#f6f8fb'; c.beginPath(); c.moveTo(-0.2, 2.42);
  for (let x = -0.2; x <= 2.3; x += 0.04) c.lineTo(x, 2.42 + 0.07 * Math.sin(x * 37) + 0.05 * Math.sin(x * 13));
  c.lineTo(2.3, 3.4); c.lineTo(-0.2, 3.4); c.closePath(); c.fill();
  c.fillStyle = 'rgba(140,160,195,.28)'; c.beginPath(); poly(c, [[1.05, 3.2], [1.2, 2.3], [2.4, 2.3], [2.4, 3.2]]); c.fill();
  c.restore();
  c.beginPath(); c.moveTo(-3.2, 0); for (let x = -3.2; x <= 3.2; x += 0.04) c.lineTo(x, rolling(x)); c.lineTo(3.2, 0); c.closePath();
  g = c.createLinearGradient(0, 1.6, 0, 0); g.addColorStop(0, '#a8c8a3'); g.addColorStop(1, '#8db687'); c.fillStyle = g; c.fill();
  clumps(c, (x) => rolling(x) - 0.03, -3.2, 3.2, '#86ab8a', [0.05, 0.09], 0.7, [0.03, 0.06]);
  ([[0.95, '#94bf86'], [0.66, '#7fb071'], [0.38, '#6aa05f']] as [number, string][]).forEach(([b, col], k) => {
    const fy = (x: number) => b + 0.17 * Math.sin(x * (1.6 + k * 0.5) + k * 1.7) + 0.08 * Math.sin(x * 3.7 + k);
    c.beginPath(); c.moveTo(-3.2, 0); for (let x = -3.2; x <= 3.2; x += 0.04) c.lineTo(x, fy(x)); c.lineTo(3.2, 0); c.closePath(); c.fillStyle = col; c.fill();
    for (let i = 0; i < 5; i++) { c.fillStyle = rgba('#f0f6c8', 0.12); const x0 = rand(-3, 2.6); c.beginPath(); c.ellipse(x0, fy(x0) - 0.12, rand(0.2, 0.4), 0.05, 0, 0, 7); c.fill(); }
    clumps(c, fy, -3.2, 3.2, mix(col, '#355d35', 0.3));
  });
  g = c.createLinearGradient(0, 3.2, 0, 0.6); g.addColorStop(0, 'rgba(228,238,242,.35)'); g.addColorStop(1, 'rgba(228,238,242,0)'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 3.4);
}, { ppu: 170, ink: 0 });

// ── background: the town
interface House { x0: number; x1: number; h: number; roof: number; wall: string; rc: string; win: number[][]; lattice?: boolean }
const HOUSES: (House | { pagoda: number })[] = [
  { x0: -3.0, x1: -2.4, h: 0.78, roof: 0.3, wall: '#efe3cc', rc: '#5d6c80', win: [[-2.7, 0.55]] },
  { x0: -2.25, x1: -1.5, h: 1.05, roof: 0.36, wall: '#e8cfa6', rc: '#6e5848', win: [[-2.05, 0.85], [-1.72, 0.85]], lattice: true },
  { x0: -1.35, x1: -0.65, h: 0.88, roof: 0.33, wall: '#f3ead8', rc: '#4f6178', win: [[-1.0, 0.64]] },
  { x0: -0.5, x1: 0.3, h: 1.2, roof: 0.4, wall: '#e2c79a', rc: '#5d6c80', win: [[-0.3, 1.0], [0.1, 1.0], [-0.1, 0.68]], lattice: true },
  { x0: 0.45, x1: 0.88, h: 0.82, roof: 0.28, wall: '#efe0c4', rc: '#77604c', win: [[0.665, 0.6]] },
  { pagoda: 1.45 },
  { x0: 1.98, x1: 2.5, h: 0.92, roof: 0.32, wall: '#f0e6d2', rc: '#4f6178', win: [[2.24, 0.68]], lattice: true },
  { x0: 2.62, x1: 3.0, h: 0.7, roof: 0.26, wall: '#e8d2ae', rc: '#6e5848', win: [[2.81, 0.52]] },
];
const PAG = [[0.30, FENCE], [0.30, 0.62], [0.46, 0.58], [0.48, 0.63], [0.24, 0.74], [0.24, 1.02], [0.40, 0.98], [0.42, 1.03], [0.19, 1.13], [0.19, 1.40], [0.34, 1.36], [0.36, 1.41], [0.10, 1.52], [0.03, 1.55], [0.03, 2.05], [0, 2.13]];
const pagodaPts = (cx: number) => [...PAG.map(([x, y]) => [cx - x, y]), ...PAG.slice(0, -1).reverse().map(([x, y]) => [cx + x, y])];
function townOutline(p: Pen) {
  p.moveTo(-3.05, 0); p.lineTo(-3.05, FENCE);
  for (const h of HOUSES) {
    if ('pagoda' in h) { for (const [x, y] of pagodaPts(h.pagoda)) p.lineTo(x, y); continue; }
    const m = (h.x0 + h.x1) / 2;
    p.lineTo(h.x0, FENCE); p.lineTo(h.x0, h.h); p.lineTo(h.x0 - 0.05, h.h - 0.02); p.lineTo(m, h.h + h.roof); p.lineTo(h.x1 + 0.05, h.h - 0.02); p.lineTo(h.x1, h.h); p.lineTo(h.x1, FENCE);
  }
  p.lineTo(3.05, FENCE); p.lineTo(3.05, 0); p.closePath();
}
function shoji(c: Ctx, x: number, y: number) {
  c.fillStyle = '#f4e4b8'; c.fillRect(x - 0.08, y - 0.065, 0.16, 0.13);
  c.strokeStyle = '#5d4434'; c.lineWidth = 0.014; c.strokeRect(x - 0.08, y - 0.065, 0.16, 0.13);
  c.lineWidth = 0.006; c.beginPath();
  c.moveTo(x - 0.027, y - 0.065); c.lineTo(x - 0.027, y + 0.065); c.moveTo(x + 0.027, y - 0.065); c.lineTo(x + 0.027, y + 0.065); c.moveTo(x - 0.08, y); c.lineTo(x + 0.08, y);
  c.stroke();
}
const townA = () => cutoutAsset(K('town'), townOutline, (c) => {
  c.fillStyle = '#cdbfa5'; c.fillRect(-3.1, 0, 6.2, FENCE);
  for (let y = 0.01; y < FENCE - 0.04; y += 0.07) for (let x = -3.1 + rnd() * 0.1; x < 3.1;) {
    const w = rand(0.1, 0.17); c.fillStyle = mix('#cdbfa5', rnd() < 0.5 ? '#8f8470' : '#f2ead9', rand(0.1, 0.4));
    c.beginPath(); rrect(c, x + 0.008, y + 0.008, x + w - 0.008, y + 0.062, 0.015); c.fill(); x += w;
  }
  c.fillStyle = '#4f5d6e'; c.fillRect(-3.1, FENCE - 0.035, 6.2, 0.035);
  for (const h of HOUSES) {
    if ('pagoda' in h) {
      const cx = h.pagoda;
      c.fillStyle = '#4a5768'; c.beginPath(); poly(c, pagodaPts(cx)); c.fill();
      c.strokeStyle = 'rgba(200,215,230,.35)'; c.lineWidth = 0.012;
      [[0.46, 0.58, 0.24, 0.74], [0.40, 0.98, 0.19, 1.13], [0.34, 1.36, 0.10, 1.52]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(cx - a, b + 0.03); c.lineTo(cx - d, e); c.lineTo(cx + d, e); c.lineTo(cx + a, b + 0.03); c.stroke(); });
      [[0.30, FENCE, 0.58], [0.24, 0.74, 0.98], [0.19, 1.13, 1.36]].forEach(([hw, y0, y1]) => {
        c.fillStyle = '#b5493a'; c.fillRect(cx - hw + 0.03, y0, 2 * hw - 0.06, y1 - y0);
        c.fillStyle = '#ead9b8'; c.fillRect(cx - hw + 0.03, y0 + 0.01, 2 * hw - 0.06, 0.022);
        c.fillStyle = '#7d2e24'; for (let x = cx - hw + 0.05; x < cx + hw - 0.03; x += 0.07) c.fillRect(x, y0, 0.012, y1 - y0);
      });
      c.fillStyle = '#c9a24a'; c.fillRect(cx - 0.022, 1.5, 0.044, 0.57); for (let y = 1.62; y < 2.0; y += 0.06) c.fillRect(cx - 0.045, y, 0.09, 0.016);
      c.fillStyle = '#3a2a22'; c.fillRect(cx - 0.06, FENCE, 0.12, 0.17);
      continue;
    }
    const m = (h.x0 + h.x1) / 2, w = h.x1 - h.x0;
    c.fillStyle = h.wall; c.fillRect(h.x0, FENCE, w, h.h - FENCE);
    c.fillStyle = mix(h.wall, '#7a6a8a', 0.18); c.fillRect(h.x1 - w * 0.28, FENCE, w * 0.28, h.h - FENCE); // shaded side
    const g = c.createLinearGradient(0, FENCE, 0, h.h); g.addColorStop(0, 'rgba(90,70,50,.2)'); g.addColorStop(1, 'rgba(90,70,50,0)'); c.fillStyle = g; c.fillRect(h.x0, FENCE, w, h.h - FENCE);
    if (h.lattice) {
      const lt = FENCE + (h.h - FENCE) * 0.42; c.fillStyle = '#7a5236'; c.fillRect(h.x0, FENCE, w, lt - FENCE);
      c.strokeStyle = 'rgba(240,210,170,.4)'; c.lineWidth = 0.008;
      for (let x = h.x0 + 0.03; x < h.x1; x += 0.035) { c.beginPath(); c.moveTo(x, FENCE); c.lineTo(x, lt); c.stroke(); }
    }
    c.strokeStyle = '#4f3a2c'; c.lineWidth = 0.025; c.strokeRect(h.x0 + 0.012, FENCE, w - 0.024, h.h - FENCE - 0.012);
    const by = FENCE + (h.h - FENCE) * 0.6; c.beginPath(); c.moveTo(h.x0, by); c.lineTo(h.x1, by); c.stroke();
    for (const [wx, wy] of h.win) shoji(c, wx, wy);
    if (!h.lattice) { c.fillStyle = pick(['#c4553f', '#33497a', '#5d7d4a']); c.fillRect(m - 0.09, FENCE + 0.13, 0.18, 0.1); }
    c.fillStyle = h.rc; c.beginPath(); poly(c, [[h.x0 - 0.05, h.h - 0.02], [m, h.h + h.roof], [h.x1 + 0.05, h.h - 0.02]]); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 0.01;
    for (let i = 1; i < 12; i++) { const t = i / 12; c.beginPath(); c.moveTo(m, h.h + h.roof); c.lineTo(lerp(h.x0 - 0.05, h.x1 + 0.05, t), h.h - 0.02); c.stroke(); }
    c.strokeStyle = mix(h.rc, '#000000', 0.35); c.lineWidth = 0.03; c.beginPath(); c.moveTo(h.x0 - 0.05, h.h - 0.02); c.lineTo(m, h.h + h.roof); c.lineTo(h.x1 + 0.05, h.h - 0.02); c.stroke();
  }
}, {
  ppu: 170, ink: 0, emissive: (c) => {
    for (const h of HOUSES) {
      if ('pagoda' in h) { soft(c, h.pagoda, FENCE + 0.08, 0.2, '#ffb060', 0.6); c.fillStyle = '#ffc070'; c.fillRect(h.pagoda - 0.06, FENCE, 0.12, 0.17); continue; }
      for (const [x, y] of h.win) { soft(c, x, y, 0.17, '#ffb066', 0.45); c.fillStyle = '#ffd27f'; c.fillRect(x - 0.08, y - 0.065, 0.16, 0.13); }
    }
  },
});

// ── sakura
const canopyR = (a: number) => 1 + 0.09 * Math.sin(a * 7 + 1) + 0.05 * Math.sin(a * 13 + 2);
function treeOutline(p: Pen) {
  p.moveTo(0.2, 0); p.lineTo(0.1, 0.12); p.lineTo(0.09, 1.4);
  const a0 = -1.35, a1 = Math.PI + 1.35;
  for (let i = 0; i <= 90; i++) { const a = a0 + ((a1 - a0) * i) / 90, r = canopyR(a); p.lineTo(r * Math.cos(a) * 1.08, 2.25 + r * 0.85 * Math.sin(a)); }
  p.lineTo(-0.09, 1.4); p.lineTo(-0.1, 0.12); p.lineTo(-0.22, 0); p.closePath();
}
const treeA = () => cutoutAsset(K('tree'), treeOutline, (c) => {
  c.fillStyle = '#7a5843'; c.fillRect(-0.3, 0, 0.6, 1.7);
  for (let i = 0; i < 16; i++) { c.strokeStyle = rgba(pick(['#5a3f30', '#9a7660']), 0.6); c.lineWidth = rand(0.01, 0.025); const x = rand(-0.1, 0.1); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + rand(-0.02, 0.02), 1.5); c.stroke(); }
  c.fillStyle = '#f5bfcc'; c.beginPath(); c.ellipse(0, 2.25, 1.2, 1.0, 0, 0, 7); c.fill();
  c.strokeStyle = '#6d4c3a'; c.lineCap = 'round';
  [[0, 1.4, -0.5, 2.0, 0.06], [0, 1.4, 0.55, 1.95, 0.06], [0, 1.5, 0.05, 2.4, 0.05], [-0.3, 1.75, -0.75, 2.2, 0.035], [0.3, 1.72, 0.8, 2.35, 0.035]].forEach(([a, b, x, y, w]) => {
    c.lineWidth = w; c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + x) / 2 + 0.1, (b + y) / 2, x, y); c.stroke();
  });
  c.fillStyle = '#e293ab'; c.beginPath(); c.ellipse(0, 2.25, 1.2, 1.0, 0, 0, 7); c.fill();
  foliage(c, -1.15, 1.35, 2.3, 1.85, { shade: '#e695ae', mid: '#fbc0d0', light: '#ffe2ea', hi: '#ffffff' },
    { n: 46, r: [0.17, 0.3], inside: (x, y) => (x / 1.05) ** 2 + ((y - 2.25) / 0.82) ** 2 < 1 });
  for (let i = 0; i < 60; i++) { const a = rand(0, 6.28), rr = rand(0.85, 1.1); dab(c, Math.cos(a) * rr * 1.08, 2.25 + Math.sin(a) * rr * 0.85, rand(0.012, 0.022), pick(['#f6c2d0', '#fde4eb']), 1); }
}, { ppu: 300, t: 0.03 });
const buildTree = () => { const a = cutout(treeA()), b = cutout(treeA()); b.rotation.y = Math.PI / 2; return group(a, b); };

// ── cart
const cartTop = () => boardMat(K('cartTop'), CW, CD, (c, W, H) => { wood(c, W, H, '#d0a274', { dir: 'h', plank: 0.2, frame: 0.03 }); c.fillStyle = '#e9d8b8'; c.fillRect(1.15, 0.35, 0.5, 0.3); c.strokeStyle = '#a58658'; c.lineWidth = 0.01; c.strokeRect(1.15, 0.35, 0.5, 0.3); soft(c, 0.4, 0.6, 0.15, '#6b4428', 0.2); });
const cartFront = () => boardMat(K('cartFront'), CW, CH, (c, W, H) => {
  wood(c, W, H, '#a96b43', { dir: 'h', plank: 0.16, frame: 0.05 });
  c.fillStyle = '#5e3c27'; c.fillRect(0, H - 0.09, W, 0.09);
  ([['醤油', '#c4553f'], ['味噌', '#d08a3a'], ['塩', '#4f7fa8']] as [string, string][]).forEach(([s, col], i) => {
    const x = W * (0.38 + i * 0.14);
    c.strokeStyle = '#3d2a1c'; c.lineWidth = 0.008; c.beginPath(); c.moveTo(x, 0.06); c.lineTo(x, 0.16); c.stroke();
    c.save(); c.translate(x, 0.16); c.rotate((i - 1) * 0.05); c.fillStyle = '#f6eedb'; c.fillRect(-0.07, 0, 0.14, 0.38); c.fillStyle = col; c.fillRect(-0.07, 0, 0.14, 0.045);
    text(c, s, 0, 0.23, 0.085, '#2c241e', { vertical: true }); c.restore();
  });
  dab(c, 0.3, 0.45, 0.16, '#c4553f'); dab(c, 0.3, 0.45, 0.13, '#d9644c'); text(c, 'ら', 0.3, 0.45, 0.17, '#fbf3e4');
  c.fillStyle = '#fbfaf5'; c.fillRect(1.62, 0.12, 0.17, 0.34); c.fillStyle = '#4f7fa8'; for (let y = 0.15; y < 0.44; y += 0.06) c.fillRect(1.62, y, 0.17, 0.02);
});
const cartSide = () => boardMat(K('cartSide'), CD, CH, (c, W, H) => {
  wood(c, W, H, '#a0653f', { dir: 'h', plank: 0.16, frame: 0.05 }); c.fillStyle = '#5e3c27'; c.fillRect(0, H - 0.09, W, 0.09);
  c.fillStyle = '#f6eedb'; c.fillRect(0.4, 0.18, 0.2, 0.48); c.strokeStyle = '#5e3c27'; c.lineWidth = 0.012; c.strokeRect(0.4, 0.18, 0.2, 0.48); text(c, '営業中', 0.5, 0.42, 0.11, '#b13f2c', { vertical: true });
});
const cartBack = () => boardMat(K('cartBack'), CW, CH, (c, W, H) => { wood(c, W, H, '#9a603c', { dir: 'h', plank: 0.16, frame: 0.05 }); c.fillStyle = '#5e3c27'; c.fillRect(0, H - 0.09, W, 0.09); });
const buildCart = () => foldBox({ w: CW, d: CD, h: CH, top: cartTop(), front: cartFront(), back: cartBack(), left: cartSide(), right: cartSide() });
const wheelA = () => cutoutAsset(K('wheel'), (p) => circ(p, 0, 0, 0.36), (c) => {
  c.fillStyle = '#5d4330'; c.fillRect(-0.4, -0.4, 0.8, 0.8); dab(c, 0, 0, 0.29, '#a77b52');
  c.strokeStyle = '#5d4330'; c.lineWidth = 0.05; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3); c.stroke(); }
  dab(c, 0, 0, 0.09, '#4a3528'); dab(c, 0, 0, 0.05, '#9aa3a8'); dab(c, -0.015, 0.015, 0.02, '#e6ecef');
  c.strokeStyle = 'rgba(255,230,190,.3)'; c.lineWidth = 0.012; c.beginPath(); c.arc(0, 0, 0.33, 2.2, 3.6); c.stroke();
});
const buildWheel = () => group(cutout(wheelA()));

// ── roof and posts
const postMat = () => boardMat(K('post'), 0.07, 1.12, (c, W, H) => wood(c, W, H, '#6e4a30', { dir: 'v', plank: 0.07 }), { ppu: 600 });
function buildPosts() {
  const g = group(), m = postMat();
  [[-0.94, -0.42], [0.94, -0.42], [-0.94, 0.42], [0.94, 0.42]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.12, 0.07), m); p.position.set(x, 0.56, z); g.add(p); });
  [-0.42, 0.42].forEach((z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 0.06), m); b.position.set(0, 1.09, z); g.add(b); });
  return g;
}
const roofMat = () => boardMat(K('roof'), 2.56, 0.9, (c, W, H) => {
  c.fillStyle = '#55657a'; c.fillRect(0, 0, W, H); const row = 0.11, col = 0.12;
  for (let y = 0; y < H; y += row) for (let x = 0; x < W; x += col) {
    const v = mix('#55657a', rnd() < 0.5 ? '#2e3846' : '#a5b5c8', rand(0, 0.28));
    const g = c.createLinearGradient(x, 0, x + col, 0); g.addColorStop(0, mix(v, '#000000', 0.28)); g.addColorStop(0.45, mix(v, '#ffffff', 0.2)); g.addColorStop(1, mix(v, '#000000', 0.28));
    c.fillStyle = g; c.fillRect(x + 0.004, y, col - 0.008, row - 0.008); c.fillStyle = 'rgba(20,25,35,.35)'; c.fillRect(x, y + row - 0.02, col, 0.02);
  }
  for (let i = 0; i < 26; i++) soft(c, rand(0, W), rand(0.2, H), rand(0.03, 0.08), '#7f9a5a', 0.35);
  for (let x = 0; x < W; x += col) { dab(c, x + col / 2, H - 0.045, 0.048, '#46546a'); dab(c, x + col / 2 - 0.012, H - 0.035, 0.02, '#8c9db3', 0.7); }
  c.fillStyle = '#3e4a5b'; c.fillRect(0, 0, W, 0.035);
}, { ppu: 360 });
const buildRoof = () => gableRoof({ w: 2.56, l: 0.9, angle: 0.42, top: roofMat(), under: plainM(K('under'), '#6b4a33'), ridge: plainM(K('ridge'), '#3e4a5b') });

// ── counter and stools
const counterMat = () => boardMat(K('counter'), 2.15, 0.36, (c, W, H) => { wood(c, W, H, '#dcb487', { dir: 'h', plank: 0.12 }); c.fillStyle = 'rgba(70,40,20,.35)'; c.fillRect(0, H - 0.02, W, 0.02); });
const buildCounter = () => group(board(2.15, 0.36, 0.05, counterMat()));
const stoolTop = () => boardMat(K('stoolTop'), 0.34, 0.34, (c, W, H) => {
  wood(c, W, H, '#b98458', { dir: 'h', plank: 0.11 });
  c.fillStyle = '#c4553f'; c.beginPath(); rrect(c, 0.04, 0.04, W - 0.04, H - 0.04, 0.05); c.fill(); soft(c, 0.15, 0.14, 0.12, '#e98a6f', 0.6);
  c.strokeStyle = 'rgba(90,30,20,.35)'; c.lineWidth = 0.006; c.beginPath(); rrect(c, 0.06, 0.06, W - 0.06, H - 0.06, 0.04); c.stroke();
  [[0.12, 0.12], [0.22, 0.12], [0.12, 0.22], [0.22, 0.22]].forEach(([x, y]) => dab(c, x, y, 0.008, '#7d2c1f'));
}, { ppu: 600 });
const stoolSide = () => boardMat(K('stoolSide'), 0.34, 0.48, (c, W, H) => {
  wood(c, W, H, '#8e5c3a', { dir: 'v', plank: 0.11, frame: 0.025 });
  c.fillStyle = '#3d281b'; c.beginPath(); c.moveTo(0.07, H); c.lineTo(0.07, H - 0.12); c.quadraticCurveTo(W / 2, H - 0.26, W - 0.07, H - 0.12); c.lineTo(W - 0.07, H); c.closePath(); c.fill();
}, { ppu: 600 });
const buildStool = () => { const s = stoolSide(); return foldBox({ w: 0.34, d: 0.34, h: 0.48, t: 0.025, top: stoolTop(), front: s, back: s, left: s, right: s }); };

// ── decorations
const norenA = (ch: string, i: number) => cutoutAsset(K('noren' + i), (p) => poly(p, [[-0.215, -0.32], [0.215, -0.32], [0.215, 0.025], [-0.215, 0.025]]), (c) => {
  c.fillStyle = '#2b3f6b'; c.fillRect(-0.3, -0.5, 0.6, 0.6);
  for (let x = -0.22; x < 0.22; x += 0.012) { c.fillStyle = rgba('#ffffff', rand(0, 0.04)); c.fillRect(x, -0.5, 0.006, 0.6); }
  soft(c, -0.08, -0.12, 0.25, '#4a62a0', 0.35);
  c.fillStyle = '#22335a'; c.fillRect(-0.3, -0.04, 0.6, 0.07);
  text(c, ch, 0, -0.16, 0.22, '#f5efe3');
  c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-0.3, -0.32, 0.6, 0.02);
}, { ppu: 400, t: 0.012, ink: 0.012 });
function buildNoren() {
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.95, 8), plainM(K('rod'), '#6b4a33')); rod.rotation.z = Math.PI / 2;
  const g = group(rod);
  const pv = [...'ラーメン'].map((ch, i) => { const p = new THREE.Group(); p.position.x = (i - 1.5) * 0.46; p.add(cutout(norenA(ch, i))); g.add(p); return p; });
  g.userData.tick = (t) => pv.forEach((p, i) => { p.rotation.x = -0.03 + Math.sin(t * 1.7 + i * 0.9) * 0.05 + Math.sin(t * 0.63 + i * 2) * 0.03; });
  return g;
}
const lanternMat = () => latheMat(K('lantern'), 512, 208, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#e2523a' : '#c8402c');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(60,10,5,.28)'; for (let y = 10; y < h; y += 19) c.fillRect(0, y, w, 3);
  [0, 256, 512].forEach((x) => text(c, 'らーめん', x, 104, 38, '#1f1612', { vertical: true }));
});
const lanternGlow = () => memo(K('lanternGlow'), () => { const m = glowing(lanternMat()); m.emissiveMap = m.map; return m; });
function buildLantern() {
  const dark = plainM(K('lanDark'), '#231a16');
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) { const y = -0.19 + (0.38 * i) / 14; pts.push(new THREE.Vector2(0.07 + 0.085 * Math.pow(Math.max(0, Math.cos(((y / 0.19) * Math.PI) / 2)), 0.6), y)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), lanternGlow()); body.position.y = -0.35; body.rotation.y = Math.PI;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.04, 20), dark); cap.position.y = -0.14;
  const cap2 = cap.clone(); cap2.position.y = -0.56;
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), dark); str.position.y = -0.06;
  const sw = new THREE.Group(); sw.add(body, cap, cap2, str);
  const g = group(sw);
  g.userData.tick = (t) => { sw.rotation.z = Math.sin(t * 1.1) * 0.04; sw.rotation.x = Math.sin(t * 0.8 + 1) * 0.03; };
  return g;
}
const signA = () => cutoutAsset(K('sign'), (p) => poly(p, [[-0.18, 0], [-0.12, 0], [-0.12, 0.22], [0.12, 0.22], [0.12, 0], [0.18, 0], [0.18, 0.22], [0.22, 0.22], [0.22, 1.12], [0.27, 1.12], [0, 1.26], [-0.27, 1.12], [-0.22, 1.12], [-0.22, 0.22], [-0.18, 0.22]]), (c) => {
  c.fillStyle = '#6b4a33'; c.fillRect(-0.3, 0, 0.6, 0.25);
  c.save(); c.translate(-0.22, 0.22); wood(c, 0.44, 0.9, '#e0c49a', { dir: 'v', plank: 0.15 }); c.restore();
  c.strokeStyle = '#6b4a33'; c.lineWidth = 0.03; c.strokeRect(-0.205, 0.235, 0.41, 0.87);
  c.fillStyle = '#4f5d6e'; c.fillRect(-0.3, 1.1, 0.6, 0.2);
  text(c, '中華そば', 0, 0.7, 0.15, '#241b15', { vertical: true });
  c.fillStyle = '#c4553f'; c.fillRect(-0.05, 0.27, 0.1, 0.1); text(c, '旨', 0, 0.32, 0.07, '#fbefe0');
});

// ── life
function buildPot() {
  const metal = plainM(K('metal'), '#b4bbc0', { metalness: 0.3, roughness: 0.4 }), knobM = plainM(K('knob'), '#3b2f28');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.26, 28), metal); body.position.y = 0.13;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 28), metal); rim.rotation.x = Math.PI / 2; rim.position.y = 0.26;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.205, 0.03, 28), plainM(K('lid'), '#cdd3d7', { metalness: 0.3, roughness: 0.35 })); lid.position.set(0.03, 0.285, 0); lid.rotation.z = 0.12;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.04, 12), knobM); knob.position.set(0.03, 0.32, 0); knob.rotation.z = 0.12;
  const g = group(body, rim, lid, knob);
  [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.05), metal); h.position.set(s * 0.22, 0.2, 0); g.add(h); });
  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 6), knobM); ladle.position.set(-0.1, 0.36, 0.05); ladle.rotation.z = 0.6; g.add(ladle);
  return g;
}
const bowlMat = () => latheMat(K('bowl'), 256, 64, (c, w) => {
  c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, 64);
  c.fillStyle = '#c4553f'; c.fillRect(0, 0, w, 6); c.fillRect(0, 9, w, 14);
  c.strokeStyle = '#f7f3ea'; c.lineWidth = 2;
  for (let x = 0; x < w; x += 14) { c.beginPath(); c.moveTo(x + 2, 20); c.lineTo(x + 2, 12); c.lineTo(x + 10, 12); c.lineTo(x + 10, 17); c.lineTo(x + 6, 17); c.stroke(); }
  c.fillStyle = '#3d5f93'; c.fillRect(0, 54, w, 3);
}, { side: THREE.DoubleSide, roughness: 0.5 });
const ramenMat = () => latheMat(K('ramen'), 256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, '#e8ad62'); g.addColorStop(1, '#bf7f3c'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = '#f5da92'; c.lineWidth = 4;
  for (let i = 0; i < 26; i++) { c.beginPath(); const y = rand(40, 220); c.moveTo(rand(10, 60), y); for (let x = 40; x < 250; x += 20) c.lineTo(x, y + Math.sin(x * 0.12 + i) * 7); c.stroke(); }
  [[85, 90], [120, 70]].forEach(([x, y]) => { dab(c, x, y, 34, '#a8694a'); dab(c, x, y, 29, '#dca08a'); c.strokeStyle = '#f3d6c4'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 14, 0, 4); c.stroke(); });
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(170, 150, 30, 22, 0.4, 0, 7); c.fill(); dab(c, 172, 150, 13, '#f2a33a');
  c.fillStyle = '#2f3d2b'; c.save(); c.translate(200, 80); c.rotate(0.3); c.fillRect(-18, -40, 36, 70); c.restore();
  dab(c, 95, 170, 24, '#fbf6f0'); c.strokeStyle = '#e86f8c'; c.lineWidth = 4; c.beginPath(); for (let a = 0; a < 12; a += 0.2) c.lineTo(95 + Math.cos(a) * a * 1.6, 170 + Math.sin(a) * a * 1.6); c.stroke();
  for (let i = 0; i < 22; i++) { c.strokeStyle = '#7fbf5a'; c.lineWidth = 3; c.beginPath(); c.arc(rand(60, 200), rand(110, 215), 4, 0, 7); c.stroke(); }
}, { roughness: 0.4 });
function buildBowls() {
  const prof = [[0, 0], [0.06, 0], [0.065, 0.012], [0.1, 0.04], [0.125, 0.08], [0.132, 0.105]].map(([x, y]) => new THREE.Vector2(x, y));
  const stick = plainM(K('stick'), '#c69c6d'), g = group();
  [-0.38, 0.4].forEach((x, i) => {
    const b = new THREE.Group(); b.position.x = x; b.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 32), bowlMat()));
    const soup = new THREE.Mesh(new THREE.CircleGeometry(0.122, 32), ramenMat()); soup.rotation.x = -Math.PI / 2; soup.position.y = 0.092; soup.rotation.z = i * 2; b.add(soup);
    if (i === 1) [-0.018, 0.018].forEach((dz) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.012, 0.012), stick); s.position.set(0, 0.112, dz); s.rotation.y = 0.25; b.add(s); });
    g.add(b);
  });
  return g;
}
function chefOutline(p: Pen) {
  p.moveTo(-0.3, 0); p.lineTo(0.3, 0); p.lineTo(0.33, 0.95);
  p.bezierCurveTo(0.35, 1.12, 0.3, 1.2, 0.14, 1.24); p.bezierCurveTo(0.25, 1.32, 0.26, 1.6, 0.12, 1.69); p.bezierCurveTo(0.05, 1.73, -0.05, 1.73, -0.12, 1.69);
  p.bezierCurveTo(-0.26, 1.6, -0.25, 1.32, -0.14, 1.24); p.bezierCurveTo(-0.3, 1.2, -0.35, 1.12, -0.33, 0.95); p.closePath();
}
const chefA = () => cutoutAsset(K('chef'), chefOutline, (c) => {
  c.fillStyle = '#f3efe6'; c.fillRect(-0.4, 0, 0.8, 1.3); soft(c, -0.3, 1.0, 0.25, '#c9d0dc', 0.6); soft(c, 0.3, 1.0, 0.25, '#c9d0dc', 0.6);
  c.fillStyle = '#34497a'; c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(-0.2, 1.02); c.lineTo(0.2, 1.02); c.lineTo(0.2, 0); c.fill();
  c.strokeStyle = '#34497a'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(-0.18, 1.0); c.lineTo(-0.1, 1.24); c.moveTo(0.18, 1.0); c.lineTo(0.1, 1.24); c.stroke();
  c.strokeStyle = '#d6d0c2'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(-0.08, 1.24); c.lineTo(0, 1.1); c.lineTo(0.08, 1.24); c.stroke();
  c.fillStyle = '#f4d3b4'; c.beginPath(); c.ellipse(0, 1.45, 0.215, 0.235, 0, 0, 7); c.fill();
  c.fillStyle = '#77716b'; c.beginPath(); c.ellipse(0, 1.66, 0.2, 0.1, 0, 0, 7); c.fill();
  c.fillStyle = '#fbfaf6'; c.fillRect(-0.25, 1.555, 0.5, 0.065); c.strokeStyle = '#4f7fa8'; c.lineWidth = 0.014;
  for (let x = -0.25; x < 0.25; x += 0.045) { c.beginPath(); c.moveTo(x, 1.555); c.lineTo(x + 0.03, 1.62); c.stroke(); }
  c.lineCap = 'round'; c.strokeStyle = '#3b2f28'; c.lineWidth = 0.016; [-0.075, 0.075].forEach((x) => { c.beginPath(); c.arc(x, 1.455, 0.03, 0.25, Math.PI - 0.25); c.stroke(); });
  c.strokeStyle = '#6c665f'; c.lineWidth = 0.022; [-0.08, 0.08].forEach((x) => { c.beginPath(); c.moveTo(x - 0.035, 1.515); c.lineTo(x + 0.035, 1.52); c.stroke(); });
  dab(c, 0, 1.42, 0.022, '#e5b595'); soft(c, -0.13, 1.4, 0.06, '#f08a7a', 0.55); soft(c, 0.13, 1.4, 0.06, '#f08a7a', 0.55);
  c.fillStyle = '#8f8a84'; [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 0.045, 1.385, 0.05, 0.022, s * -0.25, 0, 7); c.fill(); });
  c.strokeStyle = '#b5442f'; c.lineWidth = 0.014; c.beginPath(); c.arc(0, 1.33, 0.03, 3.6, 5.8); c.stroke();
  c.strokeStyle = '#ddd7ca'; c.lineWidth = 0.014; [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 0.26, 1.15); c.quadraticCurveTo(s * 0.28, 0.9, s * 0.22, 0.75); c.stroke(); });
}, { ppu: 420 });
function buildChef() { const m = cutout(chefA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 1.5) * 0.025; m.position.y = Math.max(0, Math.sin(t * 3)) * 0.012; }; return g; }
function catOutline(p: Pen) {
  p.moveTo(-0.19, 0); p.bezierCurveTo(-0.27, 0.04, -0.27, 0.24, -0.18, 0.3); p.bezierCurveTo(-0.1, 0.36, 0, 0.36, 0.06, 0.34); p.bezierCurveTo(0.03, 0.42, 0.05, 0.5, 0.08, 0.53);
  p.lineTo(0.085, 0.62); p.lineTo(0.14, 0.56); p.quadraticCurveTo(0.18, 0.575, 0.22, 0.56); p.lineTo(0.27, 0.62); p.lineTo(0.28, 0.51);
  p.bezierCurveTo(0.32, 0.46, 0.31, 0.38, 0.26, 0.35); p.bezierCurveTo(0.22, 0.33, 0.2, 0.3, 0.2, 0.24); p.bezierCurveTo(0.21, 0.14, 0.2, 0.06, 0.22, 0); p.closePath();
}
const catA = () => cutoutAsset(K('cat'), catOutline, (c) => {
  c.fillStyle = '#fbf6ee'; c.fillRect(-0.3, 0, 0.65, 0.65);
  soft(c, -0.13, 0.2, 0.16, '#e8954a', 1); dab(c, -0.12, 0.2, 0.1, '#e8954a'); dab(c, 0.17, 0.56, 0.06, '#e8954a'); dab(c, -0.03, 0.31, 0.06, '#3b332e'); dab(c, 0.25, 0.58, 0.045, '#3b332e');
  c.fillStyle = '#f2a7a7'; c.beginPath(); poly(c, [[0.235, 0.565], [0.262, 0.6], [0.268, 0.54]]); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#3b2f28'; c.lineWidth = 0.012; c.beginPath(); c.arc(0.235, 0.46, 0.022, 0.3, Math.PI - 0.3); c.stroke();
  dab(c, 0.3, 0.415, 0.012, '#e58a8a'); c.lineWidth = 0.007; c.beginPath(); c.moveTo(0.3, 0.405); c.quadraticCurveTo(0.295, 0.385, 0.28, 0.39); c.stroke();
  c.strokeStyle = 'rgba(90,70,60,.6)'; c.lineWidth = 0.005; [[0.27, 0.4, 0.33, 0.43], [0.27, 0.39, 0.33, 0.38]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
  soft(c, 0.2, 0.43, 0.03, '#f3a0a0', 0.5);
  c.strokeStyle = 'rgba(120,100,90,.45)'; c.lineWidth = 0.008; c.beginPath(); c.moveTo(0.12, 0); c.quadraticCurveTo(0.13, 0.15, 0.16, 0.25); c.stroke();
}, { ppu: 900, t: 0.025 });
const tailA = () => cutoutAsset(K('tail'), (p) => poly(p, bandPts([[0, 0], [-0.14, -0.01], [-0.24, 0.12], [-0.16, 0.27]], 0.03, 0.02)), (c) => {
  c.fillStyle = '#e8954a'; c.fillRect(-0.35, -0.1, 0.4, 0.45); dab(c, -0.16, 0.27, 0.06, '#3b332e');
  c.strokeStyle = 'rgba(150,80,30,.5)'; c.lineWidth = 0.012; [[-0.1, 0], [-0.19, 0.06], [-0.22, 0.15]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 0.035, 0, 7); c.stroke(); });
}, { ppu: 900, t: 0.02 });
function buildCat() {
  const tp = new THREE.Group(); tp.position.set(-0.2, 0.05, -0.006); tp.add(cutout(tailA()));
  const g = group(cutout(catA()), tp);
  g.userData.tick = (t) => { tp.rotation.z = Math.sin(t * 1.3) * 0.22 + Math.sin(t * 3.1) * 0.05; };
  return g;
}

// ── the secret: a tanuki with a leaf on its head, sitting behind the cart
function tanukiOutline(p: Pen) {
  p.moveTo(-0.2, 0); p.bezierCurveTo(-0.3, 0.05, -0.3, 0.3, -0.18, 0.38);
  p.bezierCurveTo(-0.24, 0.45, -0.22, 0.6, -0.12, 0.62); p.lineTo(-0.15, 0.7); p.lineTo(-0.07, 0.66);
  p.bezierCurveTo(-0.02, 0.69, 0.02, 0.69, 0.07, 0.66); p.lineTo(0.15, 0.7); p.lineTo(0.12, 0.62);
  p.bezierCurveTo(0.22, 0.6, 0.24, 0.45, 0.18, 0.38); p.bezierCurveTo(0.3, 0.3, 0.3, 0.05, 0.2, 0); p.closePath();
}
const tanukiA = () => cutoutAsset(K('tanuki'), tanukiOutline, (c) => {
  c.fillStyle = '#9a7656'; c.fillRect(-0.4, 0, 0.8, 0.8);
  dab(c, 0, 0.17, 0.15, '#e6d3b6'); soft(c, 0, 0.5, 0.25, '#b38d68', 0.6);
  c.fillStyle = '#3d2f26'; [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 0.075, 0.5, 0.06, 0.045, s * 0.3, 0, 7); c.fill(); dab(c, s * 0.07, 0.505, 0.014, '#fff8ec'); });
  dab(c, 0, 0.44, 0.022, '#2b211b'); dab(c, 0, 0.56, 0.04, '#f0e2c8', 0.8);
  c.strokeStyle = '#3d2f26'; c.lineWidth = 0.01; c.beginPath(); c.arc(-0.02, 0.41, 0.02, 0.2, 2.6); c.arc(0.02, 0.41, 0.02, 0.6, 2.9); c.stroke();
  c.fillStyle = '#6a8f3e'; c.beginPath(); c.ellipse(0, 0.7, 0.09, 0.035, -0.3, 0, 7); c.fill();
  c.strokeStyle = '#4b6a2a'; c.lineWidth = 0.006; c.beginPath(); c.moveTo(-0.07, 0.72); c.lineTo(0.08, 0.68); c.stroke();
}, { ppu: 700, t: 0.025 });
function buildTanuki() {
  const leaf = new THREE.Group(); leaf.add(cutout(tanukiA()));
  const g = group(leaf);
  g.userData.tick = (t) => { leaf.rotation.z = Math.sin(t * 2.2) * 0.06; };
  return g;
}

// ── ground
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#8fc06a', light: '#b5db7f', shade: '#6fa35a', tufts: [] });
  blob(c, -2.3, 1.3, 1.1, '#5f9257', 0.5, 0.3); // shade under the sakura
  const PX = 1.65, PY0 = -2.0, PY1 = 0.62, inPave = (x: number, y: number, m = 0.05) => x > -PX + m && x < PX - m && y > PY0 + m && y < PY1 - m;
  c.save(); c.beginPath(); rrect(c, -PX, PY0, PX, PY1, 0.28); c.clip(); c.fillStyle = '#b4a98f'; c.fillRect(-PX, PY0, 2 * PX, PY1 - PY0);
  for (let y = PY0; y < PY1;) {
    const rh = rand(0.2, 0.28);
    for (let x = -PX - rand(0, 0.2); x < PX;) {
      const rw = rand(0.22, 0.42);
      c.fillStyle = pick(['#ddd3bf', '#d2c7b0', '#e5dccb', '#c9bea6', '#d8cdb6']); c.beginPath(); rrect(c, x + 0.018, y + 0.018, x + rw - 0.018, y + rh - 0.018, 0.05); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(x + 0.05, y + rh - 0.035); c.lineTo(x + rw - 0.05, y + rh - 0.035); c.stroke();
      if (rnd() < 0.22) soft(c, x + rand(0, rw), y + rand(0, rh), 0.07, '#8aa070', 0.45);
      x += rw;
    }
    y += rh;
  }
  c.restore();
  tufts(c, -W / 2, -D / 2, W, D, ['#6a9e4f', '#7fb35a', '#a2cf72', '#5c8f47'], 1700, (x, y) => inPave(x, y, -0.02));
  flowers(c, -W / 2 + 0.2, -D / 2 + 0.2, W - 0.4, D - 0.4, ['#ffffff', '#fff2a8', '#f7c6d4'], 60, (x, y) => inPave(x, y, -0.12));
  [[1.95, -1.75], [2.32, -1.98], [2.66, -2.18]].forEach(([x, y]) => { dab(c, x, y - 0.015, 0.13, '#6f7f5a', 0.5); dab(c, x, y, 0.12, '#cfc6b4'); dab(c, x - 0.02, y + 0.02, 0.08, '#e2dbcc'); });
  for (let i = 0; i < 70; i++) dab(c, -2.3 + rand(-1.3, 1.6), 1.4 + rand(-1.1, 0.9), 0.018, pick(['#f7c6d4', '#fde4ea']), 0.9);
}

export const YATAI: SceneDef = {
  id: 'yatai',
  title: 'Yatai z ramenem',
  jp: '屋台',
  season: 'wiosna',
  blurb: 'Stoisko z ramenem pod kwitnącą sakurą.',
  box: ['#c4553f', '#e0874f'],
  seed: 20261012,
  base: { w: 6.4, d: 5.0, paint: paintGround },
  sky: {
    day: { grad: [[0, '#3b8ad6'], [0.42, '#78bcec'], [0.78, '#bfe3f2'], [1, '#eaf5ee']], cloud: '#fbfaf3', hi: '#ffffff', edge: '#fbfaf3', shadow: '#b5c0de' },
    evening: { grad: [[0, '#1d2257'], [0.38, '#5d4a8e'], [0.7, '#e3856a'], [1, '#ffd49a']], cloud: '#f4ae94', hi: '#ffdcb8', edge: '#f4ae94', shadow: '#83649d', stars: true },
  },
  light: {
    day: { sky: '#e3f0ff', ground: '#9c8a62', hemi: 1.15, sun: '#fff1d6', sunI: 2.6, sunPos: [4, 8, 5], bloom: 0.03 },
    evening: { sky: '#9a90d0', ground: '#5a4648', hemi: 0.85, sun: '#ff8f55', sunI: 0.9, sunPos: [-6, 2.6, 3.5], bloom: 0.75 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['hills', 'town', 'tree'] },
    { name: 'Wózek', jp: '屋台', pieces: ['cart', 'wheelL', 'wheelR'] },
    { name: 'Dach', jp: '屋根', pieces: ['posts', 'roof'] },
    { name: 'Lada', jp: 'カウンター', pieces: ['counter', 'stoolA', 'stoolB', 'stoolC'] },
    { name: 'Ozdoby', jp: '飾り', pieces: ['noren', 'lantern', 'sign'] },
    { name: 'Życie', jp: '暮らし', pieces: ['pot', 'bowls', 'chef', 'cat'] },
  ],
  pieces: {
    hills: { name: 'Wzgórza', pos: [0, 0, -2.42], build: () => group(cutout(hillsA())) },
    town: { name: 'Miasteczko', pos: [0, 0, -2.18], build: () => group(cutout(townA())), sound: 'town' },
    tree: { name: 'Sakura', pos: [-2.35, 0, -1.45], build: buildTree, sound: 'leaves' },
    cart: { name: 'Wózek', pos: [0, 0, CZ], build: buildCart },
    wheelL: { name: 'Koło', pos: [-CW / 2 - 0.03, 0.36, CZ + 0.05], rotY: -Math.PI / 2, build: buildWheel },
    wheelR: { name: 'Koło', pos: [CW / 2 + 0.03, 0.36, CZ + 0.05], rotY: Math.PI / 2, build: buildWheel },
    posts: { name: 'Słupki', pos: [0, CH, CZ], build: buildPosts },
    roof: { name: 'Dach', pos: [0, ROOF_Y, CZ], build: buildRoof },
    counter: { name: 'Lada', pos: [0, CH + 0.025, CZ + CD / 2 + 0.18], build: buildCounter },
    stoolA: { name: 'Stołek', pos: [-0.68, 0, 1.52], build: buildStool },
    stoolB: { name: 'Stołek', pos: [0, 0, 1.52], build: buildStool },
    stoolC: { name: 'Stołek', pos: [0.68, 0, 1.52], build: buildStool },
    noren: { name: 'Noren', pos: [0, 1.93, CZ + 0.78], build: buildNoren, sound: 'chime' },
    lantern: { name: 'Lampion', pos: [1.12, 1.95, CZ + 0.8], build: buildLantern, sound: 'crickets' },
    sign: { name: 'Szyld', pos: [-1.95, 0, 1.25], rotY: 0.4, build: () => group(cutout(signA())) },
    pot: { name: 'Garnek', pos: [-0.5, CH, CZ - 0.08], build: buildPot, sound: 'bubble' },
    bowls: { name: 'Miski', pos: [0, CH + 0.05, CZ + CD / 2 + 0.18], build: buildBowls },
    chef: { name: 'Kucharz', pos: [-1.7, 0, CZ + 0.15], rotY: 0.35, build: buildChef },
    cat: { name: 'Kot', pos: [0.68, 0.48, 1.52], build: buildCat },
  },
  secret: { name: 'tanuki z liściem', build: buildTanuki, pos: [0.85, 0, -0.75], rotY: Math.PI },

  setup(ctx) {
    const lanternLight = new THREE.PointLight('#ff7a45', 0, 4.5, 1.6); lanternLight.position.set(1.12, 1.6, 1.1);
    const bulb = new THREE.PointLight('#ffc27a', 0, 5, 1.4); bulb.position.set(0, 1.82, 0.75);
    ctx.scene.add(lanternLight, bulb);
    const potTop = new V3(-0.5, CH + 0.33, CZ - 0.08);
    const steam = ctx.fx.emitter(0, () => ctx.fx.steam(potTop));
    const petals = ctx.fx.emitter(0, () => ctx.fx.petal(new V3(-2.35 + rand(-1, 1), rand(1.7, 2.9), -1.45 + rand(-0.7, 0.7))));
    const alive = () => { petals.rate = 2.2; };
    return {
      placed(id) { if (id === 'tree') petals.rate = 0.7; if (id === 'pot') steam.rate = 4; },
      finale: alive, alive,
      update(_dt, _t, c) {
        const e = c.evening;
        lanternGlow().emissiveIntensity = e * 2.2;
        townA().mat.emissiveIntensity = e * 2.4;
        lanternLight.intensity = (c.placed.has('lantern') ? e : 0) * 6;
        bulb.intensity = (c.placed.has('roof') ? e : 0) * 4.5;
      },
    };
  },
};
