// Scene 9: a narrow drinking alley (yokocho) on a late-summer night, under a railway viaduct. A row of tiny bars with
// lanterns and lightboxes, a yakitori stall, beer crates for tables, vending machines, wires and bulbs overhead.
// Bigger kit (32 pieces). Finale: night, every sign lights up, the neon flickers, smoke from the grill, a train crosses.
import * as THREE from 'three';
import { blob, dab, JPG, mottle, newCanvas, poly, rrect, soft, text, toTex, wood, type Ctx, type Pen } from '../core/paint';
import { ease, lerp, mix, pick, rand, rnd } from '../core/util';
import { board, boardMat, cutout, cutoutAsset, foldBox, gableRoof, glowing, group, latheMat, memo, paperMat, plainM, toon } from '../kit/kit';
import { face, figure, seatedOutline } from '../kit/people';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'yokocho:' + s;
const SW = 1.35, SD = 1.0, SH = 1.35, SZ = -1.15, FZ = SZ + SD / 2; // shops: width, depth, height, centre z, facade z
const SHOPS_X = [-2.15, -0.72, 0.72, 2.15];
const OZ = -2.05, DECK = 1.86; // the viaduct
const F2 = { w: 2.6, d: 0.7, h: 0.45, z: -1.35 }; // the flat above the middle shops
const AW = { y: 1.02, l: 0.42, a: 0.35 }; // awnings
const AW_EDGE = { y: AW.y - AW.l * Math.sin(AW.a), z: FZ + AW.l * Math.cos(AW.a) };
const POLE_X = 3.0, POLE_Z = -0.3, LAMP_X = -1.435;
const STALL = { x: -2.05, z: 1.0 }, TABLE = { x: 1.3, z: 1.15 };

interface Shop { wall: string; sign: string; awning: [string, string]; kind: 'izakaya' | 'ramen' | 'oden' | 'snack' }
const SHOPS: Shop[] = [
  { wall: '#8a5a3a', sign: '居酒屋', awning: ['#c4362f', '#f2ead8'], kind: 'izakaya' },
  { wall: '#d8c8a0', sign: 'ラーメン', awning: ['#e8b83a', '#c4362f'], kind: 'ramen' },
  { wall: '#6a7a6a', sign: 'おでん', awning: ['#3f6a5a', '#e8dcc0'], kind: 'oden' },
  { wall: '#4a4560', sign: 'スナック夢', awning: ['#6a4a8a', '#e8c8f0'], kind: 'snack' },
];

// ── backdrop: a city of lit windows and a red lattice tower
const BLDG = (() => { const out: number[][] = []; let x = -3.1; while (x < 3.1) { const w = rand(0.35, 0.75); out.push([x, Math.min(3.1, x + w), rand(1.9, 2.9)]); x += w + rand(0, 0.05); } return out; })();
function cityOutline(p: Pen) { p.moveTo(-3.1, 0); for (const [x0, x1, h] of BLDG) { p.lineTo(x0, h); p.lineTo(x1, h); } p.lineTo(3.1, 0); p.closePath(); }
const WIN = (() => { const out: number[][] = []; for (const [x0, x1, h] of BLDG) for (let y = 1.75; y < h - 0.08; y += 0.12) for (let x = x0 + 0.05; x < x1 - 0.08; x += 0.1) if (rnd() < 0.55) out.push([x, y]); return out; })();
const cityA = () => cutoutAsset(K('city'), cityOutline, (c) => {
  c.fillStyle = '#8a92a8'; c.fillRect(-3.2, 0, 6.4, 3.2);
  for (const [x0, x1, h] of BLDG) { c.fillStyle = mix('#7a84a0', '#a4a8b8', rnd()); c.fillRect(x0, 0, x1 - x0, h); c.fillStyle = 'rgba(40,40,70,.18)'; c.fillRect(x1 - (x1 - x0) * 0.3, 0, (x1 - x0) * 0.3, h); }
  for (const [x, y] of WIN) { c.fillStyle = '#5a627a'; c.fillRect(x, y, 0.05, 0.06); }
}, { ppu: 170, ink: 0, emissive: (c) => { for (const [x, y] of WIN) if (rnd() < 0.7) { c.fillStyle = pick(['#ffd890', '#fff0c8', '#c8e0ff']); c.fillRect(x, y, 0.05, 0.06); } } });
const towerA = () => cutoutAsset(K('tower'), (p) => poly(p, [[-0.42, 0], [-0.3, 0], [-0.06, 1.9], [0.06, 1.9], [0.3, 0], [0.42, 0], [0.12, 1.9], [0.12, 2.1], [0.03, 2.15], [0.015, 3.3], [-0.015, 3.3], [-0.03, 2.15], [-0.12, 2.1], [-0.12, 1.9]]), (c) => {
  c.fillStyle = '#e04a2f'; c.fillRect(-0.5, 0, 1, 3.4);
  for (let y = 0.2; y < 3.3; y += 0.4) { c.fillStyle = (y * 2.5) % 2 < 1 ? '#f2ead8' : '#e04a2f'; c.fillRect(-0.5, y, 1, 0.2); }
  c.strokeStyle = 'rgba(80,20,10,.5)'; c.lineWidth = 0.012; for (let y = 0; y < 1.9; y += 0.16) { const w = 0.36 - y * 0.16; c.beginPath(); c.moveTo(-w, y); c.lineTo(w * 0.9, y + 0.16); c.moveTo(w, y); c.lineTo(-w * 0.9, y + 0.16); c.stroke(); }
  c.fillStyle = '#8a8a90'; c.fillRect(-0.14, 1.88, 0.28, 0.08);
}, { ppu: 260, ink: 0, emissive: (c) => { [[0, 3.28], [-0.12, 1.98], [0.12, 1.98], [0, 1.1]].forEach(([x, y]) => soft(c, x, y, 0.06, '#ff5a3a')); } });
// the viaduct: a steel girder on brick piers
const girderMat = () => boardMat(K('girder'), 6.4, 0.18, (c, W, H) => { c.fillStyle = '#5a6a6a'; c.fillRect(0, 0, W, H); c.fillStyle = '#4a5858'; c.fillRect(0, H - 0.04, W, 0.04); for (let x = 0.1; x < W; x += 0.2) { c.fillStyle = '#6f8080'; c.fillRect(x, 0.02, 0.02, H - 0.06); dab(c, x + 0.01, 0.03, 0.008, '#3a4646'); dab(c, x + 0.01, H - 0.06, 0.008, '#3a4646'); } }, { ppu: 160 });
const brickMat = () => boardMat(K('brick'), 0.42, 1.7, (c, W, H) => { c.fillStyle = '#8a4a3a'; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 0.06) for (let x = ((y / 0.06) % 2) * 0.05; x < W; x += 0.1) { c.fillStyle = mix('#9a5a42', '#7a4030', rnd()); c.fillRect(x + 0.005, y + 0.005, 0.09, 0.05); } }, { ppu: 200 });
function buildOverpass() {
  const side = plainM(K('girderS'), '#4a5858');
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 0.46), [side, side, plainM(K('deckTop'), '#6a6a66'), side, girderMat(), side]); deck.position.y = DECK - 0.09;
  const g = group(deck);
  [-2.4, 0, 2.4].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, DECK - 0.18, 0.4), brickMat()); p.position.set(x, (DECK - 0.18) / 2, 0); g.add(p); });
  const rail = plainM(K('rail'), '#8a8e94');
  [-0.09, 0.09].forEach((dz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.03, 0.025), rail); r.position.set(0, DECK + 0.015, dz); g.add(r); });
  for (let x = -3.1; x <= 3.1; x += 0.4) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), side); f.position.set(x, DECK + 0.08, 0.22); g.add(f); }
  const fr = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.02, 0.02), side); fr.position.set(0, DECK + 0.16, 0.22); g.add(fr);
  return g;
}

// ── the four bars
function shopFront(i: number) {
  const s = SHOPS[i];
  const glow = (c: Ctx, H: number) => {
    if (s.kind === 'izakaya') { c.fillStyle = '#ffc070'; c.fillRect(0.12, 0.6, 1.11, H - 0.72); }
    if (s.kind === 'ramen') { c.fillStyle = '#fff0c0'; c.fillRect(0.1, 0.6, 0.48, H - 0.66); c.fillRect(0.7, 0.62, 0.55, 0.36); }
    if (s.kind === 'oden') { c.fillStyle = '#ffc880'; c.fillRect(0.45, 0.6, 0.45, H - 0.66); c.fillRect(0.1, 0.66, 0.25, 0.22); }
    if (s.kind === 'snack') { soft(c, 0.68, 0.85, 0.09, '#ff8ad0'); c.fillStyle = '#ffb0e0'; c.beginPath(); c.arc(0.68, 0.85, 0.055, 0, 7); c.fill(); }
    c.fillStyle = '#ffd890'; c.fillRect(0.18, 0.14, 0.3, 0.18);
  };
  return boardMat(K('front' + i), SW, SH, (c, W, H) => {
    c.fillStyle = s.wall; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 8; k++) blob(c, rand(0, W), rand(0, 0.4), rand(0.04, 0.1), mix(s.wall, '#2a2420', 0.15), 0.4, 0.4);
    // the flat above: a window, the air conditioner, pipes
    c.fillStyle = '#3a4250'; c.fillRect(0.18, 0.14, 0.3, 0.18); c.strokeStyle = '#d8d0c0'; c.lineWidth = 0.015; c.strokeRect(0.18, 0.14, 0.3, 0.18); c.beginPath(); c.moveTo(0.33, 0.14); c.lineTo(0.33, 0.32); c.stroke();
    c.fillStyle = '#e8e4dc'; c.fillRect(0.82, 0.16, 0.3, 0.17); c.strokeStyle = '#a8a49c'; c.lineWidth = 0.006; for (let x = 0.85; x < 1.1; x += 0.025) { c.beginPath(); c.moveTo(x, 0.19); c.lineTo(x, 0.3); c.stroke(); }
    c.fillStyle = '#9a968e'; c.fillRect(W - 0.08, 0, 0.03, H); c.fillRect(0.6, 0.0, 0.025, 0.4);
    // the sign band (the lightbox sits on it) and the ground floor
    c.fillStyle = '#2a2420'; c.fillRect(0.04, 0.4, W - 0.08, 0.14);
    if (s.kind === 'izakaya') {
      c.fillStyle = '#f2dca8'; c.fillRect(0.12, 0.6, 1.11, H - 0.72);
      c.strokeStyle = '#5a3a26'; c.lineWidth = 0.012; for (let x = 0.12; x <= 1.24; x += 0.055) { c.beginPath(); c.moveTo(x, 0.6); c.lineTo(x, H - 0.12); c.stroke(); } for (let y = 0.6; y < H - 0.1; y += 0.13) { c.beginPath(); c.moveTo(0.12, y); c.lineTo(1.23, y); c.stroke(); }
      c.fillStyle = '#5a3a26'; c.fillRect(0.66, 0.58, 0.04, H - 0.58); c.fillRect(0.1, H - 0.12, 1.15, 0.12);
    }
    if (s.kind === 'ramen') {
      c.fillStyle = '#fff0c0'; c.fillRect(0.1, 0.6, 0.48, H - 0.66); c.fillStyle = '#c8a878'; c.fillRect(0.1, 0.95, 0.48, 0.08); [0.2, 0.34, 0.48].forEach((x) => { c.fillStyle = '#c4362f'; c.fillRect(x - 0.03, 1.03, 0.06, 0.03); c.fillStyle = '#5a5048'; c.fillRect(x - 0.008, 1.06, 0.016, H - 1.12); });
      c.fillStyle = '#fff0c0'; c.fillRect(0.7, 0.62, 0.55, 0.36); [0.8, 0.98, 1.16].forEach((x) => { dab(c, x, 0.86, 0.06, '#f2ead8'); dab(c, x, 0.84, 0.045, '#e8a840'); soft(c, x, 0.72, 0.05, '#ffffff', 0.7); });
      c.strokeStyle = '#3a3a40'; c.lineWidth = 0.02; c.strokeRect(0.1, 0.6, 0.48, H - 0.66); c.strokeRect(0.7, 0.62, 0.55, 0.36);
      c.fillStyle = '#8a7a60'; c.fillRect(0.68, 1.0, 0.6, H - 1.0);
    }
    if (s.kind === 'oden') {
      c.save(); c.translate(0, 0.56); wood(c, W, H - 0.56, '#5a4030', { dir: 'v', plank: 0.1 }); c.restore();
      c.fillStyle = '#ffe8c0'; c.fillRect(0.45, 0.6, 0.45, H - 0.66); c.strokeStyle = '#3a2a1e'; c.lineWidth = 0.012; for (let y = 0.6; y < H; y += 0.1) { c.beginPath(); c.moveTo(0.45, y); c.lineTo(0.9, y); c.stroke(); } c.beginPath(); c.moveTo(0.675, 0.6); c.lineTo(0.675, H); c.stroke();
      c.fillStyle = '#ffe8c0'; c.fillRect(0.1, 0.66, 0.25, 0.22); c.strokeStyle = '#3a2a1e'; c.strokeRect(0.1, 0.66, 0.25, 0.22);
      text(c, 'おでん', 1.08, 0.86, 0.06, '#f2ead8', { vertical: true });
    }
    if (s.kind === 'snack') {
      c.fillStyle = '#2a2236'; c.fillRect(0.5, 0.62, 0.36, H - 0.62); c.fillStyle = '#ffb0e0'; c.beginPath(); c.arc(0.68, 0.85, 0.055, 0, 7); c.fill();
      c.strokeStyle = '#c8a050'; c.lineWidth = 0.012; c.strokeRect(0.5, 0.62, 0.36, H - 0.62); dab(c, 0.82, 1.0, 0.012, '#c8a050');
      ['#f2d24a', '#9ad8ff', '#ff9ad8'].forEach((col, k) => dab(c, 0.18 + k * 0.08, 0.8 + (k % 2) * 0.06, 0.02, col));
      text(c, '会員制', 0.25, 1.05, 0.05, '#c8a8e0');
    }
  }, { ppu: 300, emissive: (c, _W, H) => glow(c, H) });
}
const shopSide = (i: number) => boardMat(K('side' + i), SD, SH, (c, W, H) => { c.fillStyle = mix(SHOPS[i].wall, '#2a2420', 0.2); c.fillRect(0, 0, W, H); c.fillStyle = '#7a766e'; c.fillRect(W * 0.3, 0, 0.03, H); mottle(c, 0, H * 0.7, W, H * 0.3, ['#4a4440', '#6a645c'], 8, [0.04, 0.1], 0.3); }, { ppu: 200 });
function buildShop(i: number) { const s = shopSide(i); return foldBox({ w: SW, d: SD, h: SH, top: plainM(K('shopTop'), '#5a5650'), front: shopFront(i), back: s, left: s, right: s }); }
// awnings: striped or corrugated boards leaning out over the doors
function awningMat(i: number) { const [a, b] = SHOPS[i].awning; return boardMat(K('awn' + i), SW + 0.05, AW.l, (c, W, H) => { for (let x = 0; x < W; x += 0.15) { c.fillStyle = Math.round(x / 0.15) % 2 ? b : a; c.fillRect(x, 0, 0.15, H); } c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 0, W, 0.03); c.fillStyle = a; for (let x = 0; x < W; x += 0.075) { c.beginPath(); c.arc(x + 0.0375, H - 0.01, 0.0375, 0, Math.PI); c.fill(); } }, { ppu: 300 }); }
function buildAwnings(ids: number[]) {
  const g = group();
  ids.forEach((i) => { const pv = new THREE.Group(); pv.position.set(SHOPS_X[i], AW.y, FZ); pv.rotation.x = AW.a; const b = board(SW + 0.05, AW.l, 0.02, awningMat(i), plainM(K('awnU'), '#4a4440')); b.position.set(0, 0, AW.l / 2); pv.add(b); g.add(pv); });
  return g;
}
// the little flat above the middle shops: balcony, AC units
const flatFront = () => boardMat(K('flat'), F2.w, F2.h, (c, W, H) => {
  c.fillStyle = '#b8b0a0'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(80,70,60,.25)'; for (let y = 0.1; y < H; y += 0.1) c.fillRect(0, y, W, 0.008);
  [0.25, 1.05, 1.85].forEach((x) => { c.fillStyle = '#3a4250'; c.fillRect(x, 0.08, 0.45, 0.28); c.fillStyle = '#e8e0d0'; c.fillRect(x, 0.08, 0.2, 0.28); c.strokeStyle = '#5a5048'; c.lineWidth = 0.012; c.strokeRect(x, 0.08, 0.45, 0.28); });
}, { ppu: 260, emissive: (c) => { [0.25, 1.85].forEach((x) => { c.fillStyle = '#ffe0a0'; c.fillRect(x + 0.2, 0.08, 0.25, 0.28); }); } });
function buildFlat() {
  const side = plainM(K('flatSide'), '#a8a090');
  const box = foldBox({ w: F2.w, d: F2.d, h: F2.h, top: plainM(K('flatTop'), '#6a6660'), front: flatFront(), back: side, left: side, right: side });
  const acM = plainM(K('ac'), '#e8e4dc');
  const g = group(box);
  [[-F2.w / 2 - 0.14, 0.1], [F2.w / 2 + 0.14, -0.1]].forEach(([x, z]) => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.14), acM); a.position.set(x, 0.08, z); g.add(a); });
  return g;
}
const clothA = (k: number) => cutoutAsset(K('cloth' + k), (p) => {
  if (k === 0) poly(p, [[-0.1, 0], [-0.12, -0.08], [-0.07, -0.08], [-0.07, -0.24], [0.07, -0.24], [0.07, -0.08], [0.12, -0.08], [0.1, 0]]); // shirt
  else if (k === 1) poly(p, [[-0.08, 0], [0.08, 0], [0.08, -0.12], [0.02, -0.14], [0.0, -0.06], [-0.02, -0.14], [-0.08, -0.12]]); // shorts
  else rrect(p, -0.09, -0.26, 0.09, 0, 0.01); // towel
}, (c) => { c.fillStyle = ['#7ab0e0', '#e8a83a', '#f2ead8'][k]; c.fillRect(-0.2, -0.3, 0.4, 0.32); if (k === 2) { c.fillStyle = '#c4362f'; c.fillRect(-0.1, -0.22, 0.2, 0.02); } }, { ppu: 700, t: 0.008, ink: 0.008 });
function buildLaundry() {
  const rail = plainM(K('balc'), '#6a6a70'), g = group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 0.02), rail); bar.position.y = 0.3; g.add(bar);
  for (let x = -1.0; x <= 1.01; x += 0.25) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.3, 0.015), rail); p.position.set(x, 0.15, 0); g.add(p); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.6, 5), plainM(K('rod'), '#c8c8d0')); pole.rotation.z = Math.PI / 2; pole.position.set(0, 0.42, -0.08); g.add(pole);
  const cl = [-0.6, -0.35, -0.1, 0.25, 0.5].map((x, i) => { const pv = new THREE.Group(); pv.position.set(x, 0.42, -0.08); pv.add(cutout(clothA(i % 3))); g.add(pv); return pv; });
  g.userData.tick = (t) => cl.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.3 + i) * 0.12; });
  return g;
}

// ── signs
const lightboxMat = (i: number) => memo(K('lb' + i), () => {
  const W = 512, H = 96, a = newCanvas(W, H), x = a.getContext('2d')!;
  const bg = ['#f6efe0', '#f2d24a', '#f6efe0', '#3a2a4a'][i], fg = ['#c4362f', '#c4362f', '#2a2420', '#ff9ad8'][i];
  x.fillStyle = bg; x.fillRect(0, 0, W, H); x.font = `900 66px ${i === 3 ? JPG : '"Hiragino Mincho ProN","Yu Mincho",serif'}`; x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(SHOPS[i].sign, W / 2, H / 2 + 4);
  const m = paperMat(toTex(a)); glowing(m); m.emissiveMap = toTex(a); return m;
});
function buildSigns() {
  const g = group(), edge = plainM(K('lbEdge'), '#3a3a3a');
  SHOPS_X.forEach((x, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.06), [edge, edge, edge, edge, lightboxMat(i), edge]); b.position.set(x, SH + 0.1, 0.04); g.add(b); const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.03), edge); leg.position.set(x, SH + 0.01, 0.03); g.add(leg); });
  return g;
}
const neonA = () => cutoutAsset(K('neon'), (p) => { rrect(p, -0.14, 0.62, 0.14, 1.98, 0.04); }, (c) => {
  c.fillStyle = '#2a2236'; c.fillRect(-0.2, 0.6, 0.4, 1.4); c.strokeStyle = '#ff6ac8'; c.lineWidth = 0.014; c.beginPath(); rrect(c, -0.11, 0.65, 0.11, 1.95, 0.03); c.stroke();
  text(c, 'スナック', 0, 1.42, 0.12, '#ff9ad8', { vertical: true, font: JPG }); text(c, 'カラオケ', 0, 0.86, 0.06, '#9ad8ff', { vertical: false, font: JPG });
}, { ppu: 400, emissive: (c) => { c.strokeStyle = '#ff6ac8'; c.lineWidth = 0.02; c.beginPath(); rrect(c, -0.11, 0.65, 0.11, 1.95, 0.03); c.stroke(); text(c, 'スナック', 0, 1.42, 0.12, '#ff9ad8', { vertical: true, font: JPG }); text(c, 'カラオケ', 0, 0.86, 0.06, '#9ad8ff', { font: JPG }); } });
function buildNeon() { const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.64, 0.05), plainM(K('neonPost'), '#3a3a40')); post.position.y = 0.32; return group(post, cutout(neonA())); }
const norenA = (i: number) => cutoutAsset(K('noren' + i), (p) => { const w = 0.27; p.moveTo(-w, 0.02); p.lineTo(w, 0.02); for (let k = 2; k >= -2; k--) { p.lineTo(k * 0.11 + 0.05, -0.32); p.lineTo(k * 0.11 - 0.05, -0.32); } p.closePath(); }, (c) => {
  const col = ['#2f4a7a', '#c4362f', '#3a5a3a'][i]; c.fillStyle = col; c.fillRect(-0.3, -0.4, 0.6, 0.45); c.fillStyle = mix(col, '#000', 0.3); c.fillRect(-0.3, -0.02, 0.6, 0.04);
  text(c, ['酒', '麺', 'おでん'][i], 0, -0.16, i === 2 ? 0.08 : 0.14, '#f2ead8');
}, { ppu: 500, t: 0.01, ink: 0.01 });
const NOREN_AT = [[SHOPS_X[0] - 0.08, 0], [SHOPS_X[1] - 0.33, 1], [SHOPS_X[2] - 0.05, 2]];
function buildNoren() {
  const g = group(), rod = plainM(K('nrod'), '#3a2a1e');
  const pv = NOREN_AT.map(([x, i]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), rod); r.rotation.z = Math.PI / 2; r.position.set(x, 0.75, 0.03); g.add(r); const p = new THREE.Group(); p.position.set(x, 0.75, 0.035); p.add(cutout(norenA(i))); g.add(p); return p; });
  g.userData.tick = (t) => pv.forEach((p, i) => { p.rotation.x = -0.03 + Math.sin(t * 1.4 + i) * 0.05; });
  return g;
}
const standA = (k: number) => cutoutAsset(K('stand' + k), (p) => rrect(p, -0.15, 0, 0.15, 0.48, 0.02), (c) => {
  c.fillStyle = '#2a3a2a'; c.fillRect(-0.2, 0, 0.4, 0.5); c.fillStyle = '#8a6a48'; c.fillRect(-0.2, 0, 0.4, 0.03);
  if (k === 0) { text(c, '生ビール', 0, 0.38, 0.045, '#f2d24a', { font: JPG }); dab(c, 0, 0.22, 0.06, '#e8b83a'); c.fillStyle = '#fbf6ec'; c.fillRect(-0.06, 0.26, 0.12, 0.03); text(c, '¥500', 0, 0.1, 0.05, '#f2ead8', { font: JPG }); }
  else { text(c, '本日の', 0, 0.4, 0.04, '#f2ead8', { font: JPG }); text(c, 'おすすめ', 0, 0.33, 0.045, '#f2d24a', { font: JPG }); ['大根', 'たまご', 'ちくわ'].forEach((t, j) => text(c, t, 0, 0.24 - j * 0.065, 0.04, '#f2ead8', { font: JPG })); }
}, { ppu: 600, t: 0.02 });
function buildStands() {
  const g = group();
  [[-1.2, 0.05, 0], [0.98, -0.25, 1]].forEach(([x, z, k]) => [-1, 1].forEach((s) => { const m = cutout(standA(k)); m.position.set(x, 0, z + s * 0.06); m.rotation.x = s * 0.18; if (s < 0) m.rotation.y = Math.PI; g.add(m); }));
  return g;
}
// lanterns
const LANTERN_PTS = (() => { const p: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const y = -0.07 + (0.14 * i) / 10; p.push(new THREE.Vector2(0.025 + 0.04 * Math.sqrt(Math.max(0, 1 - (y / 0.07) ** 2)), y)); } return p; })();
const lanternMat = (col: string) => memo(K('lan' + col), () => {
  const m = latheMat(K('lanTex' + col), 128, 64, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 6; y < h; y += 9) c.fillRect(0, y, w, 2);
    c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, 5); c.fillRect(0, h - 5, w, 5);
    text(c, col === '#d6322b' ? '酒' : '灯', w / 4, h / 2, 24, col === '#d6322b' ? '#f2ead8' : '#c4362f');
  });
  glowing(m); m.emissiveMap = m.map; return m;
});
function buildLanterns() {
  const g = group(), geo = new THREE.LatheGeometry(LANTERN_PTS, 14), cord = new THREE.LineBasicMaterial({ color: '#2a2420' });
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(-2.85, 0.1, 0), new V3(2.85, 0.1, 0)]), cord));
  const ls: THREE.Mesh[] = [];
  for (let x = -2.7, i = 0; x <= 2.71; x += 0.36, i++) { const l = new THREE.Mesh(geo, lanternMat(i % 3 ? '#d6322b' : '#f7f2e8')); l.position.set(x, 0, 0); g.add(l); ls.push(l); }
  g.userData.tick = (t) => ls.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.2 + i * 0.7) * 0.05; });
  return g;
}
const akaMat = () => memo(K('aka'), () => { const m = latheMat(K('akaTex'), 256, 128, (c, w, h) => { c.fillStyle = '#d6322b'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.15)'; for (let y = 8; y < h; y += 12) c.fillRect(0, y, w, 3); c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); text(c, '酒', w / 4, h / 2, 64, '#f6efe0'); text(c, '酒', (w * 3) / 4, h / 2, 64, '#f6efe0'); }); glowing(m); m.emissiveMap = m.map; return m; });
function buildAka() {
  const pts: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const y = -0.2 + (0.4 * i) / 12; pts.push(new THREE.Vector2(0.05 + 0.1 * Math.sqrt(Math.max(0, 1 - (y / 0.2) ** 2)), y)); }
  const lan = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), akaMat()); lan.position.y = -0.24;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.22), plainM(K('arm'), '#3a2a1e')); arm.position.set(0, 0, -0.11);
  const pv = new THREE.Group(); pv.add(lan);
  const g = group(arm, pv);
  g.userData.tick = (t) => { pv.rotation.z = Math.sin(t * 0.9) * 0.05; };
  return g;
}
const bulbMat = () => memo(K('bulb'), () => glowing(toon({ color: '#fff2c8' })));
const catenary = (a: THREE.Vector3, b: THREE.Vector3, sag: number, n = 30) => Array.from({ length: n + 1 }, (_, i) => new V3().lerpVectors(a, b, i / n).add(new V3(0, -Math.sin((Math.PI * i) / n) * sag, 0)));
function buildBulbs() {
  const pts = catenary(new V3(-POLE_X, 1.78, 0), new V3(POLE_X, 1.78, 0), 0.38, 40);
  const g = group(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2420' })));
  const geo = new THREE.SphereGeometry(0.03, 8, 6);
  for (let i = 2; i < pts.length - 1; i += 2) { const b = new THREE.Mesh(geo, bulbMat()); b.position.copy(pts[i]).add(new V3(0, -0.035, 0)); g.add(b); }
  return g;
}
function buildPoles() {
  const conc = plainM(K('conc'), '#a8a49c'), g = group(), wireM = new THREE.LineBasicMaterial({ color: '#2a2a30' });
  [-POLE_X, POLE_X].forEach((x) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 2.3, 10), conc); p.position.set(x, 1.15, 0); g.add(p);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), conc); arm.position.set(x, 2.1, 0); g.add(arm);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 10), plainM(K('trans'), '#8a9094')); tr.position.set(x + Math.sign(-x) * 0.12, 1.85, 0); g.add(tr);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.01), plainM(K('tag'), '#f2d24a')); tag.position.set(x, 0.9, 0.055); g.add(tag);
  });
  [[2.1, 0.22, 0.2], [2.1, 0.2, -0.2], [2.0, 0.3, 0]].forEach(([y, sag, z]) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(catenary(new V3(-POLE_X, y, z), new V3(POLE_X, y, z), sag)), wireM)));
  // wires running back over the roofs to the viaduct
  [-1, 1].forEach((s) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(catenary(new V3(s * POLE_X, 2.05, 0), new V3(s * 1.6, DECK + 0.3, OZ - POLE_Z), 0.15)), wireM)));
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
const lampHeadMat = () => memo(K('lampHead'), () => glowing(toon({ color: '#f2f2e8' })));
function buildLamp() {
  const dark = plainM(K('lampPost'), '#3a4040');
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.45, 8), dark); post.position.y = 0.725;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.28), dark); arm.position.set(0, 1.43, 0.13);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.06, 12, 1, true), plainM(K('shade'), '#3a4040', { side: THREE.DoubleSide })); shade.position.set(0, 1.41, 0.27);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), lampHeadMat()); bulb.position.set(0, 1.37, 0.27);
  return group(post, arm, shade, bulb);
}

// ── the street: yakitori stall, beer crates, vending machines, a bicycle, pot plants
const stallFront = () => boardMat(K('stallF'), 1.1, 0.5, (c, W, H) => { wood(c, W, H, '#8a6a48', { dir: 'h', plank: 0.1 }); c.fillStyle = '#f2ead8'; c.fillRect(0.3, 0.08, 0.5, 0.3); text(c, '焼鳥', 0.55, 0.23, 0.15, '#c4362f'); }, { ppu: 300 });
const coalMat = () => memo(K('coal'), () => { const m = toon({ color: '#3a2a22' }); m.emissive = new THREE.Color('#ff6a2a'); m.emissiveIntensity = 0.3; return m; });
function buildStall() {
  const side = plainM(K('stallS'), '#6a5038');
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.45), [side, side, plainM(K('stallT'), '#a07a50'), side, stallFront(), side]); counter.position.y = 0.25;
  const grill = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.16), [side, side, coalMat(), side, side, side]); grill.position.set(0, 0.54, -0.08);
  const g = group(counter, grill);
  const stick = plainM(K('skewerS'), '#d8c08a'), meat = plainM(K('meat'), '#a0582a');
  for (let i = 0; i < 9; i++) { const x = -0.3 + i * 0.075; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), stick); s.rotation.x = Math.PI / 2; s.position.set(x, 0.6, -0.08); g.add(s); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), meat); b.position.set(x, 0.6, -0.12 + k * 0.04); g.add(b); } }
  [-0.5, 0.5].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.04), side); p.position.set(x, 0.5 + 0.425, -0.2); g.add(p); });
  const roof = gableRoof({ w: 1.3, l: 0.42, angle: 0.4, top: boardMat(K('stallRoof'), 1.3, 0.42, (c, W, H) => { for (let x = 0; x < W; x += 0.13) { c.fillStyle = Math.round(x / 0.13) % 2 ? '#f2ead8' : '#c4362f'; c.fillRect(x, 0, 0.13, H); } }, { ppu: 200 }), under: side });
  roof.position.set(0, 1.42, -0.2); g.add(roof);
  const lan = new THREE.Mesh(new THREE.LatheGeometry(LANTERN_PTS, 14), lanternMat('#d6322b')); lan.scale.setScalar(1.6); lan.position.set(0.45, 1.12, 0.05); g.add(lan);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
const crateMat = () => memo(K('crate'), () => { const cv = newCanvas(64, 64), c = cv.getContext('2d')!; c.fillStyle = '#e8b83a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#c4902a'; [10, 28, 46].forEach((y) => c.fillRect(6, y, 52, 8)); c.fillStyle = '#c4362f'; c.fillRect(20, 2, 24, 6); return toon({ map: toTex(cv) }); });
function crate(x: number, y: number, z: number, ry = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.26), crateMat()); m.position.set(x, y + 0.125, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; return m; }
function buildCrates() {
  const g = group(crate(0, 0, 0), crate(0, 0.25, 0, 0.05), crate(-0.62, 0, 0.35, 0.2), crate(0.62, 0, 0.4, -0.15), crate(0.75, 0, -0.55), crate(0.75, 0.25, -0.55, 0.1), crate(0.75, 0.5, -0.55, -0.05));
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.42), plainM(K('tableTop'), '#a07a50')); top.position.y = 0.515; g.add(top);
  const bottle = plainM(K('bottle'), '#6a3a1a'), glass = plainM(K('glass'), '#f2c84a'), foam = plainM(K('foam'), '#fbf6ec');
  [[-0.15, 0.05], [0.18, -0.08]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 8), bottle); b.position.set(x, 0.63, z); g.add(b); });
  [[0.02, 0.1], [-0.05, -0.1], [0.22, 0.12]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.028, 0.08, 8), glass); m.position.set(x, 0.57, z); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.02, 8), foam); f.position.set(x, 0.62, z); g.add(m, f); });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.015, 12), plainM(K('plate'), '#f2ead8')); plate.position.set(-0.15, 0.54, -0.1); g.add(plate);
  return g;
}
const vendFront = (k: number) => boardMat(K('vend' + k), 0.42, 0.75, (c, W, H) => {
  c.fillStyle = k ? '#d8302a' : '#f2f2ee'; c.fillRect(0, 0, W, H); c.fillStyle = '#f6f8fa'; c.fillRect(0.03, 0.04, W - 0.06, 0.36);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { const x = 0.06 + i * 0.07, y = 0.08 + r * 0.11; c.fillStyle = pick(['#3f8fd0', '#e8b83a', '#4f9a4a', '#d8302a', '#8a5a3a', '#f2f2ee']); c.fillRect(x, y, 0.04, 0.07); c.fillStyle = '#d8302a'; c.fillRect(x, y + 0.075, 0.04, 0.012); }
  c.fillStyle = '#2a2a30'; c.fillRect(0.06, 0.6, W - 0.12, 0.08); c.fillStyle = k ? '#f2f2ee' : '#3f8fd0'; c.fillRect(0.03, 0.44, W - 0.06, 0.12);
}, { ppu: 400, emissive: (c, W) => { c.fillStyle = '#f2f6ff'; c.fillRect(0.03, 0.04, W - 0.06, 0.36); } });
function buildVending() {
  const g = group();
  [0, 1].forEach((k) => { const side = plainM(K('vendS' + k), k ? '#c02a24' : '#dcdcd8'); const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.32), [side, side, side, side, vendFront(k), side]); m.position.set((k - 0.5) * 0.44, 0.375, 0); m.castShadow = true; g.add(m); });
  return g;
}
const bikeA = () => cutoutAsset(K('bike'), (p) => {
  // two rings joined by the frame: an outline that walks round both wheels
  const wheel = (cx: number, a0: number, a1: number) => { for (let i = 0; i <= 20; i++) { const a = a0 + ((a1 - a0) * i) / 20; p.lineTo(cx + Math.cos(a) * 0.17, 0.17 + Math.sin(a) * 0.17); } };
  p.moveTo(-0.3, 0.0); wheel(-0.3, -Math.PI / 2, Math.PI * 1.5 - 0.5); p.lineTo(-0.26, 0.5); p.lineTo(-0.18, 0.52); p.lineTo(-0.14, 0.46); p.lineTo(0.22, 0.46); p.lineTo(0.27, 0.58); p.lineTo(0.36, 0.6); p.lineTo(0.32, 0.36); wheel(0.3, Math.PI * 0.6, Math.PI * 2.5); p.lineTo(0.0, 0.2); p.closePath();
}, (c) => {
  c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(-0.6, -0.1, 1.2, 0.8);
  c.fillStyle = '#d8d0c0'; c.fillRect(-0.6, -0.1, 1.2, 0.8);
  [-0.3, 0.3].forEach((x) => { c.strokeStyle = '#2a2a2a'; c.lineWidth = 0.035; c.beginPath(); c.arc(x, 0.17, 0.155, 0, 7); c.stroke(); c.strokeStyle = '#a8a8a8'; c.lineWidth = 0.006; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(x, 0.17); c.lineTo(x + Math.cos(k) * 0.14, 0.17 + Math.sin(k) * 0.14); c.stroke(); } });
  c.strokeStyle = '#3f8fd0'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-0.3, 0.17); c.lineTo(-0.2, 0.46); c.lineTo(0.22, 0.44); c.lineTo(0.3, 0.17); c.moveTo(0.0, 0.17); c.lineTo(-0.2, 0.46); c.moveTo(0.0, 0.17); c.lineTo(0.22, 0.44); c.stroke();
  c.fillStyle = '#2a2420'; c.fillRect(-0.27, 0.48, 0.12, 0.04); c.fillStyle = '#a8a8a8'; c.fillRect(0.25, 0.55, 0.12, 0.03);
  c.fillStyle = '#c8b48a'; c.fillRect(0.24, 0.36, 0.14, 0.1); // basket
}, { ppu: 500, t: 0.02, ink: 0.008 });
function buildPlants() {
  const g = group(), pot = plainM(K('pot'), '#b8653a'), leaf = plainM(K('leafP'), '#4f8a40'), leaf2 = plainM(K('leafP2'), '#6aa84f');
  [[0.18, -0.5, 0.1], [0.38, -0.47, 0.08], [2.55, -0.5, 0.11], [-2.75, -0.48, 0.09]].forEach(([x, z, r], i) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, r * 1.4, 10), pot); p.position.set(x, r * 0.7, z); g.add(p);
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * 1.4, 10, 8), i % 2 ? leaf2 : leaf); b.scale.y = 1.2; b.position.set(x, r * 1.4 + r * 1.1, z); g.add(b);
  });
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.13, 10), plainM(K('bucket'), '#3f8fd0')); bucket.position.set(2.35, 0.065, -0.47); g.add(bucket);
  const umb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), plainM(K('umb'), '#f2ead8')); umb.position.set(-2.6, 0.25, -0.48); umb.rotation.z = 0.15; g.add(umb);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}

// ── people and cats
const chefA = () => cutoutAsset(K('chef'), figure(0.95, 0.17), (c) => {
  c.fillStyle = '#f2f2ea'; c.fillRect(-0.25, 0.3, 0.5, 0.5); c.fillStyle = '#2f3a5a'; c.fillRect(-0.25, 0, 0.5, 0.32); c.fillStyle = '#2f3a5a'; c.fillRect(-0.03, 0.4, 0.06, 0.38);
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.86, 0.09, 0.095, 0, 0, 7); c.fill();
  c.fillStyle = '#f2f2ea'; c.fillRect(-0.095, 0.9, 0.19, 0.035); dab(c, 0.09, 0.92, 0.02, '#f2f2ea'); // hachimaki
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.94, 0.09, 0.03, 0, Math.PI, 0, true); c.fill();
  face(c, 0.85, 0.085);
}, { ppu: 700 });
const fanA = () => cutoutAsset(K('uchiwa'), (p) => { p.moveTo(-0.01, 0); p.lineTo(0.01, 0); p.lineTo(0.01, 0.07); for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + 0.1 + ((Math.PI * 2 - 0.2) * i) / 20; p.lineTo(Math.cos(a) * 0.07, 0.14 + Math.sin(a) * 0.07); } p.lineTo(-0.01, 0.07); p.closePath(); }, (c) => { c.fillStyle = '#c8a878'; c.fillRect(-0.02, 0, 0.04, 0.1); c.fillStyle = '#f2ead8'; c.beginPath(); c.arc(0, 0.14, 0.07, 0, 7); c.fill(); dab(c, 0, 0.14, 0.035, '#c4362f'); }, { ppu: 900, t: 0.008 });
function buildChef() {
  const fan = new THREE.Group(); fan.position.set(0.17, 0.5, 0.02); fan.add(cutout(fanA()));
  const g = group(cutout(chefA()), fan);
  g.userData.tick = (t) => { fan.rotation.z = -0.4 + Math.sin(t * 8) * 0.35; };
  return g;
}
const salarymanA = () => cutoutAsset(K('salaryman'), figure(1.0, 0.16), (c) => {
  c.fillStyle = '#3a3e4a'; c.fillRect(-0.25, 0, 0.5, 0.45); c.fillStyle = '#f6f6f2'; c.fillRect(-0.25, 0.42, 0.5, 0.4);
  c.fillStyle = '#c4362f'; c.beginPath(); poly(c, [[-0.02, 0.8], [0.02, 0.8], [0.05, 0.6], [0.0, 0.52], [-0.03, 0.6]]); c.fill(); // loosened tie
  c.fillStyle = '#e8b83a'; c.fillRect(0.08, 0.5, 0.08, 0.12); c.fillStyle = '#fbf6ec'; c.fillRect(0.08, 0.6, 0.08, 0.03); c.strokeStyle = '#d8d0c0'; c.lineWidth = 0.01; c.beginPath(); c.arc(0.17, 0.56, 0.03, -1.4, 1.4); c.stroke(); // beer mug
  c.fillStyle = '#2a2420'; c.fillRect(-0.12, 0, 0.1, 0.03); c.fillRect(0.02, 0, 0.1, 0.03);
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.9, 0.09, 0.095, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.96, 0.095, 0.05, 0, Math.PI, 0, true); c.fill();
  c.fillStyle = '#3a3a40'; c.lineWidth = 0.008; c.strokeStyle = '#3a3a40'; c.strokeRect(-0.07, 0.88, 0.055, 0.035); c.strokeRect(0.015, 0.88, 0.055, 0.035);
  soft(c, -0.06, 0.85, 0.03, '#ff7a6a', 0.9); soft(c, 0.06, 0.85, 0.03, '#ff7a6a', 0.9); // red from the beer
  c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; c.beginPath(); c.arc(0, 0.84, 0.02, 0.2, Math.PI - 0.2); c.stroke();
}, { ppu: 700 });
function buildSalaryman() { const m = cutout(salarymanA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 0.8) * 0.05; }; return g; }
const friendA = (k: number) => cutoutAsset(K('friend' + k), seatedOutline, (c) => {
  c.fillStyle = k ? '#2f3a4a' : '#c8a8d0'; c.fillRect(-0.25, 0, 0.5, 0.32);
  c.fillStyle = k ? '#7ab07a' : '#f2ead8'; c.fillRect(-0.25, 0.28, 0.5, 0.26); if (!k) for (let i = 0; i < 8; i++) dab(c, rand(-0.18, 0.18), rand(0.3, 0.5), 0.012, '#e8743a');
  c.fillStyle = '#e8b83a'; c.fillRect(k ? -0.17 : 0.1, 0.42, 0.07, 0.1); c.fillStyle = '#fbf6ec'; c.fillRect(k ? -0.17 : 0.1, 0.5, 0.07, 0.025);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.61, 0.085, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = k ? '#2a2420' : '#5a3a2a'; c.beginPath(); c.ellipse(0, 0.65, 0.095, 0.06, 0, Math.PI, 0, true); c.fill(); if (!k) { c.fillRect(-0.095, 0.55, 0.035, 0.1); c.fillRect(0.06, 0.55, 0.035, 0.1); }
  face(c, 0.6, 0.08); c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; c.beginPath(); c.arc(0, 0.56, 0.025, 0.1, Math.PI - 0.1); c.stroke();
}, { ppu: 800 });
function buildFriends() {
  const g = group(), fr = [0, 1].map((k) => { const m = cutout(friendA(k)); m.position.x = k ? 0.35 : -0.35; g.add(m); return m; });
  g.userData.tick = (t) => fr.forEach((m, i) => { m.rotation.z = Math.sin(t * 2 + i * 2) * 0.03; m.position.y = Math.max(0, Math.sin(t * 1.5 + i)) * 0.01; });
  return g;
}
const girlA = () => cutoutAsset(K('girl'), figure(0.88, 0.15), (c) => {
  c.fillStyle = '#2f4a7a'; c.fillRect(-0.22, 0, 0.44, 0.75); for (let i = 0; i < 12; i++) { const x = rand(-0.14, 0.14), y = rand(0.05, 0.65); dab(c, x, y, 0.02, '#f2ead8'); dab(c, x, y, 0.008, '#e8743a'); }
  c.fillStyle = '#f2c94c'; c.fillRect(-0.16, 0.42, 0.32, 0.08);
  c.fillStyle = '#f5d9bf'; c.fillRect(-0.1, 0, 0.2, 0.035); c.beginPath(); c.ellipse(0, 0.8, 0.085, 0.085, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.85, 0.095, 0.055, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.92, 0.04, '#2a2420'); dab(c, 0.05, 0.92, 0.015, '#f2a8c8');
  face(c, 0.79, 0.08);
  c.fillStyle = '#e8a8c8'; c.fillRect(0.1, 0.25, 0.08, 0.1); c.fillStyle = '#f2ead8'; c.fillRect(0.11, 0.33, 0.06, 0.02); // a bag
}, { ppu: 750 });
function buildGirl() { const fan = new THREE.Group(); fan.position.set(-0.16, 0.42, 0.02); const f = cutout(fanA()); f.scale.setScalar(0.9); fan.add(f); const g = group(cutout(girlA()), fan); g.userData.tick = (t) => { fan.rotation.z = 0.4 + Math.sin(t * 5) * 0.3; }; return g; }
const catA = (black: boolean) => cutoutAsset(K('cat' + black), (p) => { p.moveTo(-0.08, 0); p.lineTo(0.1, 0); p.bezierCurveTo(0.12, 0.12, 0.08, 0.2, 0.06, 0.22); p.lineTo(0.08, 0.3); p.lineTo(0.03, 0.26); p.lineTo(-0.02, 0.26); p.lineTo(-0.06, 0.3); p.lineTo(-0.05, 0.22); p.bezierCurveTo(-0.1, 0.18, -0.12, 0.08, -0.08, 0); p.closePath(); }, (c) => {
  if (black) { c.fillStyle = '#2a2830'; c.fillRect(-0.15, 0, 0.3, 0.32); dab(c, -0.015, 0.22, 0.014, '#f2d24a'); dab(c, 0.035, 0.22, 0.014, '#f2d24a'); dab(c, -0.015, 0.22, 0.006, '#1a1a1a'); dab(c, 0.035, 0.22, 0.006, '#1a1a1a'); }
  else { c.fillStyle = '#c8a070'; c.fillRect(-0.15, 0, 0.3, 0.32); c.strokeStyle = '#8a6a48'; c.lineWidth = 0.012; [0.06, 0.12, 0.18].forEach((y) => { c.beginPath(); c.moveTo(-0.08, y); c.lineTo(0.08, y + 0.02); c.stroke(); }); c.fillStyle = '#f6efe0'; c.beginPath(); c.ellipse(0.01, 0.08, 0.05, 0.06, 0, 0, 7); c.fill(); c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.007; [-0.015, 0.035].forEach((x) => { c.beginPath(); c.arc(x, 0.2, 0.011, 0.3, Math.PI - 0.3); c.stroke(); }); }
}, { ppu: 1000, t: 0.02 });
function buildCat(black: boolean) { const m = cutout(catA(black)), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * (black ? 0.6 : 1.1)) * 0.03; }; return g; }
function buildMoths() {
  const m = memo(K('mothM'), () => toon({ color: '#f2ecd8', side: THREE.DoubleSide })), g = group();
  const ms = [0, 1, 2, 3].map((i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.025), m); g.add(p); return { p, ph: i * 1.6 }; });
  g.userData.tick = (t, ev) => ms.forEach(({ p, ph }) => {
    const a = t * (2.2 + ph * 0.2) + ph;
    p.position.set(Math.cos(a) * 0.12, Math.sin(a * 1.7) * 0.06, Math.sin(a) * 0.12); p.rotation.set(Math.sin(t * 30 + ph) * 0.8, a, 0);
    p.scale.setScalar(Math.max(0.001, ev));
  });
  return g;
}
// ── secret: a takoyaki octopus hiding behind the viaduct
const takoA = () => cutoutAsset(K('tako'), (p) => { p.moveTo(-0.14, 0); for (let i = 0; i < 6; i++) { const x = -0.14 + i * 0.056; p.quadraticCurveTo(x + 0.028, 0.05, x + 0.056, 0); } p.lineTo(0.12, 0.08); p.bezierCurveTo(0.16, 0.3, -0.16, 0.3, -0.12, 0.08); p.closePath(); }, (c) => {
  c.fillStyle = '#ec6a5a'; c.fillRect(-0.2, 0, 0.4, 0.3); c.fillStyle = '#f6a898'; c.beginPath(); c.ellipse(-0.03, 0.2, 0.05, 0.03, -0.3, 0, 7); c.fill();
  c.fillStyle = '#f2ead8'; c.fillRect(-0.12, 0.13, 0.24, 0.025); c.fillStyle = '#4a7ac0'; c.fillRect(-0.12, 0.155, 0.24, 0.01); // hachimaki
  dab(c, -0.04, 0.1, 0.01, '#2a2420'); dab(c, 0.04, 0.1, 0.01, '#2a2420'); dab(c, 0, 0.07, 0.015, '#d8483a');
}, { ppu: 1100, t: 0.02 });
function buildTako() { const m = cutout(takoA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 3) * 0.08; m.position.y = Math.abs(Math.sin(t * 3)) * 0.02; }; return g; }

// ── the train on the viaduct (crosses now and then in the finale)
const carSide = () => boardMat(K('carSide'), 1.5, 0.62, (c, W, H) => {
  c.fillStyle = '#c8ccd0'; c.fillRect(0, 0, W, H); c.fillStyle = '#6ab04a'; c.fillRect(0, H * 0.62, W, 0.06);
  for (let i = 0; i < 4; i++) { const x = 0.1 + i * 0.34; c.fillStyle = '#2f3a46'; c.fillRect(x, 0.1, 0.26, 0.24); }
}, { ppu: 260, emissive: (c) => { for (let i = 0; i < 4; i++) { c.fillStyle = '#f2f6ff'; c.fillRect(0.1 + i * 0.34, 0.1, 0.26, 0.24); } } });
function buildTrain() {
  const g = group(), roofM = plainM(K('carRoof'), '#9a9ea4'), end = plainM(K('carEnd'), '#b8bcc0');
  [-1.55, 0, 1.55].forEach((x) => { const s = carSide(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 0.44), [end, end, roofM, roofM, s, s]); b.position.set(x, 0.39, 0); g.add(b); });
  const under = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.36), plainM(K('carU'), '#3a3a3a')); under.position.y = 0.06; g.add(under);
  return g;
}

// ── ground: asphalt, gutters with grates, a manhole, 止まれ painted on the road
function paintGround(c: Ctx, W: number, D: number) {
  c.fillStyle = '#5c5c62'; c.fillRect(-W / 2, -D / 2, W, D);
  for (let i = 0; i < 30; i++) blob(c, rand(-3, 3), rand(-2.4, 2.4), rand(0.15, 0.4), pick(['#66666c', '#545458']), 0.5, 0.5);
  for (let i = 0; i < 1600; i++) dab(c, rand(-3.2, 3.2), rand(-2.5, 2.5), rand(0.004, 0.01), pick(['#6e6e74', '#4a4a50']), 0.6);
  c.fillStyle = '#8a8680'; c.fillRect(-W / 2, -FZ - 0.02, W, 2.5); // concrete under the buildings
  c.fillStyle = '#7a7670'; c.fillRect(-W / 2, -FZ - 0.12, W, 0.1); for (let x = -3.1; x < 3.1; x += 0.2) { c.fillStyle = '#4a4a4e'; c.fillRect(x, -FZ - 0.11, 0.16, 0.08); for (let k = 0; k < 6; k++) { c.fillStyle = '#7a7670'; c.fillRect(x + 0.01 + k * 0.025, -FZ - 0.105, 0.01, 0.07); } }
  c.fillStyle = '#46464a'; c.beginPath(); c.arc(-0.4, -0.6, 0.18, 0, 7); c.fill(); c.strokeStyle = '#6a6a70'; c.lineWidth = 0.015; for (let r = 0.05; r < 0.18; r += 0.04) { c.beginPath(); c.arc(-0.4, -0.6, r, 0, 7); c.stroke(); }
  text(c, '止まれ', 0.0, -2.05, 0.32, 'rgba(240,240,236,.85)');
  c.fillStyle = 'rgba(240,240,236,.85)'; c.fillRect(-0.75, -2.4, 1.5, 0.05);
  // a puddle catching the lights
  c.fillStyle = 'rgba(70,80,100,.6)'; c.beginPath(); c.ellipse(0.6, -0.4, 0.35, 0.14, 0.2, 0, 7); c.fill();
}

export const YOKOCHO: SceneDef = {
  id: 'yokocho',
  title: 'Uliczka z barami',
  jp: '横丁の夜',
  season: 'koniec lata',
  blurb: 'Wąska uliczka pod wiaduktem: lampiony, grill i pociąg nad dachami.',
  box: ['#2a2450', '#e8583a'],
  seed: 9090,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#7a7670', '#8a8680'] },
  sky: {
    day: { grad: [[0, '#4a8cc8'], [0.5, '#9cc4e0'], [0.85, '#e8dcc8'], [1, '#f2e2c8']], cloud: '#fbf6ec', hi: '#ffffff', edge: '#fbf6ec', shadow: '#c4bcd0' },
    evening: { grad: [[0, '#0e0c2a'], [0.45, '#2a2058'], [0.78, '#6a3a78'], [1, '#d86a6a']], cloud: '#3a3068', hi: '#5a4a88', edge: '#3a3068', shadow: '#221c48', stars: true },
  },
  light: {
    day: { sky: '#fff2dc', ground: '#8a8478', hemi: 1.15, sun: '#ffe8c4', sunI: 2.5, sunPos: [4, 7, 5], bloom: 0.03 },
    evening: { sky: '#5a4a90', ground: '#2a2230', hemi: 0.7, sun: '#9a8ad0', sunI: 0.45, sunPos: [-4, 5, 4], bloom: 0.6 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['city', 'tower', 'overpass'] },
    { name: 'Bary', jp: '店', pieces: ['shop0', 'shop1', 'shop2', 'shop3'] },
    { name: 'Daszki', jp: '屋根', pieces: ['awningsL', 'awningsR', 'flat', 'laundry'] },
    { name: 'Szyldy', jp: '看板', pieces: ['signs', 'neon', 'noren', 'stands', 'aka'] },
    { name: 'Światła', jp: '灯り', pieces: ['lanterns', 'poles', 'bulbs', 'lamp'] },
    { name: 'Ulica', jp: '通り', pieces: ['stall', 'crates', 'vending', 'bike', 'plants'] },
    { name: 'Goście', jp: '客', pieces: ['chef', 'salaryman', 'friends', 'girl'] },
    { name: 'Noc', jp: '夜', pieces: ['cat', 'blackcat', 'moths'] },
  ],
  pieces: {
    city: { name: 'Miasto', pos: [0, 0, -2.45], build: () => group(cutout(cityA())), sound: 'town' },
    tower: { name: 'Wieża', pos: [-1.7, 0, -2.4], build: () => group(cutout(towerA())) },
    overpass: { name: 'Wiadukt', pos: [0, 0, OZ], build: buildOverpass },
    shop0: { name: 'Izakaya', pos: [SHOPS_X[0], 0, SZ], build: () => buildShop(0) },
    shop1: { name: 'Ramen', pos: [SHOPS_X[1], 0, SZ], build: () => buildShop(1) },
    shop2: { name: 'Oden', pos: [SHOPS_X[2], 0, SZ], build: () => buildShop(2) },
    shop3: { name: 'Bar', pos: [SHOPS_X[3], 0, SZ], build: () => buildShop(3) },
    awningsL: { name: 'Daszki', pos: [0, 0, 0], build: () => buildAwnings([0, 1]) },
    awningsR: { name: 'Daszki', pos: [0, 0, 0], build: () => buildAwnings([2, 3]) },
    flat: { name: 'Piętro', pos: [0, SH, F2.z], build: buildFlat },
    laundry: { name: 'Pranie', pos: [0, SH, F2.z + F2.d / 2 + 0.12], build: buildLaundry },
    signs: { name: 'Szyldy', pos: [0, 0, FZ], build: buildSigns },
    neon: { name: 'Neon', pos: [1.435, 0, AW_EDGE.z + 0.06], build: buildNeon },
    noren: { name: 'Noren', pos: [0, 0, FZ], build: buildNoren },
    stands: { name: 'Tablice', pos: [0, 0, 0], build: buildStands },
    aka: { name: 'Lampion', pos: [SHOPS_X[0] - 0.55, 0.86, FZ + 0.24], build: buildAka },
    lanterns: { name: 'Lampiony', pos: [0, AW_EDGE.y - 0.1, AW_EDGE.z], build: buildLanterns },
    poles: { name: 'Słupy', pos: [0, 0, POLE_Z], build: buildPoles },
    bulbs: { name: 'Żarówki', pos: [0, 0, POLE_Z], build: buildBulbs },
    lamp: { name: 'Latarnia', pos: [LAMP_X, 0, FZ + 0.15], build: buildLamp },
    stall: { name: 'Grill', pos: [STALL.x, 0, STALL.z], build: buildStall, sound: 'sizzle' },
    crates: { name: 'Skrzynki', pos: [TABLE.x, 0, TABLE.z], build: buildCrates },
    vending: { name: 'Automaty', pos: [2.75, 0, 0.45], rotY: -0.5, build: buildVending, sound: 'hum' },
    bike: { name: 'Rower', pos: [-0.75, 0, FZ + 0.25], build: () => group(cutout(bikeA())) },
    plants: { name: 'Doniczki', pos: [0, 0, 0], build: buildPlants },
    chef: { name: 'Kucharz', pos: [STALL.x - 0.15, 0, STALL.z - 0.35], build: buildChef },
    salaryman: { name: 'Pan z piwem', pos: [-0.45, 0, 1.3], rotY: 0.15, build: buildSalaryman },
    friends: { name: 'Przyjaciele', pos: [TABLE.x, 0.0, TABLE.z - 0.38], build: buildFriends },
    girl: { name: 'Dziewczyna', pos: [0.3, 0, 1.95], rotY: -0.1, build: buildGirl },
    cat: { name: 'Kot', pos: [TABLE.x + 0.75, 0.75, TABLE.z - 0.55], build: () => buildCat(false) },
    blackcat: { name: 'Czarny kot', pos: [SHOPS_X[1] + 0.25, AW.y - 0.1 * Math.sin(AW.a) - 0.02, FZ + 0.1], build: () => buildCat(true) },
    moths: { name: 'Ćmy', pos: [LAMP_X, 1.36, FZ + 0.42], build: buildMoths },
  },
  secret: { name: 'ośmiorniczka takoyaki', build: buildTako, pos: [1.1, 0, -2.36] },
  sounds: [],
  setup(ctx) {
    const { fx, scene } = ctx;
    const L = (col: string, d: number, x: number, y: number, z: number) => { const l = new THREE.PointLight(col, 0, d, 1.5); l.position.set(x, y, z); scene.add(l); return l; };
    const lanL = L('#ff8a5a', 3, -1.4, 0.65, AW_EDGE.z + 0.25), lanR = L('#ff8a5a', 3, 1.4, 0.65, AW_EDGE.z + 0.25);
    const stall = L('#ffb060', 2.5, STALL.x, 1.0, STALL.z + 0.35), lamp = L('#f2f6ff', 3, LAMP_X, 1.2, FZ + 0.45), vend = L('#e8f0ff', 2, 2.45, 0.6, 1.05);
    const smoke = fx.emitter(0, () => fx.steam(new V3(STALL.x + rand(-0.3, 0.3), 0.62, STALL.z - 0.08), '#d8d4d0', 1.1));
    const train = buildTrain(); train.visible = false; scene.add(train);
    const CLIP0 = [new THREE.Plane(new V3(1, 0, 0), 3.2), new THREE.Plane(new V3(-1, 0, 0), 3.2)], clip = CLIP0.map((p) => p.clone());
    train.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((x) => { x.clippingPlanes = clip; }); });
    let tt = -1, dir = 1; // seconds into a crossing, -1 = no train
    const PASS = 5.5, GAP = 11;
    return {
      finale() { tt = 0; },
      alive() { tt = PASS + GAP - 3; },
      update(dt, t, c) {
        const e = c.evening, on = (id: string) => (c.placed.has(id) ? e : 0);
        scene.updateMatrixWorld(); clip.forEach((p, i) => p.copy(CLIP0[i]).applyMatrix4(scene.matrixWorld));
        SHOPS.forEach((_, i) => { shopFront(i).emissiveIntensity = on('shop' + i) * 0.42; lightboxMat(i).emissiveIntensity = on('signs') * (i % 2 ? 0.55 : 0.35); });
        cityA().mat.emissiveIntensity = on('city') * 0.9; towerA().mat.emissiveIntensity = on('tower') * (0.6 + 0.6 * (Math.sin(t * 2) > 0 ? 1 : 0));
        flatFront().emissiveIntensity = on('flat') * 0.5;
        // the neon buzzes and now and then stutters
        const stutter = Math.sin(t * 1.3) > 0.93 ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : 1;
        neonA().mat.emissiveIntensity = on('neon') * 1.3 * stutter;
        ['#d6322b', '#f7f2e8'].forEach((col) => { lanternMat(col).emissiveIntensity = (on('lanterns') + on('stall')) * (col === '#d6322b' ? 0.8 : 0.3); });
        akaMat().emissiveIntensity = on('aka') * 0.9; bulbMat().emissiveIntensity = on('bulbs') * 1.1; lampHeadMat().emissiveIntensity = on('lamp') * 1.1;
        coalMat().emissiveIntensity = 0.3 + on('stall') * 1.0 + Math.sin(t * 7) * 0.08;
        vendFront(0).emissiveIntensity = vendFront(1).emissiveIntensity = on('vending') * 0.4;
        carSide().emissiveIntensity = e * 1.0;
        lanL.intensity = lanR.intensity = on('lanterns') * 1.6; stall.intensity = on('stall') * 1.8; lamp.intensity = on('lamp') * 1.8; vend.intensity = on('vending') * 0.6;
        smoke.rate = c.placed.has('stall') ? 1.4 : 0;
        // the train: across the viaduct, then a pause, then back the other way
        let near = 0;
        if (tt >= 0) {
          tt += dt;
          if (tt < PASS) { const k = tt / PASS; train.visible = true; train.position.set(dir * lerp(-6, 6, ease.inOut(k)), DECK, OZ); near = Math.sin(Math.PI * k); }
          else { train.visible = false; if (tt > PASS + GAP) { tt = 0; dir = -dir; } }
        }
        ctx.sound('train', c.placed.has('overpass') && !c.quiet ? near : 0);
      },
    };
  },
};
