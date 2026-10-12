// Scene 5: a summer festival (natsu matsuri) at a shrine ground: a drum tower with red-white curtains, stalls,
// a goldfish tub, strings of lanterns. Finale: night falls, the taiko starts, fireworks open above the diorama.
import * as THREE from 'three';
import { audio, sfx } from '../audio/audio';
import { blob, circ, dab, foliage, JPG, meadow, poly, rrect, soft, text, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { pick, rand } from '../core/util';
import { boardMat, cutout, cutoutAsset, foldBox, gableRoof, glowing, group, latheMat, memo, plainM } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'matsuri:' + s;
const YZ = -1.15; // the drum tower

// ── backdrop: summer hills with a temple roof among the trees
const hill = (x: number) => 1.35 + 0.3 * Math.sin(x * 0.9 + 0.3) + 0.12 * Math.sin(x * 2.6 + 1);
function hillsOutline(p: Pen) {
  p.moveTo(-3.1, 0);
  for (let i = 0; i <= 100; i++) { const x = -3.1 + (6.2 * i) / 100; p.lineTo(x, hill(x) + 0.07 * Math.abs(Math.sin(x * 8))); }
  p.lineTo(3.1, 0); p.closePath();
}
const hillsA = () => cutoutAsset(K('hills'), hillsOutline, (c) => {
  const g = c.createLinearGradient(0, 2, 0, 0); g.addColorStop(0, '#6f9a6a'); g.addColorStop(1, '#3f6e45'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.2);
  for (let x = -3.3; x < 3.3; x += rand(0.3, 0.45)) { const r = rand(0.22, 0.34); foliage(c, x - r, hill(x) - r * 1.4, 2 * r, 1.6 * r, { shade: '#3c6a44', mid: '#558a52', light: '#7aae66', hi: '#b8dc8a' }, { n: 7, r: [r * 0.35, r * 0.55] }); }
  // a temple roof among the trees
  c.fillStyle = '#4a5466'; c.beginPath(); poly(c, [[-0.8, 1.05], [-0.55, 1.4], [0.55, 1.4], [0.8, 1.05]]); c.fill();
  c.fillStyle = '#c4553f'; c.fillRect(-0.5, 0.75, 1.0, 0.3);
  for (let x = -3.3; x < 3.3; x += rand(0.25, 0.4)) { const r = rand(0.2, 0.3); foliage(c, x - r, 0.55 - r, 2 * r, 1.4 * r, { shade: '#2f5a38', mid: '#467a46', light: '#689c58', hi: '#a6d07a' }, { n: 6, r: [r * 0.35, r * 0.55] }); }
}, { ppu: 170, ink: 0 });
const treesA = () => cutoutAsset(K('trees'), (p) => {
  const pts: number[][] = [[0.08, 0]];
  for (let i = 0; i <= 70; i++) { const a = -0.3 + ((Math.PI + 0.6) * i) / 70, r = 0.85 + 0.08 * Math.sin(a * 7) + 0.04 * Math.sin(a * 15); pts.push([Math.cos(a) * r * 1.1, 1.85 + Math.sin(a) * r]); }
  pts.push([-0.08, 0]); poly(p, pts);
}, (c) => {
  c.fillStyle = '#5e4334'; c.fillRect(-0.1, 0, 0.2, 1.6);
  c.fillStyle = '#3c6a44'; c.beginPath(); c.ellipse(0, 1.85, 1.0, 0.85, 0, 0, 7); c.fill();
  foliage(c, -1, 1.0, 2, 1.7, { shade: '#3c6a44', mid: '#5a9050', light: '#80b464', hi: '#c4e490' }, { n: 40, r: [0.15, 0.26], inside: (x, y) => (x / 0.95) ** 2 + ((y - 1.85) / 0.8) ** 2 < 1 });
}, { ppu: 300, t: 0.03 });

// ── the drum tower (yagura)
const stripeMat = (key: string, W: number, H: number) => boardMat(K(key), W, H, (c, w, h) => {
  for (let x = 0, i = 0; x < w; x += 0.12, i++) { c.fillStyle = i % 2 ? '#f7f2e8' : '#d6322b'; c.fillRect(x, 0.06, 0.12, h - 0.06); }
  c.fillStyle = '#2a2a3a'; c.fillRect(0, 0, w, 0.06);
  for (let x = 0.06; x < w; x += 0.24) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x, 0.06, 0.02, h); }
}, { ppu: 300 });
const deckMat = () => boardMat(K('deck'), 1.5, 1.5, (c, W, H) => wood(c, W, H, '#b88a5a', { dir: 'h', plank: 0.15 }));
const buildTower = () => { const s = stripeMat('stripes', 1.5, 0.95); return foldBox({ w: 1.5, d: 1.5, h: 0.95, top: deckMat(), front: s, back: s, left: s, right: s }); };
const drumMat = () => latheMat(K('drum'), 256, 64, (c, w, h) => {
  c.fillStyle = '#8a3a22'; c.fillRect(0, 0, w, h); c.fillStyle = '#a84a2c'; c.fillRect(0, 18, w, 28);
  c.fillStyle = '#2a1c14'; c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6);
  for (let x = 4; x < w; x += 10) { dab(c, x, 9, 2, '#d9b45a'); dab(c, x, h - 9, 2, '#d9b45a'); }
});
function buildDeck() {
  const g = group();
  const rail = plainM(K('rail'), '#7a4a2e');
  for (const [x, z, w, d] of [[0, 0.72, 1.5, 0.05], [0, -0.72, 1.5, 0.05], [0.72, 0, 0.05, 1.5], [-0.72, 0, 0.05, 1.5]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), rail); b.position.set(x, 0.32, z); g.add(b);
  }
  for (const [x, z] of [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72], [0, 0.72], [0, -0.72]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), rail); p.position.set(x, 0.17, z); g.add(p); }
  const prof = [[0.001, -0.2], [0.24, -0.2], [0.27, -0.1], [0.28, 0], [0.27, 0.1], [0.24, 0.2], [0.001, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const drum = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), drumMat()); drum.rotation.x = Math.PI / 2; drum.position.set(0, 0.36, 0);
  const skin = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), plainM(K('skin'), '#ecdcbc')); skin.position.set(0, 0.36, 0.205);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.3), rail); stand.position.set(0, 0.06, 0);
  g.add(drum, skin, stand);
  // a drummer's two sticks beating in the evening
  const sticks = [-1, 1].map((s) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), plainM(K('stick'), '#e7d3a8')); const pv = new THREE.Group(); pv.position.set(s * 0.1, 0.62, 0.38); st.position.y = -0.12; pv.add(st); g.add(pv); return pv; });
  g.userData.tick = (t, ev) => { const beat = (t * 2.5) % 1; sticks.forEach((p, i) => { p.rotation.x = 0.4 + (ev > 0.3 ? Math.max(0, Math.sin((beat + i * 0.5) * Math.PI * 2)) * 0.6 : 0); }); };
  return g;
}
const towerRoofMat = () => boardMat(K('troof'), 1.9, 0.75, (c, W, H) => {
  c.fillStyle = '#4a5466'; c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 0.1) { c.fillStyle = x % 0.2 < 0.1 ? '#5a6478' : '#3e4758'; c.fillRect(x, 0, 0.05, H); }
  c.fillStyle = '#2f3644'; c.fillRect(0, H - 0.05, W, 0.05);
}, { ppu: 300 });
function buildTowerRoof() {
  const roof = gableRoof({ w: 1.9, l: 0.75, angle: 0.5, top: towerRoofMat(), under: plainM(K('tunder'), '#5a3a24'), ridge: plainM(K('tridge'), '#2f3644') });
  roof.position.y = 1.0;
  const g = group(roof), post = plainM(K('rail'), '#7a4a2e');
  for (const [x, z] of [[-0.68, -0.6], [0.68, -0.6], [-0.68, 0.6], [0.68, 0.6]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.82, 0.06), post); p.position.set(x, 0.41, z); g.add(p); }
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  return g;
}

// ── stalls
const iceSide = () => boardMat(K('iceSide'), 1.1, 0.75, (c, W, H) => {
  wood(c, W, H, '#c99b6a', { dir: 'h', plank: 0.15, frame: 0.03 });
  c.fillStyle = '#ffffff'; c.fillRect(0.12, 0.12, W - 0.24, 0.32);
  c.fillStyle = '#3f8fd0'; c.beginPath(); c.moveTo(0.12, 0.44); for (let x = 0.12; x <= W - 0.12; x += 0.04) c.lineTo(x, 0.38 + Math.sin(x * 30) * 0.02); c.lineTo(W - 0.12, 0.44); c.closePath(); c.fill();
  text(c, 'かき氷', W / 2, 0.24, 0.1, '#d6322b', { font: JPG });
}, { ppu: 320 });
const iceTop = () => boardMat(K('iceTop'), 1.1, 0.55, (c, W, H) => {
  wood(c, W, H, '#ddb586', { dir: 'h', plank: 0.12 });
  [[0.25, '#e8574a'], [0.55, '#5ac06a'], [0.85, '#4f8fe0']].forEach(([x, col]) => { const xx = x as number; dab(c, xx, H / 2, 0.09, '#ffffff'); blob(c, xx, H / 2 - 0.02, 0.07, col as string, 0.9, 0.2); });
}, { ppu: 320 });
const flagA = () => cutoutAsset(K('flag'), (p) => poly(p, [[-0.02, 0], [0.02, 0], [0.02, 1.2], [0.36, 1.2], [0.36, 1.62], [-0.02, 1.62]]), (c) => {
  c.fillStyle = '#6a5040'; c.fillRect(-0.05, 0, 0.1, 1.7);
  c.fillStyle = '#ffffff'; c.fillRect(0.02, 1.2, 0.34, 0.42);
  c.fillStyle = '#2f6fb8'; c.beginPath(); c.moveTo(0.02, 1.2); for (let x = 0.02; x <= 0.36; x += 0.02) c.lineTo(x, 1.32 + Math.sin(x * 40) * 0.025); c.lineTo(0.36, 1.2); c.closePath(); c.fill();
  text(c, '氷', 0.19, 1.47, 0.2, '#d6322b');
}, { ppu: 500 });
function buildIce() {
  const s = iceSide(), box = foldBox({ w: 1.1, d: 0.55, h: 0.75, top: iceTop(), front: s, back: s, left: s, right: s });
  const flag = cutout(flagA()); flag.position.set(0.62, 0, 0.1);
  const g = group(box, flag);
  g.userData.setFold = (k) => box.userData.setFold!(k);
  g.userData.tick = (t) => { flag.rotation.y = Math.sin(t * 1.3) * 0.15; };
  return g;
}
function mask(c: Ctx, x: number, y: number, kind: number) {
  c.save(); c.translate(x, y);
  if (kind === 0) { // fox
    c.fillStyle = '#fbf8f1'; c.beginPath(); poly(c, [[-0.11, 0.06], [-0.13, 0.17], [-0.05, 0.1], [0.05, 0.1], [0.13, 0.17], [0.11, 0.06], [0.07, -0.08], [0, -0.13], [-0.07, -0.08]]); c.fill();
    c.strokeStyle = '#d6322b'; c.lineWidth = 0.012; [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 0.03, 0.02); c.lineTo(s * 0.08, 0.04); c.stroke(); }); dab(c, 0, -0.1, 0.012, '#2a2420');
    c.fillStyle = '#d6322b'; c.beginPath(); poly(c, [[-0.1, 0.14], [-0.11, 0.08], [-0.07, 0.1]]); c.fill(); c.beginPath(); poly(c, [[0.1, 0.14], [0.11, 0.08], [0.07, 0.1]]); c.fill();
  } else if (kind === 1) { // hyottoko
    dab(c, 0, 0, 0.11, '#f2c9a0'); c.fillStyle = '#2a2420'; dab(c, -0.04, 0.03, 0.014, '#2a2420'); dab(c, 0.05, 0.02, 0.02, '#2a2420');
    dab(c, 0.01, -0.06, 0.025, '#e8a080'); c.fillStyle = '#3a6ab0'; c.fillRect(-0.11, 0.07, 0.22, 0.03);
  } else if (kind === 2) { // okame
    dab(c, 0, 0, 0.11, '#fbf4ea'); soft(c, -0.06, -0.03, 0.04, '#f08a8a', 0.8); soft(c, 0.06, -0.03, 0.04, '#f08a8a', 0.8);
    c.strokeStyle = '#2a2420'; c.lineWidth = 0.01; [-0.04, 0.04].forEach((xx) => { c.beginPath(); c.arc(xx, 0.02, 0.015, 3.4, 6); c.stroke(); }); dab(c, 0, -0.06, 0.012, '#d6322b');
    dab(c, -0.03, 0.08, 0.015, '#2a2420'); dab(c, 0.03, 0.08, 0.015, '#2a2420');
  } else { // red oni
    dab(c, 0, 0, 0.11, '#d6422f'); c.fillStyle = '#f2e6c0'; c.beginPath(); poly(c, [[-0.07, 0.08], [-0.09, 0.16], [-0.04, 0.09]]); c.fill(); c.beginPath(); poly(c, [[0.07, 0.08], [0.09, 0.16], [0.04, 0.09]]); c.fill();
    dab(c, -0.04, 0.02, 0.02, '#f7e27a'); dab(c, 0.04, 0.02, 0.02, '#f7e27a'); c.fillStyle = '#ffffff'; c.fillRect(-0.05, -0.07, 0.1, 0.025);
  }
  c.restore();
}
const masksA = () => cutoutAsset(K('masks'), (p) => poly(p, [[-0.62, 0], [-0.55, 0], [-0.55, 0.6], [0.55, 0.6], [0.55, 0], [0.62, 0], [0.62, 1.4], [0.7, 1.4], [0, 1.6], [-0.7, 1.4], [-0.62, 1.4]]), (c) => {
  c.fillStyle = '#7a4a2e'; c.fillRect(-0.8, 0, 1.6, 1.7);
  c.fillStyle = '#e8d9b8'; c.fillRect(-0.55, 0.62, 1.1, 0.76);
  c.fillStyle = '#d6322b'; c.beginPath(); poly(c, [[0.7, 1.4], [0, 1.6], [-0.7, 1.4]]); c.fill();
  text(c, 'お面', 0, 1.47, 0.08, '#f7f2e8');
  let i = 0; for (const y of [1.18, 0.86]) for (let x = -0.38; x <= 0.39; x += 0.25) mask(c, x, y, i++ % 4);
  c.fillStyle = '#d6322b'; c.fillRect(-0.55, 0.45, 1.1, 0.15); c.fillStyle = '#f7f2e8'; for (let x = -0.55; x < 0.55; x += 0.12) c.fillRect(x, 0.45, 0.06, 0.15);
}, { ppu: 420 });

// ── goldfish tub
const fishTex = memo(K('fishTex'), () => {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; const c = cv.getContext('2d')!;
  c.fillStyle = '#ff7a2a'; c.beginPath(); c.ellipse(26, 16, 16, 8, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(40, 16); c.lineTo(60, 6); c.lineTo(56, 16); c.lineTo(60, 26); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(22, 13, 5, 3, 0, 0, 7); c.fill(); c.fillStyle = '#2a2420'; c.fillRect(14, 13, 3, 3);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
});
function buildTub() {
  const prof = [[0.001, 0], [0.5, 0], [0.55, 0.18], [0.57, 0.2], [0.52, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const tub = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), plainM(K('tub'), '#4f9ad8', { side: THREE.DoubleSide }));
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), plainM(K('water'), '#9fd4ef', { transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.16;
  const g = group(tub, water);
  const fishM = new THREE.MeshBasicMaterial({ map: fishTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const fish = Array.from({ length: 7 }, (_, i) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), fishM); f.rotation.x = -Math.PI / 2;
    const pv = new THREE.Group(); pv.position.y = 0.15; f.position.x = 0.12 + (i % 4) * 0.08; pv.add(f); g.add(pv);
    return { pv, f, speed: rand(0.4, 0.9) * (i % 2 ? 1 : -1), ph: rand(0, 6) };
  });
  // a stand with paper scoops
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), plainM(K('stand'), '#c99b6a')); stand.position.set(0.72, 0.15, 0); g.add(stand);
  g.userData.tick = (t) => fish.forEach(({ pv, f, speed, ph }) => { pv.rotation.y = t * speed + ph; f.rotation.z = (speed > 0 ? Math.PI : 0) + Math.sin(t * 9 + ph) * 0.25; });
  return g;
}

// ── lantern strings
const lanternGlow = (col: string) => memo(K('lan' + col), () => {
  const m = latheMat(K('lanTex' + col), 128, 64, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 6; y < h; y += 9) c.fillRect(0, y, w, 2);
    c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, 5); c.fillRect(0, h - 5, w, 5);
    if (col !== '#d6322b') text(c, '祭', w / 4, h / 2, 26, '#d6322b'); else text(c, '祭', w / 4, h / 2, 26, '#2a2420');
  });
  glowing(m); m.emissiveMap = m.map; return m;
});
const LANTERN_PTS = (() => { const p: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const y = -0.08 + (0.16 * i) / 10; p.push(new THREE.Vector2(0.03 + 0.045 * Math.sqrt(Math.max(0, 1 - (y / 0.08) ** 2)), y)); } return p; })();
function buildString(side: number) {
  const g = group();
  const A = new V3(0.35 * side, 2.0, YZ), B = new V3(2.75 * side, 1.75, 1.85);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 8), plainM(K('pole'), '#6a5040')); pole.position.set(B.x, 0.95, B.z); g.add(pole);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new V3().lerpVectors(A, B, t).add(new V3(0, -Math.sin(Math.PI * t) * 0.35, 0))); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2420' })));
  const geo = new THREE.LatheGeometry(LANTERN_PTS, 14);
  for (let i = 1; i < 8; i++) {
    const p = pts[Math.round((i / 8) * 24)];
    const l = new THREE.Mesh(geo, lanternGlow(i % 2 ? '#d6322b' : '#f7f2e8')); l.position.copy(p).add(new V3(0, -0.1, 0)); g.add(l);
  }
  return g;
}

// ── people and the dog
function figure(h: number, w: number) {
  return (p: Pen) => {
    p.moveTo(-w, 0); p.lineTo(w, 0); p.lineTo(w * 0.8, h * 0.6); p.bezierCurveTo(w * 1.0, h * 0.72, w * 0.9, h * 0.8, w * 0.5, h * 0.8);
    p.bezierCurveTo(w * 0.85, h * 0.86, w * 0.8, h * 1.02, 0, h * 1.02); p.bezierCurveTo(-w * 0.8, h * 1.02, -w * 0.85, h * 0.86, -w * 0.5, h * 0.8);
    p.bezierCurveTo(-w * 0.9, h * 0.8, -w * 1.0, h * 0.72, -w * 0.8, h * 0.6); p.closePath();
  };
}
const girlA = () => cutoutAsset(K('girl'), figure(0.95, 0.17), (c) => {
  c.fillStyle = '#3f5fa8'; c.fillRect(-0.25, 0, 0.5, 0.78);
  for (let i = 0; i < 14; i++) { const x = rand(-0.15, 0.15), y = rand(0.08, 0.7); for (let k = 0; k < 5; k++) dab(c, x + Math.cos(k * 1.26) * 0.02, y + Math.sin(k * 1.26) * 0.02, 0.012, '#f6f0e6'); dab(c, x, y, 0.008, '#f2c94c'); }
  c.fillStyle = '#f2a33a'; c.fillRect(-0.17, 0.42, 0.34, 0.1); dab(c, 0.12, 0.47, 0.05, '#f2a33a');
  c.fillStyle = '#2a2420'; c.fillRect(-0.12, 0, 0.24, 0.04);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.86, 0.1, 0.1, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.92, 0.11, 0.07, 0, Math.PI, 0, true); c.fill(); dab(c, -0.07, 0.95, 0.04, '#2a2420'); dab(c, 0.07, 0.95, 0.04, '#2a2420');
  dab(c, 0.08, 0.98, 0.02, '#e8574a');
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.01; [-0.035, 0.035].forEach((x) => { c.beginPath(); c.arc(x, 0.86, 0.015, 0.3, Math.PI - 0.3); c.stroke(); });
  soft(c, -0.06, 0.83, 0.025, '#f08a7a', 0.7); soft(c, 0.06, 0.83, 0.025, '#f08a7a', 0.7);
}, { ppu: 700 });
const fanA = () => cutoutAsset(K('fan'), (p) => { circ(p, 0, 0.16, 0.09); }, (c) => {
  c.fillStyle = '#f7f2e8'; c.fillRect(-0.1, 0.06, 0.2, 0.2); dab(c, 0.02, 0.17, 0.04, '#d6322b'); c.strokeStyle = '#3f8fd0'; c.lineWidth = 0.008; c.beginPath(); c.arc(-0.02, 0.13, 0.05, 3.5, 5.5); c.stroke();
}, { ppu: 900, t: 0.01 });
function buildGirl() {
  const fan = new THREE.Group(); fan.position.set(0.16, 0.48, 0.03);
  const fm = cutout(fanA()); const handle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.08, 0.012), plainM(K('fanH'), '#c99b6a')); handle.position.y = 0.04; fan.add(fm, handle);
  const g = group(cutout(girlA()), fan);
  g.userData.tick = (t) => { fan.rotation.z = -0.3 + Math.sin(t * 6) * 0.3; };
  return g;
}
const boyA = () => cutoutAsset(K('boy'), figure(0.8, 0.15), (c) => {
  c.fillStyle = '#5a7a4a'; c.fillRect(-0.22, 0, 0.44, 0.66); c.strokeStyle = '#3f5a34'; c.lineWidth = 0.01; for (let x = -0.15; x < 0.16; x += 0.05) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 0.62); c.stroke(); }
  c.fillStyle = '#2a2420'; c.fillRect(-0.15, 0.36, 0.3, 0.05); c.fillRect(-0.1, 0, 0.2, 0.04);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.72, 0.09, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = '#3a2a20'; c.beginPath(); c.ellipse(0, 0.77, 0.095, 0.05, 0, Math.PI, 0, true); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.01; [-0.03, 0.03].forEach((x) => { c.beginPath(); c.arc(x, 0.72, 0.013, 0.3, Math.PI - 0.3); c.stroke(); });
  c.beginPath(); c.arc(0, 0.69, 0.02, 0.3, Math.PI - 0.3); c.stroke();
  c.fillStyle = '#fbf8f1'; c.beginPath(); poly(c, [[0.12, 0.62], [0.16, 0.62], [0.11, 0.3]]); c.fill(); // a fox mask pushed on the side of the head
}, { ppu: 800 });
function buildBoy() {
  // a water-balloon yo-yo bouncing on its elastic
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), plainM(K('yoyo'), '#e85a9a'));
  const g = group(cutout(boyA()), ball);
  g.userData.tick = (t) => { ball.position.set(0.2, 0.25 + Math.abs(Math.sin(t * 3.2)) * 0.15, 0.04); };
  return g;
}
const dogA = () => cutoutAsset(K('dog'), (p) => { p.moveTo(-0.18, 0); p.lineTo(-0.15, 0); p.lineTo(-0.14, 0.1); p.lineTo(0.1, 0.1); p.lineTo(0.12, 0); p.lineTo(0.15, 0); p.lineTo(0.15, 0.16); p.lineTo(0.2, 0.2); p.lineTo(0.26, 0.2); p.lineTo(0.25, 0.25); p.lineTo(0.22, 0.27); p.lineTo(0.21, 0.32); p.lineTo(0.18, 0.28); p.lineTo(0.15, 0.31); p.lineTo(0.14, 0.24); p.bezierCurveTo(0.05, 0.24, -0.12, 0.24, -0.18, 0.18); p.closePath(); }, (c) => {
  c.fillStyle = '#d9853e'; c.fillRect(-0.25, 0, 0.55, 0.35); c.fillStyle = '#fbf3e6'; c.beginPath(); c.ellipse(0.18, 0.2, 0.06, 0.04, 0, 0, 7); c.fill(); c.fillRect(-0.12, 0.08, 0.2, 0.03);
  dab(c, 0.25, 0.235, 0.012, '#2a2420'); c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; c.beginPath(); c.arc(0.2, 0.255, 0.01, 0.3, Math.PI - 0.3); c.stroke();
}, { ppu: 900, t: 0.02 });
const dogTailA = () => cutoutAsset(K('dogTail'), (p) => { circ(p, 0, 0.05, 0.05); }, (c) => { c.fillStyle = '#d9853e'; c.fillRect(-0.1, 0, 0.2, 0.12); dab(c, 0, 0.05, 0.025, '#fbf3e6'); }, { ppu: 900, t: 0.02 });
function buildDog() { const tail = new THREE.Group(); tail.position.set(-0.17, 0.2, -0.005); tail.add(cutout(dogTailA())); const g = group(cutout(dogA()), tail); g.userData.tick = (t) => { tail.rotation.z = Math.sin(t * 9) * 0.3; }; return g; }

// ── the secret: a lantern ghost (chochin-obake) behind the tower
const obakeA = () => cutoutAsset(K('obake'), (p) => { p.moveTo(-0.09, 0); p.lineTo(0.09, 0); p.bezierCurveTo(0.15, 0.08, 0.15, 0.24, 0.09, 0.32); p.lineTo(-0.09, 0.32); p.bezierCurveTo(-0.15, 0.24, -0.15, 0.08, -0.09, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#f3ead6'; c.fillRect(-0.2, 0, 0.4, 0.35); c.fillStyle = 'rgba(120,90,60,.35)'; for (let y = 0.04; y < 0.32; y += 0.04) c.fillRect(-0.2, y, 0.4, 0.006);
  c.fillStyle = '#2a2420'; c.fillRect(-0.1, 0, 0.2, 0.025); c.fillRect(-0.1, 0.3, 0.2, 0.025);
  dab(c, 0.01, 0.2, 0.035, '#ffffff'); dab(c, 0.015, 0.2, 0.018, '#2a2420');
  c.fillStyle = '#d6322b'; c.beginPath(); c.moveTo(-0.04, 0.1); c.quadraticCurveTo(0.0, 0.03, 0.04, 0.1); c.quadraticCurveTo(0, 0.12, -0.04, 0.1); c.fill();
}, { ppu: 1000, t: 0.02 });
function buildObake() { const m = cutout(obakeA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 2) * 0.12; m.position.y = Math.sin(t * 1.3) * 0.03; }; return g; }

// ── ground: shrine grounds of packed earth and gravel
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#7ea85a', light: '#9cc46c', shade: '#5f8a48', tufts: [] });
  c.fillStyle = '#d6c39a'; c.beginPath(); rrect(c, -2.8, -2.2, 2.8, 2.1, 0.5); c.fill();
  for (let i = 0; i < 40; i++) blob(c, rand(-2.6, 2.6), rand(-2, 1.9), rand(0.15, 0.4), pick(['#cbb78c', '#e0cfa8']), 0.6, 0.4);
  for (let i = 0; i < 700; i++) dab(c, rand(-2.7, 2.7), rand(-2.1, 2.0), rand(0.006, 0.014), pick(['#b8a47a', '#ece0c4', '#a8946a']), 0.8);
  tufts(c, -W / 2, -D / 2, W, D, ['#5f8a48', '#7aa858', '#94c06a'], 1200, (x, y) => Math.abs(x) < 2.75 && y > -2.15 && y < 2.05);
}

export const MATSURI: SceneDef = {
  id: 'matsuri',
  title: 'Letni festiwal',
  jp: '夏祭り',
  season: 'lato',
  blurb: 'Bębny, lampiony i fajerwerki nad świątynnym placem.',
  box: ['#2b3a7a', '#d6322b'],
  seed: 808,
  base: { w: 6.4, d: 5.0, paint: paintGround },
  sky: {
    day: { grad: [[0, '#3b86d0'], [0.5, '#8cc2e8'], [0.85, '#f2dcb0'], [1, '#f8e6c0']], cloud: '#fff9ec', hi: '#ffffff', edge: '#fff9ec', shadow: '#d0b8c8' },
    evening: { grad: [[0, '#0d1236'], [0.5, '#1e2a5c'], [0.85, '#4a3a6c'], [1, '#a65a6a']], cloud: '#2a3466', hi: '#3c4880', edge: '#2a3466', shadow: '#1c2450', stars: true },
  },
  light: {
    day: { sky: '#fff0d8', ground: '#8f9a60', hemi: 1.15, sun: '#ffdca0', sunI: 2.6, sunPos: [5, 6, 5], bloom: 0.03 },
    evening: { sky: '#5a5aa0', ground: '#2a2a3a', hemi: 0.7, sun: '#6070b0', sunI: 0.3, sunPos: [-4, 6, 3], bloom: 0.95 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['hills', 'trees'] },
    { name: 'Wieża', jp: '櫓', pieces: ['tower', 'deck', 'troof'] },
    { name: 'Stragany', jp: '屋台', pieces: ['ice', 'masks', 'tub'] },
    { name: 'Lampiony', jp: '提灯', pieces: ['stringL', 'stringR'] },
    { name: 'Życie', jp: '暮らし', pieces: ['girl', 'boy', 'dog'] },
  ],
  pieces: {
    hills: { name: 'Wzgórza', pos: [0, 0, -2.42], build: () => group(cutout(hillsA())), sound: 'leaves' },
    trees: { name: 'Drzewa', pos: [-2.35, 0, -1.6], build: () => { const a = cutout(treesA()), b = cutout(treesA()); b.rotation.y = Math.PI / 2; return group(a, b); } },
    tower: { name: 'Wieża', pos: [0, 0, YZ], build: buildTower },
    deck: { name: 'Bęben', pos: [0, 0.95, YZ], build: buildDeck, sound: 'taiko' },
    troof: { name: 'Daszek', pos: [0, 0.95, YZ], build: buildTowerRoof },
    ice: { name: 'Lody', pos: [-1.95, 0, 0.1], rotY: 0.35, build: buildIce },
    masks: { name: 'Maski', pos: [1.95, 0, -0.1], rotY: -0.4, build: () => group(cutout(masksA())) },
    tub: { name: 'Rybki', pos: [0.75, 0, 1.25], build: buildTub },
    stringL: { name: 'Lampiony', pos: [0, 0, 0], build: () => buildString(-1) },
    stringR: { name: 'Lampiony', pos: [0, 0, 0], build: () => buildString(1) },
    girl: { name: 'Dziewczynka', pos: [-0.75, 0, 1.35], rotY: 0.2, build: buildGirl },
    boy: { name: 'Chłopiec', pos: [1.6, 0, 1.0], rotY: -0.3, build: buildBoy },
    dog: { name: 'Pies', pos: [-1.45, 0, 1.75], rotY: 0.3, build: buildDog },
  },
  secret: { name: 'lampionowy duszek', build: buildObake, pos: [0.35, 0, -2.05] },
  setup(ctx) {
    const { fx, scene } = ctx;
    const glow = [-1, 1].map((s) => { const l = new THREE.PointLight('#ff9a5a', 0, 5, 1.4); l.position.set(1.4 * s, 1.5, 0.3); scene.add(l); return l; });
    const towerGlow = new THREE.PointLight('#ffb070', 0, 4, 1.4); towerGlow.position.set(0, 1.6, YZ + 1.0); scene.add(towerGlow);
    const COLORS = ['#ff5a5a', '#ffd25a', '#7ad0ff', '#c88aff', '#7aff9a', '#ff9ad6'];
    const fireworks = fx.emitter(0, () => {
      const x = rand(-2, 2), top = new V3(x, rand(3.9, 5.0), rand(-2.8, -2.0));
      fx.firework(new V3(x * 0.8, 0.4, -2.4), top, pick(COLORS), () => { if (!ctx.quiet && audio()) sfx.boom(rand(0.3, 1)); });
    });
    return {
      update(_dt, _t, c) {
        const e = c.evening;
        lanternGlow('#d6322b').emissiveIntensity = e * 1.4; lanternGlow('#f7f2e8').emissiveIntensity = e * 0.55;
        glow[0].intensity = (c.placed.has('stringL') ? e : 0) * 4; glow[1].intensity = (c.placed.has('stringR') ? e : 0) * 4;
        towerGlow.intensity = (c.placed.has('tower') ? e : 0) * 2.5;
        fireworks.rate = c.done && e > 0.6 && !c.quiet ? 0.55 : 0; // not in the shelf's little cubby
      },
    };
  },
};
