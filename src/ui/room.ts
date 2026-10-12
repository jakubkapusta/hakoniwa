// The room around the shelf: plaster wall, tatami, the wooden shelf, a window that throws a lattice of sunlight,
// a paper lamp, and little things that fill empty shelf slots. Plus the kit boxes themselves.
import * as THREE from 'three';
import { dab, foliage, JP, mottle, newCanvas, poly, soft, text, toTex, wood, type Pen } from '../core/paint';
import { mix, pick, rand, rgba } from '../core/util';
import { board, boardMat, cutout, cutoutAsset, glowing, group, latheMat, memo, paperMat, plainM, type Foldable } from '../kit/kit';
import type { SceneDef } from '../scenes/types';

const K = (s: string) => 'room:' + s;

export const SHELF = { W: 8.8, slot: 4.15, row: 2.9, depth: 3.0, plank: 0.14, wallZ: -1.62 };

// ── wall and floor
export function buildWall(h: number): THREE.Mesh {
  const mat = memo(K('wall'), () => {
    const cv = newCanvas(1024, 1024), c = cv.getContext('2d')!;
    c.scale(1024 / 20, 1024 / 20);
    c.fillStyle = '#e8d9bb'; c.fillRect(0, 0, 20, 20);
    mottle(c, 0, 0, 20, 20, ['#efe3c8', '#e0cfae', '#ecdcc0'], 90, [0.6, 1.6], 0.35);
    for (let i = 0; i < 400; i++) dab(c, rand(0, 20), rand(0, 20), rand(0.02, 0.05), pick(['#cdb894', '#f4ead6']), 0.5);
    return paperMat(toTex(cv));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(20, h + 12), mat);
  m.position.set(0, (h + 12) / 2 - 2.5, SHELF.wallZ); m.receiveShadow = true;
  // a wooden rail (nageshi) high on the wall, above the scroll
  const rail = new THREE.Mesh(new THREE.BoxGeometry(20, 0.22, 0.08), plainM(K('nageshi'), '#7a5538')); rail.position.set(0, h + 3.6 - ((h + 12) / 2 - 2.5), 0.04); rail.receiveShadow = true; m.add(rail);
  return m;
}
export function buildFloor(): THREE.Mesh {
  const mat = memo(K('tatami'), () => {
    const cv = newCanvas(1024, 2048), c = cv.getContext('2d')!;
    c.scale(1024 / 20, 2048 / 40);
    for (let i = 0; i < 6; i++) {
      const x = i * 3.6 - 1;
      c.fillStyle = i % 2 ? '#c9c28a' : '#c3bb80'; c.fillRect(x, 0, 3.6, 40);
      c.strokeStyle = 'rgba(120,110,60,.35)'; c.lineWidth = 0.03;
      for (let y = 0.1; y < 40; y += 0.12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3.6, y); c.stroke(); }
      c.fillStyle = '#2f3a33'; c.fillRect(x, 0, 0.16, 40);
      for (let y = 7.2; y < 40; y += 7.2) c.fillRect(x, y, 3.6, 0.05);
    }
    return paperMat(toTex(cv));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(0, -0.35, 18.4); m.receiveShadow = true;
  return m;
}

// ── the shelf
const shelfWood = () => boardMat(K('shelfWood'), 8.8, 2.6, (c, W, H) => wood(c, W, H, '#a87a50', { dir: 'h', plank: 0.65 }), { ppu: 120 });
const shelfSide = () => boardMat(K('shelfSide'), 2.6, 12, (c, W, H) => wood(c, W, H, '#93673f', { dir: 'v', plank: 0.65 }), { ppu: 90 });
export function buildShelf(rows: number, W: number): THREE.Group {
  const g = new THREE.Group(), { row, depth, plank } = SHELF, H = rows * row;
  const edge = plainM(K('shelfEdge'), '#7d5638');
  for (let r = 0; r <= rows; r++) {
    const b = board(W, depth, plank, shelfWood(), edge); b.position.set(0, r * row - plank / 2, 0); g.add(b);
  }
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, H + 0.5, depth), [shelfSide(), shelfSide(), edge, edge, shelfSide(), shelfSide()]);
    side.position.set((s * (W + 0.16)) / 2, H / 2 - 0.2, 0); g.add(side);
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), plainM(K('shelfBack'), '#b08a62'));
  back.position.set(0, H / 2, -depth / 2 + 0.01); g.add(back);
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

/** Window frame + shoji lattice outside the view: invisible, but it shapes the sunlight on the wall and the shelf. */
export function buildWindowShadow(at: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const bar = (w: number, h: number, x: number, y: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), ghost); m.position.set(x, y, 0); m.castShadow = true; g.add(m); };
  const ww = 4.2, wh = 3.4;
  // only the frame and the lattice: their shadow lies on the wall like sunlight through a shoji
  bar(ww + 0.3, 0.16, 0, wh / 2); bar(ww + 0.3, 0.16, 0, -wh / 2); bar(0.16, wh, -ww / 2, 0); bar(0.16, wh, ww / 2, 0);
  for (let i = 1; i < 4; i++) bar(0.07, wh, -ww / 2 + (ww * i) / 4, 0);
  for (let i = 1; i < 5; i++) bar(ww, 0.07, 0, -wh / 2 + (wh * i) / 5);
  g.position.copy(at);
  return g;
}

// ── hanging scroll (kakejiku): an ink-wash mountain under a red sun
export function buildScroll(): THREE.Mesh {
  const mat = boardMat(K('scroll'), 1.2, 2.4, (c, W, H) => {
    c.fillStyle = '#5d6b55'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#c9b48a'; c.fillRect(0.08, 0.25, W - 0.16, H - 0.55);
    c.fillStyle = '#f3ecdc'; c.fillRect(0.14, 0.32, W - 0.28, H - 0.7);
    const ink = (y: number, a: number, col: string) => { c.fillStyle = col; c.globalAlpha = a; c.beginPath(); c.moveTo(0.14, y + 0.4);
      for (let x = 0.14; x <= W - 0.14; x += 0.02) c.lineTo(x, y - Math.max(0, 0.35 - Math.abs(x - 0.6 + (y - 1.2) * 0.4) * 1.1) - 0.04 * Math.sin(x * 23)); c.lineTo(W - 0.14, y + 0.4); c.closePath(); c.fill(); c.globalAlpha = 1; };
    ink(1.15, 0.25, '#4a5560'); ink(1.45, 0.45, '#3a434c'); ink(1.75, 0.7, '#2a3036');
    dab(c, 0.78, 0.75, 0.11, '#c4362f', 0.9);
    text(c, '静', 0.3, 0.7, 0.13, '#2a2420'); text(c, '心', 0.3, 0.86, 0.13, '#2a2420');
    c.fillStyle = '#c4362f'; c.fillRect(0.24, 0.98, 0.1, 0.1);
    c.fillStyle = '#3b2c22'; c.fillRect(0, 0, W, 0.06); c.fillRect(0, H - 0.08, W, 0.08);
  }, { ppu: 300 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), mat); m.castShadow = m.receiveShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), plainM(K('rod'), '#2f241c')); rod.rotation.z = Math.PI / 2; rod.position.y = -1.22; m.add(rod);
  return m;
}

// ── paper pendant lamp
const lampMat = () => memo(K('lampGlow'), () => {
  const m = latheMat(K('lamp'), 256, 128, (c, w, h) => {
    c.fillStyle = '#f6efe0'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(150,120,80,.35)'; for (let y = 6; y < h; y += 11) c.fillRect(0, y, w, 2);
  });
  glowing(m); m.emissiveMap = m.map; m.emissive = new THREE.Color('#ffd7a0'); return m;
});
export function buildLamp(): Foldable {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 16; pts.push(new THREE.Vector2(Math.max(0.001, Math.cos(a) * 0.55), Math.sin(a) * 0.5)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), lampMat());
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3, 6), plainM(K('cord'), '#3a2c22')); cord.position.y = 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.08, 16), plainM(K('cap'), '#3a2c22')); cap.position.y = 0.52;
  const g = group(body, cord, cap);
  g.userData.tick = (t) => { g.rotation.z = Math.sin(t * 0.6) * 0.015; };
  return g;
}
export const setLampGlow = (k: number) => { lampMat().emissiveIntensity = k * 0.85; };

// ── decorations
function nekoOutline(p: Pen) {
  p.moveTo(-0.32, 0); p.lineTo(0.32, 0); p.bezierCurveTo(0.4, 0.3, 0.32, 0.52, 0.26, 0.6);
  p.bezierCurveTo(0.37, 0.7, 0.37, 0.9, 0.33, 0.97); p.lineTo(0.31, 1.1); p.lineTo(0.2, 1.0);
  p.quadraticCurveTo(0, 1.05, -0.2, 1.0); p.lineTo(-0.31, 1.1); p.lineTo(-0.33, 0.97);
  p.bezierCurveTo(-0.37, 0.9, -0.37, 0.7, -0.26, 0.6); p.bezierCurveTo(-0.32, 0.52, -0.4, 0.3, -0.32, 0); p.closePath();
}
const nekoA = () => cutoutAsset(K('neko'), nekoOutline, (c) => {
  c.fillStyle = '#fbf8f1'; c.fillRect(-0.45, 0, 0.9, 1.2);
  c.fillStyle = '#e4dcef'; c.beginPath(); c.ellipse(0.2, 0.3, 0.16, 0.3, 0, 0, 7); c.fill();
  dab(c, -0.18, 0.92, 0.09, '#e8954a'); dab(c, 0.2, 0.95, 0.06, '#3b332e'); dab(c, -0.1, 0.3, 0.08, '#e8954a');
  c.fillStyle = '#f2a7a7'; poly(c, [[-0.27, 1.02], [-0.29, 1.08], [-0.21, 1.0]]); c.fill(); c.beginPath(); poly(c, [[0.27, 1.02], [0.29, 1.08], [0.21, 1.0]]); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#3b2f28'; c.lineWidth = 0.022;
  [-0.11, 0.11].forEach((x) => { c.beginPath(); c.arc(x, 0.83, 0.05, 0.3, Math.PI - 0.3); c.stroke(); });
  dab(c, 0, 0.77, 0.022, '#e77a86'); c.lineWidth = 0.012; c.beginPath(); c.arc(-0.025, 0.74, 0.025, 0.2, 2.6); c.arc(0.025, 0.74, 0.025, 0.6, 2.9); c.stroke();
  c.strokeStyle = 'rgba(80,60,50,.6)'; c.lineWidth = 0.008; [[0.09, 0.76, 0.3, 0.8], [0.09, 0.74, 0.3, 0.72], [-0.09, 0.76, -0.3, 0.8], [-0.09, 0.74, -0.3, 0.72]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
  soft(c, -0.18, 0.74, 0.05, '#f39a9a', 0.6); soft(c, 0.18, 0.74, 0.05, '#f39a9a', 0.6);
  c.fillStyle = '#c4362f'; c.fillRect(-0.3, 0.58, 0.6, 0.06); dab(c, 0, 0.55, 0.05, '#e7b93f'); dab(c, -0.012, 0.565, 0.015, '#fff3c0');
  c.fillStyle = '#e7b93f'; c.beginPath(); c.ellipse(0, 0.3, 0.14, 0.19, 0, 0, 7); c.fill(); c.strokeStyle = '#b6862a'; c.lineWidth = 0.012; c.stroke();
  text(c, '千万両', 0, 0.3, 0.07, '#7a4a18', { vertical: true });
}, { ppu: 500 });
const pawA = () => cutoutAsset(K('paw'), (p) => { p.moveTo(-0.08, 0); p.lineTo(0.08, 0); p.lineTo(0.09, 0.22); p.bezierCurveTo(0.1, 0.33, -0.1, 0.33, -0.09, 0.22); p.closePath(); }, (c) => {
  c.fillStyle = '#fbf8f1'; c.fillRect(-0.2, 0, 0.4, 0.4); dab(c, 0, 0.26, 0.03, '#f2a7a7'); [-0.04, 0, 0.04].forEach((x) => dab(c, x, 0.31, 0.012, '#f2a7a7'));
}, { ppu: 600 });
export function buildNeko(): Foldable {
  const paw = new THREE.Group(); paw.position.set(-0.3, 0.62, 0.03); paw.add(cutout(pawA()));
  const g = group(cutout(nekoA()), paw);
  g.userData.tick = (t) => { paw.rotation.z = 0.15 + Math.max(0, Math.sin(t * 2.6)) * 0.45; };
  return g;
}
const plantA = () => cutoutAsset(K('plant'), (p) => {
  const pts: number[][] = [[0.08, 0]];
  for (let i = 0; i <= 50; i++) { const a = -0.35 + ((Math.PI + 0.7) * i) / 50, r = 0.62 + 0.1 * Math.sin(a * 7) + 0.05 * Math.sin(a * 13); pts.push([Math.cos(a) * r * 1.05, 0.75 + Math.sin(a) * r]); }
  pts.push([-0.08, 0]); poly(p, pts);
}, (c) => {
  c.fillStyle = '#4a7a3d'; c.fillRect(-0.8, 0, 1.6, 1.5);
  c.strokeStyle = '#3d6233'; c.lineWidth = 0.03; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(rand(-0.3, 0.3), 0.5, rand(-0.6, 0.6), rand(0.7, 1.2)); c.stroke(); }
  foliage(c, -0.7, 0.2, 1.4, 1.15, { shade: '#3f6e3a', mid: '#5f9a4c', light: '#8cc464', hi: '#c8eb94' }, { n: 34, r: [0.12, 0.2] });
}, { ppu: 380, t: 0.03 });
const potMat = () => latheMat(K('pot'), 256, 64, (c, w, h) => { c.fillStyle = '#c97a4f'; c.fillRect(0, 0, w, h); c.fillStyle = '#a95f3b'; c.fillRect(0, 0, w, 10); c.fillStyle = 'rgba(255,230,200,.25)'; c.fillRect(0, 14, w, 4); });
export function buildPlant(): Foldable {
  const pts = [[0.001, 0], [0.24, 0], [0.32, 0.45], [0.36, 0.48], [0.36, 0.55], [0.001, 0.55]].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), potMat());
  const a = cutout(plantA()); a.position.y = 0.4; const b = cutout(plantA()); b.position.y = 0.4; b.rotation.y = Math.PI / 2;
  const g = group(pot, a, b);
  g.userData.tick = (t) => { a.rotation.z = Math.sin(t * 0.9) * 0.015; };
  return g;
}
export function buildTeapot(): Foldable {
  const iron = plainM(K('iron'), '#3d3936');
  const prof = [[0.001, 0], [0.3, 0], [0.42, 0.18], [0.44, 0.3], [0.36, 0.46], [0.2, 0.52], [0.001, 0.53]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), iron);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), iron); knob.position.y = 0.56;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 24, Math.PI), plainM(K('handle'), '#2b2724')); handle.position.y = 0.5;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.3, 10), iron); spout.position.set(0.47, 0.32, 0); spout.rotation.z = -0.9;
  const g = group(body, knob, handle, spout);
  const cupM = plainM(K('cup'), '#d9cdb5');
  [-0.75, -1.05].forEach((x, i) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.18, 18), cupM); cup.position.set(x, 0.09, 0.15 + i * 0.25); g.add(cup); });
  return g;
}
export function buildBooks(): Foldable {
  const g = group(); let x = -0.6;
  for (const [col, h, w] of [['#7d3b33', 1.25, 0.2], ['#2f4e6b', 1.1, 0.24], ['#c9a24a', 1.2, 0.16], ['#4f6b3f', 1.0, 0.22], ['#8a5a8a', 0.95, 0.18]] as [string, number, number][]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.85), plainM(K('book' + col), col)); m.position.set(x + w / 2, h / 2, 0); g.add(m); x += w + 0.01;
  }
  const lying = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.7), plainM(K('bookL'), '#b25b3d')); lying.position.set(0.75, 0.08, 0.05); lying.rotation.y = 0.2; g.add(lying);
  return g;
}

// ── kit boxes
export const BOX = { w: 3.2, h: 2.25, d: 0.7 };
/** A kit box standing on the shelf, its cover showing the finished diorama. */
export function buildKitBox(def: SceneDef, art: HTMLCanvasElement, placed: number, total: number): THREE.Mesh {
  const cover = newCanvas(540, 380), c = cover.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, def.box[0]); g.addColorStop(1, def.box[1]);
  c.fillStyle = g; c.fillRect(0, 0, 540, 380);
  c.fillStyle = '#fbf6ec'; c.beginPath(); c.roundRect(18, 18, 504, 280, 14); c.fill();
  c.save(); c.beginPath(); c.roundRect(24, 24, 492, 268, 10); c.clip();
  const sky = c.createLinearGradient(0, 24, 0, 292); sky.addColorStop(0, mix(def.box[1], '#ffffff', 0.55)); sky.addColorStop(1, '#fdf8ef'); c.fillStyle = sky; c.fillRect(24, 24, 492, 268);
  c.drawImage(art, 24, 14, 492, 492 * (art.height / art.width));
  c.restore();
  c.fillStyle = '#fbf6ec'; c.font = '800 34px Nunito, sans-serif'; c.textBaseline = 'middle'; c.fillText(def.title, 26, 334);
  c.font = '700 18px Nunito, sans-serif'; c.fillStyle = rgba('#fbf6ec', 0.85); c.fillText(`${def.season} · ${total} kawałków`, 28, 362);
  c.fillStyle = '#c4362f'; c.fillRect(470, 316, 50, 50); c.fillStyle = '#fbf6ec'; c.font = `700 22px ${JP}`; c.textAlign = 'center';
  c.fillText('箱', 495, 330); c.fillText('庭', 495, 353);
  c.font = `800 46px ${JP}`; c.fillStyle = 'rgba(255,255,255,.95)'; c.textAlign = 'right'; c.fillText(def.jp, 506, 64);
  if (placed > 0) {
    c.save(); c.translate(70, 80); c.rotate(-0.25);
    c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fill(); c.strokeStyle = '#c99a20'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#5a3d10'; c.textAlign = 'center'; c.font = '800 26px Nunito, sans-serif'; c.fillText(`${placed}/${total}`, 0, -4);
    c.font = '700 13px Nunito, sans-serif'; c.fillText('w trakcie', 0, 18); c.restore();
  }
  const side = newCanvas(64, 380), s = side.getContext('2d')!;
  s.fillStyle = def.box[0]; s.fillRect(0, 0, 64, 380); s.fillStyle = '#fbf6ec'; s.font = `800 30px ${JP}`; s.textAlign = 'center';
  [...def.jp].forEach((ch, i) => s.fillText(ch, 32, 60 + i * 36));
  const top = newCanvas(64, 64), tc = top.getContext('2d')!; tc.fillStyle = mix(def.box[0], '#ffffff', 0.15); tc.fillRect(0, 0, 64, 64);
  const m = (cv: HTMLCanvasElement) => paperMat(toTex(cv));
  const sideM = m(side);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(BOX.w, BOX.h, BOX.d), [sideM, sideM, m(top), m(top), m(cover), sideM]);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

