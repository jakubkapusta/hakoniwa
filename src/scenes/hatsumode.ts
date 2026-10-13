// Scene 10: a temple on New Year's Eve (hatsumode), snowing. The main hall, a five-storey pagoda stacked tier by
// tier, a bell tower, an incense burner, stone lanterns, kadomatsu, fortunes tied to a rack, an amazake stand.
// Bigger kit (32 pieces). Finale: midnight, snow thickens, the lanterns glow and the great bell is struck again and again.
import * as THREE from 'three';
import { audio, sfx } from '../audio/audio';
import { blob, dab, JPG, meadow, mottle, newCanvas, poly, rrect, soft, text, toTex, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { ease, lerp, mix, pick, rand, rnd } from '../core/util';
import { boardMat, cutout, cutoutAsset, foldBox, gableRoof, glowing, group, latheMat, memo, paperMat, plainM, toon } from '../kit/kit';
import { face, figure } from '../kit/people';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'hatsumode:' + s;
const HZ = -1.25, HW = 2.2, HD = 1.2, HH = 0.9, BASE = 0.3; // the main hall
const RA = 0.55, RL = 1.0, RY = BASE + HH + (HD / 2) * Math.tan(RA);
const PG = { x: 2.35, z: -1.5 }; // pagoda
const BT = { x: -2.35, z: -1.0 }; // bell tower
const BELL_PERIOD = 7, STRIKE = 3.2; // the log swings back and strikes once per period
const SNOW = '#f4f7fb';

// ── backdrop, wall, pines
const hillY = (x: number) => 1.25 + 0.3 * Math.sin(x * 0.9 + 0.4) + 0.15 * Math.sin(x * 2.2) + 0.35 * Math.max(0, 1 - Math.abs(x - 0.4) / 1.5);
function hillsOutline(p: Pen) { p.moveTo(-3.1, 0); for (let i = 0; i <= 90; i++) { const x = -3.1 + (6.2 * i) / 90; p.lineTo(x, hillY(x)); } p.lineTo(3.1, 0); p.closePath(); }
const hillsA = () => cutoutAsset(K('hills'), hillsOutline, (c) => {
  const g = c.createLinearGradient(0, 2.2, 0, 0.6); g.addColorStop(0, '#dfe8f2'); g.addColorStop(1, '#b4c4d8'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.4);
  for (let x = -3.2; x < 3.2; x += rand(0.06, 0.1)) {
    const h = rand(0.22, 0.4), y0 = 0.55 + 0.12 * Math.sin(x * 2.1);
    c.fillStyle = mix('#2f4a4a', '#1f3434', rnd()); c.beginPath(); poly(c, [[x, y0 + h], [x - h * 0.28, y0], [x + h * 0.28, y0]]); c.fill();
    c.fillStyle = SNOW; c.beginPath(); poly(c, [[x, y0 + h], [x - h * 0.1, y0 + h * 0.65], [x + h * 0.08, y0 + h * 0.7]]); c.fill();
  }
  c.fillStyle = '#e4ebf3'; c.fillRect(-3.2, 0, 6.4, 0.58);
  // a far temple roof among the trees
  c.fillStyle = '#4a4e5a'; c.beginPath(); poly(c, [[-2.1, 0.72], [-1.5, 0.72], [-1.62, 0.84], [-1.98, 0.84]]); c.fill(); c.fillStyle = SNOW; c.fillRect(-1.98, 0.83, 0.36, 0.03);
}, { ppu: 170, ink: 0 });
const WALL_W = 6.2, WALL_H = 0.5;
const wallMat = () => boardMat(K('wall'), WALL_W, WALL_H, (c, W, H) => {
  c.fillStyle = '#d8b878'; c.fillRect(0, 0, W, H);
  [0.14, 0.2, 0.26, 0.32, 0.38].forEach((y) => { c.fillStyle = '#f6efe0'; c.fillRect(0, y, W, 0.025); }); // the five lines of a temple wall
  for (let x = 0.6; x < W; x += 1.2) { c.fillStyle = '#5a4030'; c.fillRect(x, 0, 0.06, H); }
  mottle(c, 0, H * 0.8, W, H * 0.2, ['#a8946a', '#c8b48a'], 30, [0.03, 0.08], 0.5);
}, { ppu: 160 });
function buildWall() {
  const side = plainM(K('wallSide'), '#c8a868');
  const w = new THREE.Mesh(new THREE.BoxGeometry(WALL_W, WALL_H, 0.12), [side, side, side, side, wallMat(), side]); w.position.y = WALL_H / 2;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.1, 0.07, 0.24), plainM(K('tile'), '#4a4e5a')); cap.position.y = WALL_H + 0.03;
  const snow = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.06, 0.04, 0.2), plainM(K('snow'), SNOW)); snow.position.y = WALL_H + 0.08;
  return group(w, cap, snow);
}
const pineA = () => cutoutAsset(K('pine'), (p) => poly(p, [[0.07, 0], [0.07, 0.3], [0.62, 0.3], [0.25, 0.85], [0.5, 0.85], [0.16, 1.4], [0.36, 1.4], [0, 2.0], [-0.36, 1.4], [-0.16, 1.4], [-0.5, 0.85], [-0.25, 0.85], [-0.62, 0.3], [-0.07, 0.3], [-0.07, 0]]), (c) => {
  c.fillStyle = '#5a4030'; c.fillRect(-0.1, 0, 0.2, 0.4);
  [[0.3, 0.62, 0.85], [0.85, 0.5, 1.4], [1.4, 0.36, 2.0]].forEach(([y0, w, y1]) => {
    c.fillStyle = '#2f5a46'; c.beginPath(); poly(c, [[-w, y0], [w, y0], [0, y1 + 0.02]]); c.fill();
    c.fillStyle = '#3f7258'; c.beginPath(); poly(c, [[-w * 0.85, y0 + 0.02], [-w * 0.05, y0 + 0.02], [-0.02, y1]]); c.fill();
    c.fillStyle = SNOW; c.beginPath(); c.moveTo(-w * 0.95, y0 + 0.02);
    for (let x = -w * 0.95; x <= w * 0.95; x += 0.05) c.lineTo(x, y0 + 0.07 + Math.abs(Math.sin(x * 14)) * 0.05);
    c.lineTo(w * 0.95, y0 + 0.02); c.closePath(); c.fill();
    c.beginPath(); poly(c, [[0, y1 + 0.02], [-w * 0.3, y1 - (y1 - y0) * 0.35], [w * 0.25, y1 - (y1 - y0) * 0.3]]); c.fill();
  });
}, { ppu: 300, t: 0.03 });
function buildPines() {
  const g = group();
  [[-1.6, -1.95, 0.9], [-2.95, -1.75, 1.05], [-2.25, -2.1, 1.0]].forEach(([x, z, s]) => { const a = cutout(pineA()), b = cutout(pineA()); b.rotation.y = Math.PI / 2; const t = group(a, b); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t); });
  return g;
}

// ── the main hall: stone platform with steps, walls with vermilion pillars, a big snowy roof, ridge with shibi
function buildBase() {
  const st = plainM(K('stone'), '#a8a49c'), top = plainM(K('stoneTop'), '#bcb8b0');
  const m = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.4, BASE, HD + 0.5), [st, st, top, st, st, st]); m.position.y = BASE / 2;
  const g = group(m);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, BASE * (i + 1) / 3, 0.12), st); s.position.set(0, BASE * (i + 1) / 6, (HD + 0.5) / 2 + 0.06 + (2 - i) * 0.12); g.add(s); }
  const snow = plainM(K('snow'), SNOW);
  [[-1, 1], [1, 1]].forEach(([sx]) => { const sn = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.3), snow); sn.position.set(sx * 1.0, BASE + 0.015, (HD + 0.5) / 2 - 0.15); g.add(sn); });
  g.traverse((o) => { o.receiveShadow = true; });
  return g;
}
const PILLARS = [0.02, 0.56, 1.1, 1.64, 2.18];
const hallFront = () => boardMat(K('front'), HW, HH, (c, W, H) => {
  c.fillStyle = '#f2ead8'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, W, 0.1); c.fillStyle = '#c8a050'; for (let x = 0.08; x < W; x += 0.16) c.fillRect(x, 0.03, 0.06, 0.04); // bracket ends
  // three bays of latticed doors (lit inside), plain panels at the ends
  [0.56, 1.1].forEach((x0, i) => {
    c.fillStyle = '#ffe8c0'; c.fillRect(x0 + 0.04, 0.2, 0.46, H - 0.26);
    c.strokeStyle = '#7a3a2a'; c.lineWidth = 0.012; for (let x = x0 + 0.04; x <= x0 + 0.5; x += 0.046) { c.beginPath(); c.moveTo(x, 0.2); c.lineTo(x, H - 0.06); c.stroke(); } for (let y = 0.2; y < H - 0.05; y += 0.046) { c.beginPath(); c.moveTo(x0 + 0.04, y); c.lineTo(x0 + 0.5, y); c.stroke(); }
    void i;
  });
  c.fillStyle = '#e8dcc8'; c.fillRect(0.06, 0.2, 0.46, H - 0.26); c.fillRect(1.68, 0.2, 0.46, H - 0.26);
  c.strokeStyle = '#7a3a2a'; c.lineWidth = 0.014; [0.06, 1.68].forEach((x) => { c.strokeRect(x + 0.04, 0.28, 0.38, 0.3); });
  PILLARS.forEach((x) => { c.fillStyle = '#c8402f'; c.fillRect(x - 0.025, 0.1, 0.05, H - 0.1); });
  c.fillStyle = '#c8402f'; c.fillRect(0, 0.14, W, 0.04); c.fillStyle = '#5a3a2a'; c.fillRect(0, H - 0.05, W, 0.05);
}, { ppu: 320, emissive: (c, _W, H) => { [0.56, 1.1].forEach((x0) => { c.fillStyle = '#ffc070'; c.fillRect(x0 + 0.04, 0.2, 0.46, H - 0.26); }); } });
const hallSide = () => boardMat(K('side'), HD, HH, (c, W, H) => {
  c.fillStyle = '#f2ead8'; c.fillRect(0, 0, W, H); c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, W, 0.1); c.fillRect(0, H - 0.05, W, 0.05);
  [0.03, W / 2, W - 0.03].forEach((x) => { c.fillStyle = '#c8402f'; c.fillRect(x - 0.025, 0.1, 0.05, H - 0.1); });
  c.fillStyle = '#c8402f'; c.fillRect(0, 0.14, W, 0.04);
  c.strokeStyle = '#7a3a2a'; c.lineWidth = 0.012; [0.12, 0.68].forEach((x) => { c.fillStyle = '#ffe8c0'; c.fillRect(x, 0.3, 0.38, 0.28); for (let k = x; k <= x + 0.38; k += 0.04) { c.beginPath(); c.moveTo(k, 0.3); c.lineTo(k, 0.58); c.stroke(); } });
}, { ppu: 320, emissive: (c) => { [0.12, 0.68].forEach((x) => { c.fillStyle = '#ffc070'; c.fillRect(x, 0.3, 0.38, 0.28); }); } });
const buildHall = () => { const s = hallSide(); return foldBox({ w: HW, d: HD, h: HH, top: plainM(K('hallTop'), '#4a3a30'), front: hallFront(), back: s, left: s, right: s }); };
const snowRoof = (key: string, W: number, H: number) => boardMat(K(key), W, H, (c, w, h) => {
  c.fillStyle = '#4a4e5a'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 0.09) { c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x, 0, 0.04, h); }
  c.fillStyle = SNOW; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
  for (let x = w; x >= 0; x -= 0.05) c.lineTo(x, h * 0.8 + Math.sin(x * 11) * 0.03 + rand(-0.01, 0.01));
  c.closePath(); c.fill();
  for (let i = 0; i < Math.round(w * 6); i++) blob(c, rand(0, w), rand(0.08, h * 0.72), rand(0.04, 0.12), '#d6e0ee', 0.5, 0.3);
  c.fillStyle = '#c8a050'; for (let x = 0.045; x < w; x += 0.09) dab(c, x, h - 0.025, 0.018, '#c8a050'); // gilded tile ends
}, { ppu: 260 });
const buildRoof = () => gableRoof({ w: HW + 0.8, l: RL, angle: RA, t: 0.05, top: snowRoof('roof', HW + 0.8, RL), under: plainM(K('under'), '#5a3a2a') });
const shibiA = () => cutoutAsset(K('shibi'), (p) => { p.moveTo(-0.06, 0); p.lineTo(0.08, 0); p.bezierCurveTo(0.1, 0.12, 0.04, 0.22, -0.06, 0.3); p.bezierCurveTo(-0.02, 0.18, -0.1, 0.1, -0.06, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#d8a83a'; c.fillRect(-0.15, 0, 0.3, 0.35); c.strokeStyle = '#a8782a'; c.lineWidth = 0.008; for (let y = 0.04; y < 0.3; y += 0.04) { c.beginPath(); c.moveTo(-0.06, y); c.lineTo(0.08, y + 0.02); c.stroke(); }
}, { ppu: 800, t: 0.03 });
function buildRidge() {
  const g = group(), cap = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.85, 0.1, 0.16), plainM(K('ridgeM'), '#3a3e48')); cap.position.y = 0.04; g.add(cap);
  const sn = new THREE.Mesh(new THREE.BoxGeometry(HW + 0.8, 0.04, 0.14), plainM(K('snow'), SNOW)); sn.position.y = 0.1; g.add(sn);
  [-1, 1].forEach((s) => { const m = cutout(shibiA()); m.position.set(s * (HW / 2 + 0.38), 0.08, 0); m.scale.x = s; g.add(m); });
  return g;
}
const lanternGlow = () => memo(K('lanTex'), () => { const m = latheMat(K('lanTexP'), 128, 96, (c, w, h) => { c.fillStyle = '#f6efe0'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 8; y < h; y += 10) c.fillRect(0, y, w, 2); c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, 7); c.fillRect(0, h - 7, w, 7); text(c, '奉納', w / 4, h / 2, 26, '#c4362f'); text(c, '奉納', (w * 3) / 4, h / 2, 26, '#c4362f'); }); glowing(m); m.emissiveMap = m.map; return m; });
const LAN_PTS = (() => { const p: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const y = -0.15 + (0.3 * i) / 12; p.push(new THREE.Vector2(0.04 + 0.08 * Math.sqrt(Math.max(0, 1 - (y / 0.15) ** 2)), y)); } return p; })();
const suzuMat = () => memo(K('suzu'), () => toon({ color: '#d8a83a' }));
function buildSaisen() {
  const wd = plainM(K('saisenW'), '#7a5030');
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.3), [wd, wd, boardMat(K('saisenTop'), 0.7, 0.3, (c, W, H) => { c.fillStyle = '#6a4028'; c.fillRect(0, 0, W, H); for (let x = 0.03; x < W; x += 0.06) { c.fillStyle = '#3a2418'; c.fillRect(x, 0.03, 0.03, H - 0.06); } }, { ppu: 300 }), wd, boardMat(K('saisenF'), 0.7, 0.28, (c, W, H) => { wood(c, W, H, '#7a5030', { dir: 'h', plank: 0.07 }); text(c, '賽銭', W / 2, H / 2, 0.11, '#f2ead8'); }, { ppu: 300 }), wd]);
  box.position.set(0, 0.14, 0);
  const g = group(box);
  // the big bell on a striped rope, hanging from the eave
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.6, 6), latheMat(K('rope'), 32, 128, (c, w, h) => { for (let y = 0; y < h; y += 16) { c.fillStyle = ['#c4362f', '#f6efe0', '#3f6aa8'][(y / 16) % 3]; c.fillRect(0, y, w, 16); } }));
  const pv = new THREE.Group(); pv.position.set(0, HH + 0.05, 0.08); rope.position.y = -0.38; pv.add(rope);
  const suzu = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), suzuMat()); suzu.position.y = -0.04; pv.add(suzu);
  g.add(pv);
  [-0.85, 0.85].forEach((x) => { const l = new THREE.Mesh(new THREE.LatheGeometry(LAN_PTS, 16), lanternGlow()); l.position.set(x, HH - 0.12, 0.2); g.add(l); });
  g.userData.tick = (t) => { pv.rotation.z = Math.sin(t * 0.9) * 0.04; };
  return g;
}

// ── the pagoda: a podium and five tiers, stacked in three pieces, then the spire
const PAGODA_S = [0.62, 0.56, 0.5, 0.44, 0.38], TIER = 0.34, POD = 0.12;
const tierY = (i: number) => POD + i * TIER;
const pagodaWall = () => boardMat(K('pwall'), 0.62, 0.26, (c, W, H) => { c.fillStyle = '#f2ead8'; c.fillRect(0, 0, W, H); c.fillStyle = '#c8402f'; [0.03, W / 2, W - 0.03].forEach((x) => c.fillRect(x - 0.025, 0, 0.05, H)); c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, W, 0.04); c.fillStyle = '#7a3a2a'; c.fillRect(W / 2 - 0.12, 0.08, 0.09, 0.16); c.fillRect(W / 2 + 0.03, 0.08, 0.09, 0.16); }, { ppu: 300 });
function tier(i: number) {
  const s = PAGODA_S[i], y0 = tierY(i), wall = pagodaWall(), g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, 0.26, s), wall); body.position.y = y0 + 0.13; g.add(body);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(s + 0.36, 0.04, s + 0.36), plainM(K('eave'), '#5a3a2a')); eave.position.y = y0 + 0.28; g.add(eave);
  const roof = new THREE.Mesh(new THREE.ConeGeometry((s + 0.42) / Math.SQRT2, 0.16, 4, 1), plainM(K('proof'), '#4a4e5a')); roof.rotation.y = Math.PI / 4; roof.position.y = y0 + 0.38; g.add(roof);
  const snow = new THREE.Mesh(new THREE.ConeGeometry((s + 0.3) / Math.SQRT2, 0.12, 4, 1), plainM(K('snow'), SNOW)); snow.rotation.y = Math.PI / 4; snow.position.y = y0 + 0.41; g.add(snow);
  // little bells at the corners
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), suzuMat()); b.position.set(sx * (s + 0.36) / 2, y0 + 0.24, sz * (s + 0.36) / 2); g.add(b); });
  return g;
}
function buildPagoda(tiers: number[], podium = false) {
  const g = group();
  if (podium) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.05, POD, 1.05), plainM(K('stone'), '#a8a49c')); p.position.y = POD / 2; g.add(p); }
  tiers.forEach((i) => g.add(tier(i)));
  g.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return g;
}
function buildSorin() {
  const gold = plainM(K('gold'), '#c8a050'), y0 = tierY(4) + 0.44;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 8), gold); pole.position.y = y0 + 0.31;
  const g = group(pole);
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045 - i * 0.002, 0.008, 5, 14), gold); r.rotation.x = Math.PI / 2; r.position.y = y0 + 0.12 + i * 0.045; g.add(r); }
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), gold); flame.scale.y = 1.6; flame.position.y = y0 + 0.66; g.add(flame);
  return g;
}

// ── the bell tower
function buildBelltower() {
  const wd = plainM(K('btWood'), '#7a4a32'), st = plainM(K('stone'), '#a8a49c');
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 0.95), st); base.position.y = 0.075;
  const g = group(base);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.07), wd); p.position.set(sx * 0.34, 0.15 + 0.525, sz * 0.34); p.rotation.set(sz * 0.04, 0, -sx * 0.04); g.add(p); });
  [-0.34, 0.34].forEach((z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.06, 0.06), wd); b.position.set(0, 1.17, z); g.add(b); const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.04, 0.04), wd); b2.position.set(0, 0.45, z); g.add(b2); });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8), wd); beam.position.set(0, 1.17, 0); g.add(beam);
  const roof = gableRoof({ w: 1.2, l: 0.64, angle: RA, top: snowRoof('btRoof', 1.2, 0.64), under: plainM(K('under'), '#5a3a2a') }); roof.position.y = 1.2 + 0.34 * Math.tan(RA);
  g.add(roof);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
const bellMat = () => latheMat(K('bellTex'), 128, 128, (c, w, h) => {
  c.fillStyle = '#4a5a4a'; c.fillRect(0, 0, w, h);
  for (let y = 10; y < h * 0.6; y += 14) for (let x = 4; x < w; x += 12) dab(c, x, y, 3, '#6a7a62'); // the nipples (chi)
  c.fillStyle = '#3a4a3a'; c.fillRect(0, h * 0.62, w, 4); c.fillRect(0, h * 0.82, w, 4);
  c.fillStyle = '#7a8a6a'; for (let i = 0; i < 30; i++) dab(c, rand(0, w), rand(0, h), rand(2, 6), '#5f7058', 0.6);
});
function buildBell() {
  const prof = [[0.001, 0.42], [0.1, 0.42], [0.16, 0.36], [0.17, 0.1], [0.2, 0.0], [0.18, 0.0], [0.15, 0.08]].map(([x, y]) => new THREE.Vector2(x, y));
  const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), bellMat()); bell.material.side = THREE.DoubleSide;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), plainM(K('hook'), '#3a3a3a')); hook.position.y = 0.46;
  const pv = new THREE.Group(); pv.position.y = 1.15; bell.position.y = -0.48; hook.position.y = -0.02; pv.add(bell, hook);
  const g = group(pv);
  g.userData.bell = pv;
  return g;
}
const LOG_PIVOT_Y = 1.14, LOG_DROP = 0.32;
function buildLog() {
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.5, 10), plainM(K('log'), '#a88a62')); log.rotation.z = Math.PI / 2; log.position.set(0.25, -LOG_DROP, 0);
  const pv = new THREE.Group(); pv.position.set(0.18, LOG_PIVOT_Y, 0); pv.add(log);
  const ropeM = plainM(K('logRope'), '#e8dcc0');
  [0.1, 0.4].forEach((x) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, LOG_DROP, 4), ropeM); r.position.set(x, -LOG_DROP / 2, 0); pv.add(r); });
  const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.55, 4), ropeM); pull.position.set(0.5, -LOG_DROP - 0.27, 0); pull.rotation.z = -0.4; pv.add(pull);
  const g = group(pv);
  g.userData.tick = (t) => { pv.rotation.z = logAngle(t); };
  return g;
}
/** The log is drawn back slowly, then let go: it strikes the bell at STRIKE and bounces off. */
function logAngle(t: number) {
  const p = ((t % BELL_PERIOD) + BELL_PERIOD) % BELL_PERIOD;
  if (p < 2.2) return lerp(0, 0.5, ease.inOut(p / 2.2));
  if (p < 2.8) return 0.5;
  if (p < STRIKE) return lerp(0.5, 0, ease.in((p - 2.8) / (STRIKE - 2.8)));
  return Math.sin((p - STRIKE) * 9) * 0.12 * Math.exp(-(p - STRIKE) * 2.5);
}

// ── the precinct: gate, path, lanterns, incense burner, water pavilion
function buildGate() {
  const wd = plainM(K('gateW'), '#7a4a32'), g = group();
  [-0.5, 0.5].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.15, 0.09), wd); p.position.set(x, 0.575, 0); g.add(p); });
  const tie = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.07), wd); tie.position.y = 0.98; g.add(tie);
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.03), [wd, wd, wd, wd, boardMat(K('plaque'), 0.34, 0.14, (c, W, H) => { c.fillStyle = '#2a2420'; c.fillRect(0, 0, W, H); text(c, '福寿寺', W / 2, H / 2, 0.08, '#d8b060'); }, { ppu: 500 }), wd]); plaque.position.set(0, 1.07, 0.05); g.add(plaque);
  const roof = gableRoof({ w: 1.5, l: 0.42, angle: RA, top: snowRoof('gateRoof', 1.5, 0.42), under: plainM(K('under'), '#5a3a2a') }); roof.position.y = 1.15 + 0.18 * Math.tan(RA) + 0.04; g.add(roof);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
function buildPath() {
  const g = group(), mats = ['#a8a49c', '#9a968e', '#b4b0a8'].map((c, i) => plainM(K('slab' + i), c));
  for (let z = 2.35; z > -0.05; z -= 0.26) [-0.17, 0.17].forEach((x, i) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.24), mats[(Math.round(z * 10) + i) % 3]); s.position.set(x + rand(-0.01, 0.01), 0.015, z + (i ? 0.06 : -0.06)); s.receiveShadow = true; g.add(s); });
  return g;
}
const fireboxMat = () => memo(K('firebox'), () => {
  const a = newCanvas(192, 64), b = newCanvas(192, 64), x = a.getContext('2d')!, y = b.getContext('2d')!;
  x.fillStyle = '#a39e92'; x.fillRect(0, 0, 192, 64); y.fillStyle = '#000'; y.fillRect(0, 0, 192, 64);
  [0, 96].forEach((px) => { x.fillStyle = '#3a3630'; x.fillRect(px + 6, 12, 20, 40); y.fillStyle = '#ffc070'; y.fillRect(px + 6, 12, 20, 40); });
  const m = paperMat(toTex(a)); glowing(m); m.emissiveMap = toTex(b); return m;
});
function stoneLantern() {
  const st = plainM(K('stone'), '#a8a49c'), snow = plainM(K('snow'), SNOW);
  const hex = (rt: number, rb: number, h: number, y: number, m: THREE.Material = st) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 6, 1, false, -Math.PI / 6), m); o.position.y = y; return o; };
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.4, 10), st); post.position.y = 0.28;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.12, 6, 1, false, -Math.PI / 6), st); roof.position.y = 0.79;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.08, 6, 1, false, -Math.PI / 6), snow); cap.position.y = 0.82;
  const g = new THREE.Group(); g.add(hex(0.15, 0.18, 0.08, 0.04), post, hex(0.12, 0.07, 0.06, 0.51), hex(0.08, 0.08, 0.15, 0.62, fireboxMat()), hex(0.2, 0.2, 0.03, 0.71), roof, cap);
  return g;
}
const LANTERNS_AT = [[-0.75, 1.3], [0.75, 1.3], [-0.75, 0.35], [0.75, 0.35]];
function buildLanterns() { const g = group(); LANTERNS_AT.forEach(([x, z]) => { const l = stoneLantern(); l.position.set(x, 0, z); g.add(l); }); g.traverse((m) => { m.castShadow = true; }); return g; }
const emberMat = () => memo(K('ember'), () => { const m = toon({ color: '#6a5a4a' }); m.emissive = new THREE.Color('#ff7a3a'); m.emissiveIntensity = 0.2; return m; });
function buildBurner() {
  const bronze = plainM(K('bronze'), '#5a6a5a');
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.22, 16), bronze); bowl.position.y = 0.36;
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), emberMat()); ash.rotation.x = -Math.PI / 2; ash.position.y = 0.465;
  const g = group(bowl, ash);
  [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2, l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.26, 8), bronze); l.position.set(Math.cos(a) * 0.16, 0.13, Math.sin(a) * 0.16); g.add(l); });
  [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), bronze); p.position.set(s * 0.22, 0.6, 0); g.add(p); });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.14, 4, 1), bronze); roof.rotation.y = Math.PI / 4; roof.position.y = 0.82; g.add(roof);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.1, 4, 1), plainM(K('snow'), SNOW)); snow.rotation.y = Math.PI / 4; snow.position.y = 0.85; g.add(snow);
  // incense sticks
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4), plainM(K('incense'), '#6a8a3a')); s.position.set(rand(-0.12, 0.12), 0.52, rand(-0.12, 0.12)); s.rotation.z = rand(-0.2, 0.2); g.add(s); }
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
function buildTemizuya() {
  const wd = plainM(K('temW'), '#7a4a32'), st = plainM(K('stone'), '#a8a49c');
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.3), st); basin.position.y = 0.13;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.2), plainM(K('temWater'), '#5a8a9a')); water.rotation.x = -Math.PI / 2; water.position.y = 0.262;
  const g = group(basin, water);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), wd); p.position.set(sx * 0.38, 0.425, sz * 0.25); g.add(p); });
  const dragon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 8), plainM(K('bronze'), '#5a6a5a')); dragon.position.set(-0.22, 0.34, 0); dragon.rotation.z = -0.8; g.add(dragon);
  const ladleM = plainM(K('ladle'), '#e8d8b0');
  [-0.05, 0.1, 0.22].forEach((x) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 4), ladleM); h.rotation.x = Math.PI / 2 - 0.3; h.position.set(x, 0.3, 0.05); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.035, 8), ladleM); c.position.set(x, 0.29, -0.06); g.add(h, c); });
  const roof = gableRoof({ w: 1.0, l: 0.4, angle: RA, top: snowRoof('temRoof', 1.0, 0.4), under: plainM(K('under'), '#5a3a2a') }); roof.position.y = 0.85 + 0.25 * Math.tan(RA); g.add(roof);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}

// ── New Year things
function kadomatsu() {
  const g = new THREE.Group(), bam = latheMat(K('bambooTex'), 64, 128, (c, w, h) => { c.fillStyle = '#5a9a4a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7ab85a'; c.fillRect(w * 0.15, 0, w * 0.15, h); c.fillStyle = '#3f7a3a'; c.fillRect(0, h * 0.7, w, 4); });
  [[0, 0, 0.5], [0.06, 0.05, 0.42], [-0.06, 0.05, 0.36]].forEach(([x, z, h]) => {
    const geo = new THREE.CylinderGeometry(0.045, 0.045, h, 10); const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) - (pos.getZ(i) + 0.045) * 0.6); // cut on a slant
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, bam); m.position.set(x, h / 2 + 0.08, z); g.add(m);
  });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.2, 14), plainM(K('straw'), '#c8a868')); straw.position.y = 0.1; g.add(straw);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.012, 6, 18), plainM(K('strawRope'), '#8a6a3a')); rope.rotation.x = Math.PI / 2; rope.position.y = 0.12; g.add(rope);
  [[-0.12, 0.08], [0.12, 0.06], [0.0, -0.12]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), plainM(K('pineSprig'), '#2f6a3a')); p.scale.y = 0.8; p.position.set(x, 0.24, z); g.add(p); });
  [[0.13, -0.05], [-0.1, -0.1]].forEach(([x, z]) => dabBerry(g, x, z));
  return g;
}
function dabBerry(g: THREE.Group, x: number, z: number) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), plainM(K('berry'), '#d8302a')); b.position.set(x, 0.28, z); g.add(b); }
function buildKadomatsu() { const g = group(); [-0.82, 0.82].forEach((x) => { const k = kadomatsu(); k.position.set(x, 0, 0); g.add(k); }); g.traverse((m) => { m.castShadow = true; }); return g; }
function buildOmikuji() {
  const wd = plainM(K('omiW'), '#8a6a48'), paper = plainM(K('omiP'), '#fbf8f0'), g = group();
  [-0.4, 0.4].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), wd); p.position.set(x, 0.375, 0); g.add(p); });
  [0.35, 0.55, 0.72].forEach((y) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4), plainM(K('omiRope'), '#c8b48a')); r.rotation.z = Math.PI / 2; r.position.y = y; g.add(r);
    for (let x = -0.35; x < 0.36; x += 0.045) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.012), paper); k.position.set(x + rand(-0.01, 0.01), y - 0.02, rand(-0.01, 0.01)); k.rotation.z = rand(-0.3, 0.3); g.add(k); } });
  const sn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.1), plainM(K('snow'), SNOW)); sn.position.y = 0.76; g.add(sn);
  return g;
}
const emaA = (k: number) => cutoutAsset(K('ema' + k), (p) => poly(p, [[-0.06, 0], [0.06, 0], [0.06, 0.07], [0, 0.1], [-0.06, 0.07]]), (c) => {
  c.fillStyle = '#d8b880'; c.fillRect(-0.1, 0, 0.2, 0.12); c.fillStyle = '#c4362f'; c.fillRect(-0.06, 0.065, 0.12, 0.008);
  if (k === 0) { dab(c, 0, 0.035, 0.02, '#f2ead8'); dab(c, 0, 0.035, 0.012, '#e8a840'); } // a horse? a sunrise
  else if (k === 1) { text(c, '合格', 0, 0.035, 0.03, '#2a2420'); }
  else { dab(c, -0.015, 0.035, 0.012, '#f2f2ee'); dab(c, 0.015, 0.035, 0.012, '#f2f2ee'); dab(c, 0, 0.05, 0.01, '#e8b8c8'); } // a horse year face
}, { ppu: 1400, t: 0.008, ink: 0.005 });
function buildEma() {
  const wd = plainM(K('emaW'), '#7a4a32'), g = group();
  [-0.42, 0.42].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), wd); p.position.set(x, 0.425, 0); g.add(p); });
  [0.42, 0.62].forEach((y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.025), wd); b.position.y = y + 0.1; g.add(b); for (let x = -0.36; x < 0.37; x += 0.09) { const e = cutout(emaA(Math.floor(rnd() * 3))); e.position.set(x, y, 0.02); e.rotation.z = rand(-0.1, 0.1); g.add(e); } });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.24), plainM(K('emaRoof'), '#4a4e5a')); roof.position.y = 0.87; roof.rotation.x = 0.2; g.add(roof);
  const sn = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.03, 0.2), plainM(K('snow'), SNOW)); sn.position.y = 0.9; sn.rotation.x = 0.2; g.add(sn);
  return g;
}
const amaFront = () => boardMat(K('amaF'), 0.8, 0.42, (c, W, H) => { wood(c, W, H, '#8a6a48', { dir: 'h', plank: 0.08 }); c.fillStyle = '#f2ead8'; c.fillRect(0.2, 0.08, 0.4, 0.24); text(c, '甘酒', 0.4, 0.2, 0.12, '#c4362f'); }, { ppu: 300 });
function buildStall() {
  const side = plainM(K('amaS'), '#6a5038');
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 0.36), [side, side, plainM(K('amaT'), '#a07a50'), side, amaFront(), side]); counter.position.y = 0.21;
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.14, 14), plainM(K('amaPot'), '#3a3a3a')); pot.position.set(-0.15, 0.49, -0.04);
  const g = group(counter, pot);
  [[0.15, 0.06], [0.25, -0.05]].forEach(([x, z]) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.05, 8), plainM(K('amaCup'), '#f2ead8')); cup.position.set(x, 0.445, z); g.add(cup); });
  [-0.38, 0.38].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.8, 0.035), side); p.position.set(x, 0.42 + 0.4, -0.15); g.add(p); });
  const roof = gableRoof({ w: 1.0, l: 0.32, angle: 0.4, top: snowRoof('amaRoof', 1.0, 0.32), under: side }); roof.position.set(0, 1.28, -0.15); g.add(roof);
  const l = new THREE.Mesh(new THREE.LatheGeometry(LAN_PTS, 14), lanternGlow()); l.scale.setScalar(0.6); l.position.set(0.32, 1.02, 0.05); g.add(l);
  g.userData.setFold = (k) => roof.userData.setFold!(k);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}

// ── people, animals
const monkA = () => cutoutAsset(K('monk'), figure(1.0, 0.18), (c) => {
  c.fillStyle = '#2a2a30'; c.fillRect(-0.25, 0, 0.5, 0.82); c.fillStyle = '#c8a050'; c.beginPath(); poly(c, [[-0.2, 0.78], [0.14, 0.3], [0.2, 0.36], [-0.12, 0.8]]); c.fill(); // kesa
  c.fillStyle = '#f6efe0'; c.beginPath(); poly(c, [[-0.05, 0.82], [0, 0.72], [0.05, 0.82]]); c.fill();
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.9, 0.09, 0.1, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(120,100,90,.25)'; c.beginPath(); c.ellipse(0, 0.95, 0.085, 0.05, 0, Math.PI, 0, true); c.fill();
  face(c, 0.89, 0.085);
  c.fillStyle = '#8a3a2a'; for (let i = 0; i < 9; i++) dab(c, -0.08 + i * 0.02, 0.5 - Math.abs(i - 4) * 0.012, 0.009, '#8a3a2a'); // beads
}, { ppu: 700 });
function buildMonk() { const m = cutout(monkA()), g = group(m); g.userData.tick = (t) => { const p = ((t % BELL_PERIOD) + BELL_PERIOD) % BELL_PERIOD; m.rotation.z = p < 2.8 ? -0.12 * Math.sin(Math.min(1, p / 2.2) * Math.PI / 2) : -0.12 * Math.max(0, 1 - (p - 2.8) * 3); }; return g; }
const fatherA = () => cutoutAsset(K('father'), figure(1.02, 0.17), (c) => {
  c.fillStyle = '#4a5a72'; c.fillRect(-0.25, 0, 0.5, 0.84); c.fillStyle = '#3a4a62'; c.fillRect(-0.25, 0, 0.5, 0.2);
  c.fillStyle = '#c4362f'; c.fillRect(-0.18, 0.66, 0.36, 0.08); c.fillRect(0.08, 0.5, 0.07, 0.18); // scarf
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.92, 0.09, 0.095, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.98, 0.095, 0.05, 0, Math.PI, 0, true); c.fill();
  face(c, 0.91, 0.085);
}, { ppu: 700 });
const motherA = () => cutoutAsset(K('mother'), figure(0.96, 0.17), (c) => {
  c.fillStyle = '#c86a8a'; c.fillRect(-0.25, 0, 0.5, 0.8); for (let i = 0; i < 12; i++) { const x = rand(-0.14, 0.14), y = rand(0.05, 0.45); for (let k = 0; k < 5; k++) dab(c, x + Math.cos(k * 1.26) * 0.018, y + Math.sin(k * 1.26) * 0.018, 0.011, '#f6efe0'); dab(c, x, y, 0.008, '#f2c94c'); }
  c.fillStyle = '#f2d24a'; c.fillRect(-0.17, 0.48, 0.34, 0.1); c.fillStyle = '#f6f2ea'; c.fillRect(-0.2, 0.7, 0.4, 0.09); // fur stole
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.86, 0.09, 0.095, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.92, 0.1, 0.06, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.99, 0.045, '#2a2420'); dab(c, 0.06, 0.97, 0.018, '#e8574a');
  face(c, 0.85, 0.085);
}, { ppu: 700 });
const childA = () => cutoutAsset(K('child'), figure(0.64, 0.14, ), (c) => {
  c.fillStyle = '#e8b83a'; c.fillRect(-0.2, 0, 0.4, 0.55); c.fillStyle = '#c4362f'; c.fillRect(-0.2, 0, 0.4, 0.1);
  c.fillStyle = '#3f6aa8'; dab(c, -0.17, 0.32, 0.04, '#3f6aa8'); dab(c, 0.17, 0.32, 0.04, '#3f6aa8'); // mittens
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.57, 0.08, 0.08, 0, 0, 7); c.fill();
  c.fillStyle = '#c4362f'; c.beginPath(); c.ellipse(0, 0.62, 0.09, 0.06, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.69, 0.03, '#f6efe0');
  face(c, 0.56, 0.075, false);
}, { ppu: 800 });
function buildFamily() { const f = cutout(fatherA()), m = cutout(motherA()), k = cutout(childA()); f.position.x = -0.22; m.position.x = 0.22; k.position.set(0.0, 0, 0.12); const g = group(f, m, k); g.userData.tick = (t) => { k.position.y = Math.abs(Math.sin(t * 2.4)) * 0.03; }; return g; }
const grandmaA = () => cutoutAsset(K('grandma'), figure(0.86, 0.17), (c) => {
  c.fillStyle = '#6a5a7a'; c.fillRect(-0.25, 0, 0.5, 0.72); c.strokeStyle = '#5a4a6a'; c.lineWidth = 0.01; for (let y = 0.08; y < 0.7; y += 0.06) { c.beginPath(); c.moveTo(-0.22, y); c.lineTo(0.22, y); c.stroke(); }
  c.fillStyle = '#a8c8a0'; c.fillRect(-0.18, 0.6, 0.36, 0.08); // shawl
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.79, 0.085, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = '#dcd6cc'; c.beginPath(); c.ellipse(0, 0.83, 0.095, 0.06, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.9, 0.04, '#dcd6cc');
  face(c, 0.78, 0.08);
}, { ppu: 750 });
function buildGrandma() { const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 5), plainM(K('cane'), '#6a4a32')); cane.position.set(0.2, 0.25, 0.03); cane.rotation.z = -0.15; return group(cutout(grandmaA()), cane); }
const kidA = (k: number) => cutoutAsset(K('kid' + k), figure(0.6, 0.13), (c) => {
  c.fillStyle = k ? '#3f8a6a' : '#e8743a'; c.fillRect(-0.2, 0, 0.4, 0.5); c.fillStyle = '#2a3a4a'; c.fillRect(-0.2, 0, 0.4, 0.12);
  c.fillStyle = k ? '#f2d24a' : '#3f6aa8'; c.fillRect(-0.14, 0.4, 0.28, 0.05);
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.53, 0.075, 0.075, 0, 0, 7); c.fill();
  c.fillStyle = k ? '#c4362f' : '#f6efe0'; c.beginPath(); c.ellipse(0, 0.58, 0.085, 0.055, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 0.64, 0.025, k ? '#f6efe0' : '#c4362f');
  face(c, 0.52, 0.07, false); c.strokeStyle = '#2a2420'; c.lineWidth = 0.007; c.beginPath(); c.arc(0, 0.49, 0.015, 0.2, Math.PI - 0.2); c.stroke();
}, { ppu: 850 });
function buildKids() { const a = cutout(kidA(0)), b = cutout(kidA(1)); a.position.x = -0.18; b.position.set(0.2, 0, 0.05); const g = group(a, b); g.userData.tick = (t) => { a.position.y = Math.abs(Math.sin(t * 3)) * 0.05; b.rotation.z = Math.sin(t * 2) * 0.05; }; return g; }
function snowmanOutline(p: Pen) {
  const pts: number[][] = [];
  for (let a = -50; a <= 230; a += 8) { const r = (a * Math.PI) / 180; pts.push([0.13 * Math.cos(r), 0.46 + 0.13 * Math.sin(r)]); }
  for (let a = 125; a <= 415; a += 8) { const r = (a * Math.PI) / 180; pts.push([0.19 * Math.cos(r), 0.19 + 0.19 * Math.sin(r)]); }
  poly(p, pts);
}
const snowmanA = () => cutoutAsset(K('snowman'), snowmanOutline, (c) => {
  c.fillStyle = '#fbfdff'; c.fillRect(-0.25, 0, 0.5, 0.62); c.fillStyle = '#d6e0ee'; c.beginPath(); c.ellipse(0.07, 0.16, 0.13, 0.16, 0, 0, 7); c.fill();
  c.fillStyle = '#e8743a'; c.beginPath(); c.ellipse(0, 0.57, 0.1, 0.035, 0, 0, 7); c.fill(); // a mikan on top, like kagami mochi
  dab(c, -0.04, 0.48, 0.012, '#2a2420'); dab(c, 0.04, 0.48, 0.012, '#2a2420'); c.fillStyle = '#c4362f'; c.fillRect(-0.12, 0.33, 0.24, 0.04);
}, { ppu: 800 });
const dogA = () => cutoutAsset(K('dog'), (p) => { p.moveTo(-0.18, 0); p.lineTo(-0.15, 0); p.lineTo(-0.14, 0.08); p.lineTo(0.08, 0.08); p.lineTo(0.09, 0); p.lineTo(0.12, 0); p.lineTo(0.13, 0.14); p.lineTo(0.2, 0.16); p.lineTo(0.2, 0.2); p.lineTo(0.16, 0.24); p.lineTo(0.15, 0.3); p.lineTo(0.11, 0.26); p.lineTo(0.08, 0.24); p.bezierCurveTo(0.0, 0.2, -0.12, 0.2, -0.17, 0.17); p.lineTo(-0.22, 0.24); p.lineTo(-0.2, 0.14); p.closePath(); }, (c) => {
  c.fillStyle = '#d8964a'; c.fillRect(-0.25, 0, 0.5, 0.32); c.fillStyle = '#fbf2e2'; c.fillRect(-0.15, 0.06, 0.25, 0.04); c.beginPath(); c.ellipse(0.17, 0.18, 0.04, 0.03, 0, 0, 7); c.fill();
  c.fillStyle = '#c4362f'; c.fillRect(0.06, 0.18, 0.08, 0.035); dab(c, 0.17, 0.21, 0.008, '#2a2420'); dab(c, 0.2, 0.185, 0.008, '#2a2420');
}, { ppu: 1000, t: 0.02 });
const sparrowA = () => cutoutAsset(K('sparrow'), (p) => { const pts = []; for (let i = 0; i <= 30; i++) { const a = (i / 30) * Math.PI * 2; pts.push([Math.cos(a) * 0.06, 0.055 + Math.sin(a) * 0.05]); } poly(p, pts); }, (c) => {
  c.fillStyle = '#a8784a'; c.fillRect(-0.08, 0, 0.16, 0.12); c.fillStyle = '#f2ead8'; c.beginPath(); c.ellipse(0.0, 0.04, 0.045, 0.03, 0, 0, 7); c.fill(); c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(0, 0.09, 0.04, 0.02, 0, 0, 7); c.fill();
  dab(c, -0.02, 0.075, 0.007, '#2a2420'); dab(c, 0.02, 0.075, 0.007, '#2a2420'); dab(c, 0, 0.06, 0.008, '#2a2420');
}, { ppu: 1400, t: 0.02 });
function buildSparrows() { const g = group(), b = [-0.3, -0.05, 0.25].map((x, i) => { const m = cutout(sparrowA()); m.position.x = x; m.scale.setScalar(1 - i * 0.1); g.add(m); return m; }); g.userData.tick = (t) => b.forEach((m, i) => { const k = (t * 0.6 + i * 1.3) % 4; m.position.y = k < 0.25 ? Math.sin((k / 0.25) * Math.PI) * 0.04 : 0; }); return g; }
const catA = () => cutoutAsset(K('cat'), (p) => { p.moveTo(-0.08, 0); p.lineTo(0.1, 0); p.bezierCurveTo(0.12, 0.12, 0.08, 0.2, 0.06, 0.22); p.lineTo(0.08, 0.3); p.lineTo(0.03, 0.26); p.lineTo(-0.02, 0.26); p.lineTo(-0.06, 0.3); p.lineTo(-0.05, 0.22); p.bezierCurveTo(-0.1, 0.18, -0.12, 0.08, -0.08, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#fbf6ec'; c.fillRect(-0.15, 0, 0.3, 0.32); c.fillStyle = '#e8963a'; c.beginPath(); c.ellipse(-0.06, 0.24, 0.06, 0.06, 0, 0, 7); c.fill(); c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0.07, 0.25, 0.04, 0.05, 0, 0, 7); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.007; [-0.015, 0.035].forEach((x) => { c.beginPath(); c.arc(x, 0.2, 0.011, 0.3, Math.PI - 0.3); c.stroke(); });
  c.fillStyle = '#c4362f'; c.fillRect(-0.06, 0.15, 0.12, 0.02);
}, { ppu: 1000, t: 0.02 });
function buildCat() { const m = cutout(catA()), g = group(m); g.userData.tick = (t) => { m.scale.y = 1 + Math.sin(t * 1.5) * 0.02; }; return g; }
// ── the secret: a shimaenaga (long-tailed tit), a fluffy white ball, on the wall behind the pagoda
const shimaA = () => cutoutAsset(K('shima'), (p) => { p.moveTo(-0.07, 0.02); p.lineTo(-0.2, 0.0); p.lineTo(-0.2, 0.02); p.lineTo(-0.07, 0.05); for (let i = 0; i <= 30; i++) { const a = Math.PI + (i / 30) * Math.PI * 2; p.lineTo(Math.cos(a) * 0.075, 0.07 + Math.sin(a) * 0.065); } p.closePath(); }, (c) => {
  c.fillStyle = '#fbfdff'; c.fillRect(-0.22, -0.02, 0.32, 0.18); c.fillStyle = '#2a2a30'; c.fillRect(-0.21, -0.01, 0.13, 0.03); c.fillStyle = '#e8c8d8'; c.beginPath(); c.ellipse(-0.04, 0.05, 0.03, 0.02, 0, 0, 7); c.fill();
  dab(c, -0.022, 0.085, 0.009, '#2a2420'); dab(c, 0.022, 0.085, 0.009, '#2a2420'); dab(c, 0, 0.072, 0.006, '#2a2420');
}, { ppu: 1400, t: 0.02 });
function buildShima() { const m = cutout(shimaA()), g = group(m); g.userData.tick = (t) => { m.scale.set(1 + Math.sin(t * 2) * 0.04, 1 - Math.sin(t * 2) * 0.04, 1); }; return g; }

// ── ground: snow, trodden paths, footprints
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#eef2f7', light: '#ffffff', shade: '#d3dceb', tufts: [] });
  c.fillStyle = '#d8d6ce'; c.beginPath(); rrect(c, -1.5, -0.8, 1.5, 0.6, 0.3); c.fill(); // trodden snow before the hall
  mottle(c, -1.5, -0.8, 3, 1.4, ['#c8c4bc', '#e8e6e0'], 30, [0.06, 0.15], 0.6);
  c.fillStyle = '#c4c0b8'; c.fillRect(-0.42, -2.5, 0.84, 2.6); // under the path
  for (let y = -2.3; y < 1.6; y += 0.17) { dab(c, -0.55 + Math.sin(y * 3) * 0.04, y, 0.022, '#c7d1e1'); dab(c, -0.62 + Math.sin(y * 3) * 0.04, y + 0.08, 0.022, '#c7d1e1'); dab(c, 0.55 - Math.sin(y * 2) * 0.04, y + 0.05, 0.022, '#c7d1e1'); }
  for (let i = 0; i < 40; i++) blob(c, rand(-3, 3), rand(-2.4, 2.4), rand(0.08, 0.2), pick(['#ffffff', '#e2e9f3']), 0.5, 0.4);
  tufts(c, -W / 2, -D / 2, W, D, ['#a89a7a', '#8f8468'], 120, (x) => Math.abs(x) < 1.6 || rnd() < 0.5, 0.8);
}

export const HATSUMODE: SceneDef = {
  id: 'hatsumode',
  title: 'Świątynia w Nowy Rok',
  jp: '初詣',
  season: 'zima, Nowy Rok',
  blurb: 'Pagoda, dzwonnica i noworoczna noc w śniegu.',
  box: ['#1f2a50', '#c8402f'],
  seed: 1231,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#e8eef5', '#ffffff'] },
  sky: {
    day: { grad: [[0, '#6a9ccf'], [0.5, '#a8c4e0'], [1, '#eaeef2']], cloud: '#f2f5f8', hi: '#ffffff', edge: '#f2f5f8', shadow: '#aebbd0' },
    evening: { grad: [[0, '#070b24'], [0.5, '#16204a'], [0.85, '#2e3a6c'], [1, '#5a5a88']], cloud: '#2a3462', hi: '#3a4678', edge: '#2a3462', shadow: '#1a2048', stars: true },
  },
  light: {
    day: { sky: '#e6eefc', ground: '#b8c0cc', hemi: 1.25, sun: '#fff4e6', sunI: 2.2, sunPos: [4, 7, 5], bloom: 0.03 },
    evening: { sky: '#4a5a98', ground: '#22283a', hemi: 0.8, sun: '#9fb4e0', sunI: 0.45, sunPos: [-4, 6, 3], bloom: 0.7 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['hills', 'wall', 'pines'] },
    { name: 'Pawilon', jp: '本堂', pieces: ['base', 'hall', 'roof', 'ridge', 'saisen'] },
    { name: 'Pagoda', jp: '五重塔', pieces: ['pagoda1', 'pagoda2', 'pagoda3', 'sorin'] },
    { name: 'Dzwonnica', jp: '鐘楼', pieces: ['belltower', 'bell', 'log', 'monk'] },
    { name: 'Dziedziniec', jp: '境内', pieces: ['gate', 'path', 'lanterns', 'burner', 'temizuya'] },
    { name: 'Nowy Rok', jp: '正月', pieces: ['kadomatsu', 'omikuji', 'ema', 'stall'] },
    { name: 'Goście', jp: '参拝客', pieces: ['family', 'grandma', 'kids', 'snowman'] },
    { name: 'Zwierzęta', jp: '生き物', pieces: ['dog', 'cat', 'sparrows'] },
  ],
  pieces: {
    hills: { name: 'Góry', pos: [0, 0, -2.45], build: () => group(cutout(hillsA())), sound: 'wind' },
    wall: { name: 'Mur', pos: [0, 0, -2.25], build: buildWall },
    pines: { name: 'Sosny', pos: [0, 0, 0], build: buildPines },
    base: { name: 'Podest', pos: [0, 0, HZ + 0.1], build: buildBase },
    hall: { name: 'Pawilon', pos: [0, BASE, HZ], build: buildHall },
    roof: { name: 'Dach', pos: [0, RY, HZ], build: buildRoof },
    ridge: { name: 'Kalenica', pos: [0, RY, HZ], build: buildRidge },
    saisen: { name: 'Datki', pos: [0, BASE, HZ + HD / 2 + 0.2], build: buildSaisen, sound: 'suzu' },
    pagoda1: { name: 'Pagoda I', pos: [PG.x, 0, PG.z], build: () => buildPagoda([0], true) },
    pagoda2: { name: 'Pagoda II', pos: [PG.x, 0, PG.z], build: () => buildPagoda([1, 2]) },
    pagoda3: { name: 'Pagoda III', pos: [PG.x, 0, PG.z], build: () => buildPagoda([3, 4]) },
    sorin: { name: 'Iglica', pos: [PG.x, 0, PG.z], build: buildSorin },
    belltower: { name: 'Dzwonnica', pos: [BT.x, 0, BT.z], build: buildBelltower },
    bell: { name: 'Dzwon', pos: [BT.x, 0, BT.z], build: buildBell },
    log: { name: 'Belka', pos: [BT.x, 0, BT.z], build: buildLog },
    monk: { name: 'Mnich', pos: [BT.x + 0.85, 0, BT.z + 0.45], rotY: -0.3, build: buildMonk },
    gate: { name: 'Brama', pos: [0, 0, 1.95], build: buildGate },
    path: { name: 'Ścieżka', pos: [0, 0, 0], build: buildPath },
    lanterns: { name: 'Latarnie', pos: [0, 0, 0], build: buildLanterns },
    burner: { name: 'Kadzidło', pos: [0, 0, 0.5], build: buildBurner },
    temizuya: { name: 'Źródełko', pos: [1.95, 0, 0.45], rotY: -0.2, build: buildTemizuya },
    kadomatsu: { name: 'Kadomatsu', pos: [0, 0, 2.15], build: buildKadomatsu },
    omikuji: { name: 'Wróżby', pos: [-1.95, 0, 0.6], rotY: 0.25, build: buildOmikuji },
    ema: { name: 'Tabliczki', pos: [1.5, 0, -0.08], rotY: -0.2, build: buildEma },
    stall: { name: 'Amazake', pos: [2.15, 0, 1.6], rotY: -0.25, build: buildStall },
    family: { name: 'Rodzina', pos: [1.0, 0, 0.95], build: buildFamily, sound: 'town' },
    grandma: { name: 'Babcia', pos: [-1.0, 0, 0.9], rotY: 0.2, build: buildGrandma },
    kids: { name: 'Dzieci', pos: [-1.75, 0, 1.75], rotY: 0.2, build: buildKids },
    snowman: { name: 'Bałwanek', pos: [-2.4, 0, 1.95], rotY: 0.3, build: () => group(cutout(snowmanA())) },
    dog: { name: 'Piesek', pos: [1.3, 0, 1.6], rotY: -0.2, build: () => group(cutout(dogA())) },
    cat: { name: 'Kot', pos: [-0.75, BASE, HZ + 0.1 + (HD + 0.5) / 2 - 0.12], build: buildCat },
    sparrows: { name: 'Wróble', pos: [0, 1.15 + 0.18 * Math.tan(RA) + 0.06, 1.95], build: buildSparrows },
  },
  secret: { name: 'sikorka shimaenaga', build: buildShima, pos: [PG.x + 0.1, WALL_H + 0.1, -2.25] },
  setup(ctx) {
    const { fx, scene } = ctx;
    const L = (col: string, d: number, x: number, y: number, z: number) => { const l = new THREE.PointLight(col, 0, d, 1.5); l.position.set(x, y, z); scene.add(l); return l; };
    const hall = L('#ffc070', 4, 0, 0.9, HZ + HD / 2 + 0.6), lanL = L('#ffc070', 2.5, -0.75, 0.75, 0.82), lanR = L('#ffc070', 2.5, 0.75, 0.75, 0.82), stall = L('#ffb060', 2, 2.15, 1.0, 1.95);
    const snow = fx.emitter(2, () => fx.snow(new V3(rand(-3.1, 3.1), rand(2.6, 3.8), rand(-2.3, 2.3))));
    const smoke = fx.emitter(0, () => fx.steam(new V3(rand(-0.1, 0.1), 0.55, 0.5 + rand(-0.1, 0.1)), '#d8d4d0', 1.2));
    const steam = fx.emitter(0, () => fx.steam(new V3(2.0, 0.6, 1.58), '#ffffff', 0.7));
    let lastP = 0;
    return {
      finale() { snow.rate = 8; },
      alive() { snow.rate = 8; },
      update(_dt, t, c) {
        const e = c.evening, on = (id: string) => (c.placed.has(id) ? e : 0);
        hallFront().emissiveIntensity = on('hall') * 0.6; hallSide().emissiveIntensity = on('hall') * 0.5;
        fireboxMat().emissiveIntensity = on('lanterns') * 1.5; lanternGlow().emissiveIntensity = Math.max(on('saisen'), on('stall')) * 0.8;
        emberMat().emissiveIntensity = 0.2 + on('burner') * 0.8 + Math.sin(t * 5) * 0.05;
        hall.intensity = on('hall') * 2.2; lanL.intensity = lanR.intensity = on('lanterns') * 1.6; stall.intensity = on('stall') * 1.6;
        smoke.rate = c.placed.has('burner') ? 1.3 : 0; steam.rate = c.placed.has('stall') ? 0.8 : 0;
        // the bell: struck by the log once per period, it sways and hums
        const p = ((t % BELL_PERIOD) + BELL_PERIOD) % BELL_PERIOD, bell = c.placed.get('bell');
        if (bell) { const since = p >= STRIKE ? p - STRIKE : 99; bell.userData.bell.rotation.z = c.placed.has('log') ? -Math.sin(since * 6) * 0.06 * Math.exp(-since * 0.8) : 0; }
        if (lastP < STRIKE && p >= STRIKE && bell && c.placed.has('log') && c.done && !c.quiet && audio()) sfx.kane();
        lastP = p;
      },
    };
  },
};
