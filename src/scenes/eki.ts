// Scene 6: a little seaside station in summer. A platform with a shelter, rails along the shore, a level crossing,
// sunflowers, a lighthouse on a rock. Finale: sunset, the lighthouse beam turns, the crossing rings and a small
// two-car train comes along the coast, stops, and goes on.
import * as THREE from 'three';
import { dab, foliage, JPG, meadow, poly, rrect, soft, text, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { ease, lerp, pick, rand } from '../core/util';
import { board, boardMat, cutout, cutoutAsset, glowing, group, latheMat, memo, plainM, toon, wallNet } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'eki:' + s;
const TRACK_Z = 0.35, PLAT_Z = -0.35, PLAT_X = -0.7, CROSS_X = 2.05, SHORE = -0.95;

// ── the sea horizon: islands and a headland
function islandsOutline(p: Pen) {
  const pts: number[][] = [[-3.1, 0], [-3.1, 0.55]];
  for (let x = -3.1; x <= -1.6; x += 0.05) pts.push([x, 0.55 + 0.35 * Math.sin(((x + 3.1) / 1.5) * Math.PI * 0.9) + 0.03 * Math.sin(x * 20)]);
  pts.push([-1.55, 0.18]);
  for (let x = -0.6; x <= 0.4; x += 0.05) pts.push([x, 0.18 + 0.42 * Math.sin(((x + 0.6) / 1.0) * Math.PI) + 0.02 * Math.sin(x * 25)]);
  pts.push([0.45, 0.18], [3.1, 0.18], [3.1, 0]);
  poly(p, pts);
}
const islandsA = () => cutoutAsset(K('islands'), islandsOutline, (c) => {
  c.fillStyle = '#7fb6d0'; c.fillRect(-3.2, 0, 6.4, 0.2);
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 20; i++) c.fillRect(rand(-3.1, 3.0), rand(0.02, 0.17), rand(0.1, 0.4), 0.01);
  c.fillStyle = '#8fa8a0'; c.fillRect(-3.2, 0.18, 2, 1.0); c.fillRect(-0.7, 0.18, 1.2, 0.7);
  foliage(c, -3.15, 0.3, 1.6, 0.6, { shade: '#4f7a5a', mid: '#6a9a6a', light: '#8cbc7c', hi: '#c4e09a' }, { n: 20, r: [0.08, 0.14], inside: (x, y) => y < 0.5 + 0.35 * Math.sin(((x + 3.1) / 1.5) * Math.PI * 0.9) });
  foliage(c, -0.65, 0.25, 1.1, 0.45, { shade: '#5f8a6a', mid: '#7aa67a', light: '#9cc48c', hi: '#d0e8aa' }, { n: 12, r: [0.06, 0.11], inside: (x, y) => y < 0.16 + 0.4 * Math.sin(((x + 0.6) / 1.0) * Math.PI) });
  c.fillStyle = '#c9b49a'; c.fillRect(-3.2, 0.17, 6.4, 0.03);
}, { ppu: 200, ink: 0 });

// ── the sea itself: an animated board of stylised waves
const seaTex = memo(K('seaTex'), () => {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3f8fb8'); g.addColorStop(1, '#5fb8c8'); c.fillStyle = g; c.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, w = 20 + Math.random() * 60;
    c.strokeStyle = Math.random() < 0.6 ? 'rgba(220,245,250,.55)' : 'rgba(30,90,130,.35)'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 6, x + w, y); c.stroke();
    if (x + w > 512) { c.beginPath(); c.moveTo(x - 512, y); c.quadraticCurveTo(x - 512 + w / 2, y - 6, x - 512 + w, y); c.stroke(); }
  }
  for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,240,.8)'; c.fillRect(Math.random() * 512, Math.random() * 256, 4, 2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.35, 0.8);
  return t;
});
const seaMat = () => memo(K('sea'), () => toon({ map: seaTex }));
function buildSea() {
  const shape = new THREE.Shape(); rrect(shape, -3.2, -SHORE, 3.2, 2.5, 0.45);
  // only the back corners are round: square off the front edge
  const geo = new THREE.ShapeGeometry(shape, 8); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, seaMat()); m.position.y = 0.015; m.receiveShadow = true;
  const g = group(m);
  g.userData.tick = (t) => { seaTex.offset.set(t * 0.012, Math.sin(t * 0.5) * 0.02); };
  return g;
}

// ── lighthouse on a rock
const towerMat = () => latheMat(K('lh'), 256, 256, (c, w, h) => { for (let y = 0; y < h; y += 64) { c.fillStyle = (y / 64) % 2 ? '#d6322b' : '#f7f4ec'; c.fillRect(0, y, w, 64); } c.fillStyle = '#2a2a33'; c.fillRect(w * 0.45, 150, 18, 28); });
const lampMat = () => memo(K('lamp'), () => glowing(toon({ color: '#fff2c0' })));
function buildLighthouse() {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), plainM(K('rock'), '#7d7a74')); rock.scale.set(1.2, 0.5, 1); rock.position.y = 0.1;
  const prof = [[0.001, 0], [0.22, 0], [0.16, 1.2], [0.001, 1.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const tower = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), towerMat()); tower.position.y = 0.25;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), plainM(K('deckL'), '#2a2a33')); deck.position.y = 1.47;
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16), lampMat()); lamp.position.y = 1.59;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.18, 16), plainM(K('capL'), '#d6322b')); cap.position.y = 1.78;
  return group(rock, tower, deck, lamp, cap);
}

// ── platform, shelter, station sign
const platTop = () => boardMat(K('platTop'), 3.8, 0.7, (c, W, H) => {
  c.fillStyle = '#c9c3b6'; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 0.35) { c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(x, 0, 0.01, H); }
  c.fillStyle = '#f2d24a'; for (let x = 0.05; x < W; x += 0.12) c.fillRect(x, H - 0.12, 0.08, 0.06); // tactile line
  c.fillStyle = '#f7f4ec'; c.fillRect(0, H - 0.04, W, 0.04);
}, { ppu: 200 });
function buildPlatform() {
  const top = platTop(), side = plainM(K('platSide'), '#9d978a');
  const m = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 0.7), [side, side, top, side, side, side]); m.position.y = 0.15;
  return group(m);
}
const shBack = () => boardMat(K('shBack'), 1.3, 0.95, (c, W, H) => {
  wood(c, W, H, '#c7a77a', { dir: 'h', plank: 0.12 });
  c.fillStyle = '#9fd4ef'; c.fillRect(0.12, 0.12, 0.5, 0.35); dab(c, 0.37, 0.3, 0.08, '#ffffff'); text(c, '海水浴', 0.37, 0.4, 0.05, '#2f6fb8', { font: JPG });
  c.fillStyle = '#f5efe0'; c.fillRect(0.75, 0.15, 0.4, 0.45); c.fillStyle = '#5a4c40'; for (let r = 0; r < 6; r++) c.fillRect(0.8, 0.22 + r * 0.06, 0.3, 0.012);
}, { ppu: 320 });
const shSide = () => boardMat(K('shSide'), 0.5, 0.95, (c, W, H) => wood(c, W, H, '#c7a77a', { dir: 'h', plank: 0.12 }), { ppu: 320 });
function buildShelter() {
  const w = wallNet({ w: 1.3, d: 0.5, h: 0.95, back: shBack(), side: shSide(), outside: plainM(K('shOut'), '#a88a62') });
  const roof = board(1.55, 0.75, 0.03, plainM(K('shRoof'), '#3f7a8a'), plainM(K('shRoofU'), '#6a5a48')); roof.position.set(0, 1.0, 0.03); roof.rotation.x = -0.12;
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.22), plainM(K('bench'), '#8a6a48')); bench.position.set(0, 0.32, -0.08);
  const g = group(w, roof, bench);
  g.userData.setFold = (k) => { w.userData.setFold!(k); roof.visible = k > 0.95; };
  return g;
}
const signA = () => cutoutAsset(K('sign'), (p) => poly(p, [[-0.5, 0], [-0.46, 0], [-0.46, 0.6], [0.46, 0.6], [0.46, 0], [0.5, 0], [0.5, 0.95], [-0.5, 0.95]]), (c) => {
  c.fillStyle = '#5a5248'; c.fillRect(-0.6, 0, 1.2, 1);
  c.fillStyle = '#f7f4ec'; c.fillRect(-0.48, 0.62, 0.96, 0.31);
  text(c, 'うみべ', 0, 0.83, 0.11, '#2a2420', { font: JPG }); text(c, '海辺', 0, 0.71, 0.07, '#2a2420');
  c.fillStyle = '#3f8f7a'; c.fillRect(-0.48, 0.62, 0.96, 0.025);
  text(c, '← しおさい', -0.3, 0.645, 0.035, '#2a2420', { font: JPG }); text(c, 'みさき →', 0.32, 0.645, 0.035, '#2a2420', { font: JPG });
}, { ppu: 500 });

// ── tracks and the level crossing
function buildTracks() {
  const g = group(), rail = plainM(K('rail'), '#8a8e94'), sleeper = plainM(K('sleeper'), '#6a5040');
  [-0.1, 0.1].forEach((dz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.04, 0.03), rail); r.position.set(0, 0.05, dz); g.add(r); });
  for (let x = -3.05; x <= 3.06; x += 0.22) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.36), sleeper); s.position.set(x, 0.015, 0); g.add(s); }
  return g;
}
const signalLamps = () => memo(K('sig'), () => [0, 1].map(() => glowing(toon({ color: '#5a1a14' }))));
const crossbuckA = () => cutoutAsset(K('crossbuck'), (p) => {
  poly(p, [[-0.03, 0], [0.03, 0], [0.03, 1.15], [0.24, 1.32], [0.21, 1.36], [0, 1.19], [-0.21, 1.36], [-0.24, 1.32], [-0.03, 1.15]]);
}, (c) => {
  c.fillStyle = '#f2d24a'; c.fillRect(-0.06, 0, 0.12, 1.2); c.fillStyle = '#2a2420'; for (let y = 0.05; y < 1.1; y += 0.16) c.fillRect(-0.06, y, 0.12, 0.08);
  c.fillStyle = '#f2d24a'; c.fillRect(-0.3, 1.12, 0.6, 0.3); c.fillStyle = '#2a2420'; for (let x = -0.3; x < 0.3; x += 0.08) c.fillRect(x, 1.12, 0.04, 0.3);
}, { ppu: 500 });
function buildCrossing() {
  const post = cutout(crossbuckA());
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.06), plainM(K('house'), '#2a2420')); housing.position.set(0, 0.92, 0.04);
  const lamps = signalLamps().map((m, i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), m); l.position.set(i ? 0.13 : -0.13, 0.92, 0.075); return l; });
  const arm = new THREE.Group(); arm.position.set(0.08, 0.5, 0.08);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.03), memo(K('barM'), () => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 8; const c = cv.getContext('2d')!;
    for (let x = 0; x < 128; x += 16) { c.fillStyle = (x / 16) % 2 ? '#2a2420' : '#f2d24a'; c.fillRect(x, 0, 16, 8); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return toon({ map: t });
  }));
  bar.position.x = -0.75; arm.add(bar);
  const g = group(post, housing, ...lamps, arm);
  g.userData.arm = arm;
  arm.rotation.z = -1.45; // raised
  return g;
}

// ── summer things
const sunflowerA = () => cutoutAsset(K('sunflowers'), (p) => {
  const pts: number[][] = [[0.5, 0]];
  for (let i = 0; i <= 60; i++) { const a = -0.1 + ((Math.PI + 0.2) * i) / 60, r = 0.55 + 0.12 * Math.abs(Math.sin(a * 4)); pts.push([Math.cos(a) * r, 0.55 + Math.sin(a) * r * 0.85]); }
  pts.push([-0.5, 0]); poly(p, pts);
}, (c) => {
  c.fillStyle = '#3f6e3a'; c.fillRect(-0.7, 0, 1.4, 1.1);
  foliage(c, -0.6, 0, 1.2, 0.7, { shade: '#2f5a30', mid: '#4f8a40', light: '#74b050', hi: '#b4e07a' }, { n: 22, r: [0.06, 0.11] });
  [[-0.32, 0.82], [0.0, 0.98], [0.3, 0.84], [-0.1, 0.62], [0.2, 0.58]].forEach(([x, y], i) => {
    const r = i < 3 ? 0.11 : 0.08;
    c.strokeStyle = '#4a7a30'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(x, y); c.lineTo(x * 0.6, 0); c.stroke();
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; c.fillStyle = k % 2 ? '#f7c62a' : '#f2a91e'; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.45, r * 0.18, a, 0, 7); c.fill(); }
    dab(c, x, y, r * 0.55, '#6a3f1e'); dab(c, x - r * 0.15, y + r * 0.15, r * 0.2, '#8a5a2e');
  });
}, { ppu: 420 });
const umbrellaA = () => cutoutAsset(K('umbrella'), (p) => { p.moveTo(-0.02, 0); p.lineTo(0.02, 0); p.lineTo(0.02, 0.85); p.lineTo(0.5, 0.82); p.bezierCurveTo(0.42, 1.1, -0.42, 1.1, -0.5, 0.82); p.lineTo(-0.02, 0.85); p.closePath(); }, (c) => {
  c.fillStyle = '#e8e2d6'; c.fillRect(-0.05, 0, 0.1, 0.9);
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#f7f4ec' : '#2f8fd0'; c.beginPath(); c.moveTo(0, 1.04); c.lineTo(-0.5 + (i / 6), 0.82); c.lineTo(-0.5 + ((i + 1) / 6), 0.82); c.closePath(); c.fill(); }
}, { ppu: 500 });

// ── people and animals
function girlOutline(p: Pen) {
  p.moveTo(-0.19, 0); p.lineTo(0.19, 0); p.lineTo(0.12, 0.42); p.lineTo(0.13, 0.62); p.bezierCurveTo(0.14, 0.7, 0.1, 0.74, 0.07, 0.76);
  p.lineTo(0.08, 0.84); p.lineTo(0.22, 0.85); p.lineTo(0.2, 0.89); p.lineTo(0.09, 0.9); p.bezierCurveTo(0.08, 0.98, -0.08, 0.98, -0.09, 0.9);
  p.lineTo(-0.2, 0.89); p.lineTo(-0.22, 0.85); p.lineTo(-0.08, 0.84); p.lineTo(-0.07, 0.76); p.bezierCurveTo(-0.1, 0.74, -0.14, 0.7, -0.13, 0.62); p.lineTo(-0.12, 0.42); p.closePath();
}
const girlA = () => cutoutAsset(K('girl'), girlOutline, (c) => {
  c.fillStyle = '#fbfaf6'; c.fillRect(-0.25, 0, 0.5, 0.78); c.fillStyle = '#d9dff0'; c.fillRect(0.04, 0, 0.2, 0.78);
  c.fillStyle = '#f5d9bf'; c.fillRect(-0.12, 0, 0.24, 0.06); c.beginPath(); c.ellipse(0, 0.8, 0.075, 0.075, 0, 0, 7); c.fill();
  c.fillStyle = '#3a2a20'; c.fillRect(-0.09, 0.6, 0.04, 0.2); c.fillRect(0.05, 0.6, 0.04, 0.2);
  c.fillStyle = '#e8c870'; c.fillRect(-0.25, 0.84, 0.5, 0.06); c.beginPath(); c.ellipse(0, 0.9, 0.09, 0.06, 0, Math.PI, 0, true); c.fill();
  c.fillStyle = '#d6322b'; c.fillRect(-0.09, 0.88, 0.18, 0.02);
  dab(c, -0.025, 0.8, 0.007, '#2a201a'); dab(c, 0.025, 0.8, 0.007, '#2a201a'); soft(c, -0.04, 0.78, 0.02, '#f08a7a', 0.6); soft(c, 0.04, 0.78, 0.02, '#f08a7a', 0.6);
}, { ppu: 800 });
function buildGirl() { const m = cutout(girlA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 0.9) * 0.02; }; return g; }
const gullA = () => cutoutAsset(K('gull'), (p) => { p.moveTo(-0.02, 0); p.lineTo(0.02, 0); p.lineTo(0.03, 0.06); p.bezierCurveTo(0.1, 0.07, 0.13, 0.13, 0.11, 0.17); p.lineTo(0.17, 0.15); p.lineTo(0.12, 0.2); p.bezierCurveTo(0.08, 0.22, 0.04, 0.18, 0.03, 0.15); p.bezierCurveTo(-0.06, 0.15, -0.16, 0.11, -0.2, 0.08); p.bezierCurveTo(-0.1, 0.07, -0.04, 0.06, -0.02, 0.05); p.closePath(); }, (c) => {
  c.fillStyle = '#fbfaf6'; c.fillRect(-0.25, 0, 0.45, 0.25); c.fillStyle = '#9aa3ad'; c.beginPath(); c.ellipse(-0.06, 0.12, 0.1, 0.03, -0.1, 0, 7); c.fill();
  c.fillStyle = '#2a2a33'; c.fillRect(-0.2, 0.075, 0.05, 0.02); c.fillStyle = '#f2c94c'; c.beginPath(); poly(c, [[0.11, 0.17], [0.17, 0.15], [0.12, 0.19]]); c.fill();
  dab(c, 0.09, 0.18, 0.008, '#2a2420'); c.fillStyle = '#e8a050'; c.fillRect(-0.02, 0, 0.01, 0.06); c.fillRect(0.01, 0, 0.01, 0.06);
}, { ppu: 1000, t: 0.02 });
function buildGull() { const m = cutout(gullA()), g = group(m); g.userData.tick = (t) => { const ph = Math.floor(t / 2.9) % 3; m.scale.x = ph === 2 ? -1 : 1; m.rotation.z = Math.max(0, Math.sin(t * 6)) * 0.05; }; return g; }
const catA = () => cutoutAsset(K('cat'), (p) => { p.moveTo(-0.08, 0); p.lineTo(0.1, 0); p.bezierCurveTo(0.12, 0.12, 0.08, 0.2, 0.06, 0.22); p.lineTo(0.08, 0.3); p.lineTo(0.03, 0.26); p.lineTo(-0.02, 0.26); p.lineTo(-0.06, 0.3); p.lineTo(-0.05, 0.22); p.bezierCurveTo(-0.1, 0.18, -0.12, 0.08, -0.08, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#2a2830'; c.fillRect(-0.15, 0, 0.3, 0.32); dab(c, -0.015, 0.22, 0.014, '#f2d24a'); dab(c, 0.035, 0.22, 0.014, '#f2d24a'); dab(c, -0.015, 0.22, 0.006, '#1a1a1a'); dab(c, 0.035, 0.22, 0.006, '#1a1a1a');
}, { ppu: 1000, t: 0.02 });

// ── the secret: a red crab on the beach behind the platform
const crabA = () => cutoutAsset(K('crab'), (p) => { p.moveTo(-0.12, 0); p.lineTo(0.12, 0); p.lineTo(0.14, 0.05); p.lineTo(0.19, 0.1); p.lineTo(0.15, 0.13); p.lineTo(0.1, 0.08); p.bezierCurveTo(0.06, 0.12, -0.06, 0.12, -0.1, 0.08); p.lineTo(-0.15, 0.13); p.lineTo(-0.19, 0.1); p.lineTo(-0.14, 0.05); p.closePath(); }, (c) => {
  c.fillStyle = '#e0452f'; c.fillRect(-0.2, 0, 0.4, 0.15); dab(c, -0.03, 0.1, 0.012, '#ffffff'); dab(c, 0.03, 0.1, 0.012, '#ffffff'); dab(c, -0.03, 0.1, 0.006, '#1a1a1a'); dab(c, 0.03, 0.1, 0.006, '#1a1a1a');
}, { ppu: 1000, t: 0.02 });
function buildCrab() { const m = cutout(crabA()), g = group(m); g.userData.tick = (t) => { m.position.x = Math.sin(t * 0.8) * 0.15; m.rotation.z = Math.sin(t * 7) * 0.05; }; return g; }

// ── the train (arrives in the finale, then comes by every so often)
const carSide = () => boardMat(K('carSide'), 1.5, 0.7, (c, W, H) => {
  c.fillStyle = '#f1e7cf'; c.fillRect(0, 0, W, H); c.fillStyle = '#2f7a5a'; c.fillRect(0, H * 0.55, W, H * 0.45); c.fillStyle = '#f2d24a'; c.fillRect(0, H * 0.52, W, 0.025);
  for (let i = 0; i < 4; i++) { const x = 0.1 + i * 0.34; c.fillStyle = '#2f4a56'; c.beginPath(); rrect(c, x, 0.08, x + 0.26, 0.32, 0.03); c.fill(); }
  c.fillStyle = '#2f4a56'; c.fillRect(0.66, 0.08, 0.16, 0.56);
}, { ppu: 300, emissive: (c) => { for (let i = 0; i < 4; i++) { const x = 0.1 + i * 0.34; c.fillStyle = '#ffd08a'; c.fillRect(x, 0.08, 0.26, 0.24); } } });
const carFront = () => boardMat(K('carFront'), 0.7, 0.7, (c, W, H) => {
  c.fillStyle = '#f1e7cf'; c.fillRect(0, 0, W, H); c.fillStyle = '#2f7a5a'; c.fillRect(0, H * 0.55, W, H * 0.45);
  c.fillStyle = '#2f4a56'; c.fillRect(0.08, 0.1, W - 0.16, 0.25); dab(c, 0.14, H - 0.15, 0.045, '#fff6d8'); dab(c, W - 0.14, H - 0.15, 0.045, '#fff6d8');
}, { ppu: 300, emissive: (c, W, H) => { dab(c, 0.14, H - 0.15, 0.06, '#fff3c8'); dab(c, W - 0.14, H - 0.15, 0.06, '#fff3c8'); } });
function buildTrain() {
  const g = group(), roofM = plainM(K('carRoof'), '#c9c3b6'), wheel = plainM(K('wheel'), '#2a2a2a');
  [-0.78, 0.78].forEach((x, i) => {
    const side = carSide(), front = carFront(), end = plainM(K('carEnd'), '#e8dcc0');
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.7), [i ? front : end, i ? end : front, roofM, roofM, side, side]);
    body.position.set(x, 0.5, 0); g.add(body);
    if (i) { const pan = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.02), plainM(K('pan'), '#3a3a3a')); pan.position.set(x, 0.92, 0); g.add(pan); }
    [-0.5, 0.5].forEach((dx) => [-0.3, 0.3].forEach((dz) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14), wheel); w.rotation.x = Math.PI / 2; w.position.set(x + dx, 0.12, dz); g.add(w); }));
  });
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

// ── ground: grass in front, a lane to the crossing, ballast, a sandy strip and the shore
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#86b85a', light: '#a8d470', shade: '#679a4a', tufts: [] });
  const ty = -TRACK_Z;
  c.fillStyle = '#8f8574'; c.fillRect(-W / 2, ty - 0.26, W, 0.52);
  for (let i = 0; i < 1500; i++) dab(c, rand(-W / 2, W / 2), ty + rand(-0.25, 0.25), rand(0.008, 0.016), pick(['#a39a88', '#7a7062', '#b8af9c']), 0.9);
  c.fillStyle = '#a69e8c'; c.fillRect(-W / 2, ty + 0.26, W, -PLAT_Z + 0.3 - (ty + 0.26)); // gravel up to the back of the platform
  c.fillStyle = '#e6d2a4'; c.fillRect(-W / 2, -PLAT_Z + 0.3, W, -SHORE - (-PLAT_Z + 0.3) + 0.15); // sand
  for (let i = 0; i < 300; i++) dab(c, rand(-W / 2, W / 2), rand(-PLAT_Z + 0.32, -SHORE + 0.1), rand(0.005, 0.012), pick(['#d4bd8a', '#f2e4c0']), 0.8);
  c.strokeStyle = '#ffffff'; c.lineWidth = 0.04; c.beginPath(); for (let x = -W / 2; x <= W / 2; x += 0.05) c.lineTo(x, -SHORE + 0.02 + Math.sin(x * 6) * 0.025); c.stroke();
  c.fillStyle = '#4f9ac0'; c.fillRect(-W / 2, -SHORE + 0.05, W, 2.5);
  // a lane to the crossing
  c.fillStyle = '#8a8680'; c.fillRect(CROSS_X - 0.42, -D / 2, 0.84, -ty + D / 2 + 0.3);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(CROSS_X - 0.4, -D / 2, 0.03, -ty + D / 2 - 0.3); c.fillRect(CROSS_X + 0.37, -D / 2, 0.03, -ty + D / 2 - 0.3);
  tufts(c, -W / 2, -D / 2, W, D, ['#5f9a45', '#76b052', '#98c86a'], 1300, (x, y) => y > ty - 0.3 || (x > CROSS_X - 0.45 && x < CROSS_X + 0.45));
  for (let i = 0; i < 50; i++) { const x = rand(-3, 3), y = rand(-2.4, ty - 0.4); if (x > CROSS_X - 0.5 && x < CROSS_X + 0.5) continue; for (let k = 0; k < 3; k++) dab(c, x + rand(-0.03, 0.03), y + rand(-0.03, 0.03), 0.014, pick(['#ffffff', '#f2d24a', '#f7a8c8']), 0.9); }
}

export const EKI: SceneDef = {
  id: 'eki',
  title: 'Stacyjka nad morzem',
  jp: '海辺の駅',
  season: 'lato',
  blurb: 'Peron nad brzegiem, przejazd i latarnia morska.',
  box: ['#2f7fb0', '#f2b84a'],
  seed: 4242,
  base: { w: 6.4, d: 5.0, paint: paintGround },
  sky: {
    day: { grad: [[0, '#2f86d6'], [0.5, '#7cc0ee'], [0.85, '#cdeaf4'], [1, '#eef8f6']], cloud: '#ffffff', hi: '#ffffff', edge: '#ffffff', shadow: '#b8c8e8' },
    evening: { grad: [[0, '#2a2c6a'], [0.35, '#8a4f8a'], [0.65, '#f07a5a'], [0.85, '#ffb46a'], [1, '#ffe0a0']], cloud: '#ff9a7a', hi: '#ffd8b0', edge: '#ff9a7a', shadow: '#8a5aa0' },
  },
  light: {
    day: { sky: '#e8f4ff', ground: '#a3b080', hemi: 1.2, sun: '#fff6e0', sunI: 2.8, sunPos: [3, 8, 6], bloom: 0.03 },
    evening: { sky: '#a88ac0', ground: '#5a3a3a', hemi: 1.05, sun: '#ff8a50', sunI: 1.3, sunPos: [6, 2.0, -4], bloom: 0.7 },
  },
  steps: [
    { name: 'Morze', jp: '海', pieces: ['islands', 'sea', 'lighthouse'] },
    { name: 'Stacja', jp: '駅', pieces: ['platform', 'shelter', 'sign'] },
    { name: 'Tory', jp: '線路', pieces: ['tracks', 'crossing'] },
    { name: 'Lato', jp: '夏', pieces: ['sunflowers', 'umbrella'] },
    { name: 'Życie', jp: '暮らし', pieces: ['girl', 'gull', 'cat'] },
  ],
  pieces: {
    islands: { name: 'Wyspy', pos: [0, 0, -2.45], build: () => group(cutout(islandsA())) },
    sea: { name: 'Morze', pos: [0, 0, 0], build: buildSea, sound: 'waves' },
    lighthouse: { name: 'Latarnia', pos: [2.35, 0, -1.85], build: buildLighthouse },
    platform: { name: 'Peron', pos: [PLAT_X, 0, PLAT_Z], build: buildPlatform },
    shelter: { name: 'Wiata', pos: [PLAT_X - 0.9, 0.3, PLAT_Z + 0.05], build: buildShelter },
    sign: { name: 'Tablica', pos: [PLAT_X + 0.9, 0.3, PLAT_Z - 0.1], build: () => group(cutout(signA())) },
    tracks: { name: 'Tory', pos: [0, 0, TRACK_Z], build: buildTracks },
    crossing: { name: 'Przejazd', pos: [CROSS_X + 0.55, 0, TRACK_Z + 0.55], build: buildCrossing },
    sunflowers: { name: 'Słoneczniki', pos: [-2.2, 0, 1.55], rotY: 0.15, build: () => group(cutout(sunflowerA())), sound: 'cicadas' },
    umbrella: { name: 'Parasol', pos: [1.5, 0, -0.8], rotY: -0.2, build: () => group(cutout(umbrellaA())) },
    girl: { name: 'Dziewczyna', pos: [PLAT_X + 0.25, 0.3, PLAT_Z - 0.05], build: buildGirl },
    gull: { name: 'Mewa', pos: [PLAT_X + 0.95, 1.25, PLAT_Z - 0.1], build: buildGull },
    cat: { name: 'Kot', pos: [PLAT_X - 0.55, 0.3, PLAT_Z + 0.15], build: () => group(cutout(catA())) },
  },
  secret: { name: 'czerwony krab', build: buildCrab, pos: [-1.8, 0.02, -0.83] },
  setup(ctx) {
    const { scene } = ctx;
    // the beam fades out along its length (grey gradient as alphaMap, which reads the green channel)
    const fade = memo(K('beamTex'), () => { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const c = cv.getContext('2d')!; const g = c.createLinearGradient(0, 64, 0, 0); g.addColorStop(0, '#000000'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(cv); });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c0', alphaMap: fade, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.geometry.translate(0, -2, 0); beam.rotation.z = Math.PI / 2;
    const pivot = new THREE.Group(); pivot.position.set(2.35, 1.59, -1.85); pivot.add(beam); scene.add(pivot);
    const lhLight = new THREE.PointLight('#fff2c0', 0, 3, 1.5); lhLight.position.set(2.35, 1.6, -1.55); scene.add(lhLight);
    const train = buildTrain(); train.visible = false; scene.add(train);
    const CLIP0 = [new THREE.Plane(new V3(1, 0, 0), 3.2), new THREE.Plane(new V3(-1, 0, 0), 3.2)], clip = CLIP0.map((p) => p.clone());
    train.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((x) => { x.clippingPlanes = clip; }); });
    const STOP = PLAT_X, FROM = -5.5, TO = 5.8;
    const PH = { away: 16, arrive: 5.5, wait: 4, leave: 5.5 } as const;
    type P = keyof typeof PH;
    let phase: P | null = null, pt = 0, armK = 0;
    const go = (p: P) => { phase = p; pt = 0; train.visible = p !== 'away'; };
    return {
      finale: () => go('arrive'),
      alive: () => { go('away'); pt = PH.away - 3; },
      update(dt, t, c) {
        const e = c.evening;
        scene.updateMatrixWorld(); clip.forEach((p, i) => p.copy(CLIP0[i]).applyMatrix4(scene.matrixWorld));
        seaMat().color.set('#ffffff').lerp(new THREE.Color('#ffb48a'), e * 0.55);
        lampMat().emissiveIntensity = (c.placed.has('lighthouse') ? e : 0) * 2.2;
        lhLight.intensity = (c.placed.has('lighthouse') ? e : 0) * 2;
        pivot.rotation.y = t * 0.9; (beam.material as THREE.MeshBasicMaterial).opacity = (c.placed.has('lighthouse') && !c.quiet ? e : 0) * 0.35;
        carSide().emissiveIntensity = e * 1.1; carFront().emissiveIntensity = e * 1.6;
        // the crossing closes while the train is near it
        let ringing = false;
        if (phase) {
          pt += dt; const k = Math.min(1, pt / PH[phase]);
          if (phase === 'arrive') { train.position.set(lerp(FROM, STOP, ease.out(k)), 0, TRACK_Z); ringing = k < 0.75; }
          if (phase === 'wait') train.position.set(STOP, Math.sin(t * 20) * 0.002, TRACK_Z);
          if (phase === 'leave') { train.position.set(lerp(STOP, TO, ease.in(k)), 0, TRACK_Z); ringing = k > 0.1 && k < 0.95; }
          if (k >= 1) go(phase === 'arrive' ? 'wait' : phase === 'wait' ? 'leave' : phase === 'leave' ? 'away' : 'arrive');
        }
        armK += (ringing ? 1 : -1) * dt * 1.4; armK = Math.max(0, Math.min(1, armK));
        const cross = c.placed.get('crossing');
        if (cross) cross.userData.arm.rotation.z = lerp(-1.45, 0, ease.inOut(armK));
        const blink = ringing && Math.sin(t * 6) > 0;
        signalLamps().forEach((m, i) => { m.emissive.set('#ff3a2a'); m.emissiveIntensity = ringing ? ((blink ? i : 1 - i) ? 2.2 : 0) : 0; });
        ctx.sound('crossing', ringing && c.placed.has('crossing') ? 1 : 0);
      },
    };
  },
};
